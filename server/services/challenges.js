/**
 * ChallengeService — the PROOF pipeline:
 *   start attempt → submit payload → server-side evaluation → skill update
 *   → reward eligibility → XP/streak/achievements → notifications.
 *
 * Anti-cheat (spec §11, §20):
 *  - attempts and submissions exist only server-side (server-issued IDs)
 *  - clients cannot send scores, XP, or rewards (payloads are content only)
 *  - minimum interval between submissions of the same challenge
 *  - duplicate-content hash check per user+challenge
 *  - daily rewarded-attempt / reward-amount caps (RewardService)
 */
import { uid, now, clamp } from '../util.js';
import { EvaluationService } from './evaluation.js';
import { dailyChallengeFor } from '../ai/engine.js';
import { Chess } from 'chess.js';

const PAYLOAD_SHAPES = {
  html: ['code'],
  'js-static': ['code', 'explanation'],
  text: ['text'],
  explain: ['text'],
  data: ['text'],
  business: ['text'],
  design: ['text'],
  conversation: ['text'],
  speech: ['transcript'],
  chess: ['positions'],
};

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function normalizedChessEntries(entries, label, fallbackFen) {
  if (Array.isArray(entries)) {
    return entries.slice(0, 8).map((entry, index) => ({
      name: String(entry?.name || entry?.opening || entry?.theme || `${label} ${index + 1}`).slice(0, 80),
      fen: String(entry?.fen || fallbackFen).slice(0, 160),
      task: String(entry?.task || entry?.objective || entry?.opening || '').slice(0, 500),
      hint: String(entry?.hint || '').slice(0, 300),
      correctMoves: Array.isArray(entry?.correctMoves) ? entry.correctMoves.slice(0, 20).map(String) : undefined,
      solution: Array.isArray(entry?.solution) ? entry.solution.slice(0, 20).map(String) : undefined,
    }));
  }
  if (Number.isInteger(entries) && entries > 0) {
    return Array.from({ length: Math.min(entries, 8) }, (_, index) => ({
      name: `${label} ${index + 1}`,
      fen: fallbackFen,
      task: `${label} ${index + 1}: play a legal continuation.`,
      hint: 'Use the AI analysis to choose a legal continuation.',
    }));
  }
  return [];
}

/** Keep only the board data a challenge runner needs; curriculum prose stays server-side. */
export function chessConfigFromTemplate(template = {}) {
  if (template.type !== 'chess') return null;
  const fallbackFen = template.fen === 'start' ? STARTING_FEN : String(template.fen || STARTING_FEN).slice(0, 160);
  const position = (entry = {}) => ({
    name: String(entry.name || entry.theme || '').slice(0, 80),
    fen: String(entry.fen || '').slice(0, 160),
    task: String(entry.task || entry.objective || '').slice(0, 500),
    hint: String(entry.hint || '').slice(0, 300),
    correctMoves: Array.isArray(entry.correctMoves) ? entry.correctMoves.slice(0, 20).map(String) : undefined,
    solution: Array.isArray(entry.solution) ? entry.solution.slice(0, 20).map(String) : undefined,
  });
  return {
    fen: fallbackFen,
    tasks: Array.isArray(template.tasks) ? template.tasks.slice(0, 8).map((task) => String(task).slice(0, 300)) : [],
    scenarios: normalizedChessEntries(template.scenarios, 'Scenario', fallbackFen).map(position),
    positions: normalizedChessEntries(template.positions, 'Position', fallbackFen).map(position),
    puzzles: normalizedChessEntries(template.puzzles, 'Puzzle', fallbackFen).map(position),
  };
}

/** Stored inside evaluator JSONB for Supabase compatibility; legacy JSON rows may use `challenge.chess`. */
export function chessConfigFromChallenge(challenge = {}) {
  const chess = challenge.chess || challenge.evaluator?.chess || null;
  return chess ? chessConfigFromTemplate({ type: 'chess', ...chess }) : null;
}

export class ChallengeService {
  constructor(store, config, { users, skills, rewards, notifications }) {
    this.store = store;
    this.config = config;
    this.users = users;
    this.skills = skills;
    this.rewards = rewards;
    this.notify = notifications;
    this.evaluations = new EvaluationService(store, config);
    /** @type {{key: string, challenge: object}|null} per-day memo of the daily challenge */
    this.#dailyCache = null;
  }

  #dailyCache;

  /* ── challenge creation (from generated paths & daily) ─────────── */
  createFromTemplate({ skillSlug, template, pathId = null, dayIndex = null, kindOverride = null }) {
    const ch = this.store.insert('challenges', {
      id: uid('ch'),
      skillSlug,
      pathId,
      dayIndex,
      kind: kindOverride || template.kind || 'proof',
      type: template.type,
      title: template.title,
      brief: template.brief,
      requirements: template.requirements || [],
      timeMin: template.timeMin || 30,
      passScore: template.passScore ?? this.config.economy.passThreshold,
      rewardNim: template.rewardNim || 0,
      xp: template.xp || 100,
      evaluator: template.type === 'chess'
        ? { ...(template.evaluator || {}), chess: chessConfigFromTemplate(template) }
        : template.evaluator,
      createdAt: now(),
    });
    this.store.save();
    return ch;
  }

  async get(id) { return await this.store.get('challenges', id); }

  /** The daily challenge — deterministic per day, one reward per user per day. */
  async todayDaily() {
    const dateKey = new Date().toISOString().slice(0, 10);
    // Process-level cache: the daily challenge is stable for a whole day, so we
    // avoid a DB round-trip (Supabase) or a full-table scan on every request.
    if (this.#dailyCache && this.#dailyCache.key === dateKey) return this.#dailyCache.challenge;

    let ch = null;
    try {
      ch = await this.store.findOptimized('challenges', { kind: 'daily', dailyKey: dateKey });
    } catch {
      ch = null; // fall through to in-memory scan below
    }
    if (!ch) {
      ch = await this.store.find('challenges', (c) => c.kind === 'daily' && c.dailyKey === dateKey);
    }
    if (!ch) {
      const d = dailyChallengeFor(dateKey);
      ch = await this.store.insert('challenges', {
        id: uid('ch'), skillSlug: null, pathId: null, dailyKey: dateKey,
        kind: 'daily', type: d.type, title: d.title, brief: d.brief,
        requirements: ['your own words', 'concrete example', d.evaluator.config.minWords + '+ words'],
        timeMin: 10, passScore: d.passScore, rewardNim: d.rewardNim, xp: d.xp,
        evaluator: d.evaluator, createdAt: now(),
      });
      this.store.save();
    }
    this.#dailyCache = { key: dateKey, challenge: ch };
    return ch;
  }

  /* ── attempts ──────────────────────────────────────────────────── */
  async startAttempt(userId, challengeId) {
    const ch = await this.get(challengeId);
    if (!ch) throw Object.assign(new Error('Challenge not found.'), { code: 'NOT_FOUND', status: 404 });

    const passed = await this.store.find('attempts', (a) =>
      a.userId === userId && a.challengeId === challengeId && a.status === 'passed'
    );
    if (passed) {
      throw Object.assign(new Error('This proof has already been passed. It cannot be submitted again.'), {
        code: 'ALREADY_PASSED', status: 409,
      });
    }

    // resume open attempt
    const open = await this.store.find('attempts', (a) => a.userId === userId && a.challengeId === challengeId && a.status === 'in_progress');
    if (open) return { attempt: open, resumed: true };

    // rate limit: min interval between submissions on the same challenge
    const attempts = await this.store.filter('attempts', (a) => a.userId === userId && a.challengeId === challengeId && a.submittedAt);
    const last = attempts.sort((a, b) => b.submittedAt - a.submittedAt)[0];
    if (last) {
      const since = now() - last.submittedAt;
      if (since < this.config.economy.minAttemptIntervalMs) {
        throw Object.assign(new Error('Slow down a little — absorb the feedback first.'), {
          code: 'RATE_LIMITED', status: 429,
          retryInMs: this.config.economy.minAttemptIntervalMs - since,
        });
      }
    }

    const attempt = await this.store.insert('attempts', {
      id: uid('at'), challengeId, userId, skillSlug: ch.skillSlug,
      status: 'in_progress', startedAt: now(), submittedAt: null,
      score: null, evaluationId: null, rewardClaimed: false, duplicate: false,
    });
    await this.store.save();
    return { attempt, resumed: false };
  }

  async getAttempt(userId, attemptId) {
    const a = await this.store.get('attempts', attemptId);
    if (!a || a.userId !== userId) throw Object.assign(new Error('Attempt not found.'), { code: 'NOT_FOUND', status: 404 });
    return a;
  }

  /**
   * Sanitize client-reported typing telemetry. Only sane non-negative
   * integers pass; anything malformed → null (treated as missing).
   */
  #typingMeta(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const int = (v, max) => {
      const n = Math.round(Number(v));
      return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : -1;
    };
    const effort = int(raw.effort, 500_000);
    const pastes = int(raw.pastes, 1_000);
    const ms = int(raw.ms, 86_400_000);
    if (effort < 0 || pastes < 0 || ms < 0) return null;
    return { effort, pastes, ms };
  }

  /**
   * Plausibility floor for human hand-typing, given content length:
   *  - ≥ 1 edit event per ~8 characters (mobile word-suggestions ≈ 1 per 5-6)
   *  - ≥ 5 ms per character elapsed (≈ far slower than any human)
   * Honest note: a custom client can fabricate telemetry — see SECURITY.md.
   */
  #typingPlausible(meta, chars) {
    if (chars < 10) return true;
    const minEffort = Math.max(8, Math.ceil(chars * 0.12));
    const minMs = Math.max(1500, Math.ceil(chars * 5));
    return meta.effort >= minEffort && meta.ms >= minMs;
  }

  validatePayload(type, payload, challenge = null) {
    if (!payload || typeof payload !== 'object') throw Object.assign(new Error('Empty submission.'), { code: 'BAD_PAYLOAD', status: 400 });
    const bytes = JSON.stringify(payload).length;
    if (bytes > this.config.economy.maxSubmissionBytes)
      throw Object.assign(new Error('Submission too large.'), { code: 'TOO_LARGE', status: 413 });
    const clean = {};
    // Fallback for legacy challenges without type field: infer from payload keys
    // If payload has 'code', assume 'html'; if 'explanation', assume 'js-static'; else 'text'
    let actualType = type;
    if (!actualType || actualType === 'undefined') {
      if (payload.code && payload.explanation) actualType = 'js-static';
      else if (payload.code) actualType = 'html';
      else actualType = 'text';
      console.log(`[validatePayload] type was undefined, inferred as '${actualType}' from payload keys`);
    }
    if (actualType === 'chess') return this.#validateChessPayload(payload, challenge);
    const allowed = PAYLOAD_SHAPES[actualType] || ['text'];
    console.log(`[validatePayload] type=${actualType}, allowed=${JSON.stringify(allowed)}, payload keys=${JSON.stringify(Object.keys(payload))}`);
    for (const key of allowed) {
      const v = payload[key];
      if (typeof v === 'string') clean[key] = v.slice(0, this.config.economy.maxSubmissionBytes);
    }
    console.log(`[validatePayload] clean keys=${JSON.stringify(Object.keys(clean))}`);
    if (!Object.keys(clean).length)
      throw Object.assign(new Error('Submission is missing required content.'), { code: 'BAD_PAYLOAD', status: 400 });
    return clean;
  }

  /** Replays every submitted SAN move from its FEN. Only server-verified lines reach evaluation. */
  #validateChessPayload(payload, challenge) {
    if (!Array.isArray(payload.positions) || !payload.positions.length) {
      throw Object.assign(new Error('Make at least one legal move on the chessboard before submitting.'), { code: 'BAD_PAYLOAD', status: 400 });
    }
    const chess = chessConfigFromChallenge(challenge);
    const configured = chess
      ? [...(chess.scenarios || []), ...(chess.positions || []), ...(chess.puzzles || [])]
      : [];
    const usedKeys = new Set();
    const positions = payload.positions.slice(0, 8).map((entry) => {
      const positionKey = Number.isInteger(entry?.positionKey) ? entry.positionKey : null;
      const initialFen = typeof entry?.initialFen === 'string' ? entry.initialFen.slice(0, 160) : '';
      const submittedMoves = Array.isArray(entry?.moves) ? entry.moves.slice(0, 40) : [];
      if (!initialFen || !submittedMoves.length) {
        throw Object.assign(new Error('Each chess line needs a starting FEN and at least one move.'), { code: 'BAD_PAYLOAD', status: 400 });
      }
      if (configured.length && (positionKey === null || positionKey < 0 || positionKey >= configured.length)) {
        throw Object.assign(new Error('This chess position is not part of the challenge.'), { code: 'BAD_PAYLOAD', status: 400 });
      }
      if (positionKey !== null && usedKeys.has(positionKey)) {
        throw Object.assign(new Error('Submit one move line per chess position.'), { code: 'BAD_PAYLOAD', status: 400 });
      }
      if (positionKey !== null) usedKeys.add(positionKey);
      if (positionKey !== null && configured[positionKey] && configured[positionKey].fen !== initialFen) {
        throw Object.assign(new Error('This move line does not match its challenge position.'), { code: 'BAD_PAYLOAD', status: 400 });
      }
      let game;
      try {
        game = new Chess(initialFen);
      } catch {
        throw Object.assign(new Error('That chess position is invalid.'), { code: 'BAD_PAYLOAD', status: 400 });
      }
      const moves = [];
      const moveDetails = [];
      for (const notation of submittedMoves) {
        if (typeof notation !== 'string' || notation.length > 32) {
          throw Object.assign(new Error('A chess move is malformed.'), { code: 'BAD_PAYLOAD', status: 400 });
        }
        try {
          const move = game.move(notation, { strict: true });
          if (!move) throw new Error('illegal');
          moves.push(move.san);
          // Keep rule-level information from chess.js for deterministic proof
          // evaluation. The browser only sends SAN; the server derives these
          // flags after replaying every move from the challenge FEN.
          moveDetails.push({
            san: move.san,
            flags: move.flags,
            promotion: move.promotion || null,
          });
        } catch {
          throw Object.assign(new Error(`Illegal chess move: ${notation}`), { code: 'ILLEGAL_MOVE', status: 400 });
        }
      }
      return {
        positionKey,
        initialFen,
        finalFen: game.fen(),
        moves,
        moveDetails,
        outcome: game.isCheckmate() ? 'checkmate' : game.isStalemate() ? 'stalemate' : game.isDraw() ? 'draw' : 'active',
      };
    });
    return { positions };
  }

  async submitAttempt(userId, attemptId, rawPayload) {
    const attempt = await this.getAttempt(userId, attemptId);
    if (attempt.status !== 'in_progress')
      throw Object.assign(new Error('This attempt was already submitted.'), { code: 'ALREADY_SUBMITTED', status: 409 });
    const ch = await this.get(attempt.challengeId);

    const passed = await this.store.find('attempts', (candidate) =>
      candidate.userId === userId && candidate.challengeId === ch.id &&
      candidate.status === 'passed' && candidate.id !== attempt.id
    );
    if (passed) {
      throw Object.assign(new Error('This proof has already been passed. It cannot be submitted again.'), {
        code: 'ALREADY_PASSED', status: 409,
      });
    }

    const payload = this.validatePayload(ch.type, rawPayload, ch);

    // ── typing verification (anti paste / anti AI-dump) ──
    let typingMeta = null;
    let typedOk = true;
    // A chess proof is live interaction: every move is already replayed and
    // legality-checked on the server. Typing telemetry is for written proofs,
    // not for a FEN board with no text field to type into.
    if (this.config.economy.typingVerification && ch.type !== 'chess' && ch.type !== 'speech') {
      typingMeta = this.#typingMeta(rawPayload.meta);
      if (!typingMeta)
        throw Object.assign(new Error('Typing verification required: proofs must be typed live in the PROOF app. Reload the app and type your submission.'), { code: 'TYPING_REQUIRED', status: 400 });
      if (typingMeta.pastes > 0)
        throw Object.assign(new Error('Paste detected. PROOFS must be hand-typed — no copy-paste, no AI dumps. Type it yourself and resubmit.'), { code: 'PASTE_DETECTED', status: 403 });
      
      // Plausibility check BEFORE evaluation to prevent wasting AI resources on fake submissions
      const chars = Object.values(payload).join('').length;
      typedOk = this.#typingPlausible(typingMeta, chars);
      if (!typedOk) {
        throw Object.assign(new Error('Hand-typing verification failed: this submission arrived too fast or with too few keystrokes to be human-typed. Proofs must be typed live — no pasting, no dictation dumps, no generated text.'), { code: 'TYPING_IMPLAUSIBLE', status: 403 });
      }
      
      attempt.typingMeta = typingMeta;
      await this.store.update('attempts', attempt.id, { typingMeta });
      await this.store.save();
    }

    // ── duplicate-content check BEFORE evaluation (prevents race conditions) ──
    const { generateContentHash } = await import('../ai/evaluators.js');
    const contentHash = generateContentHash(payload, ch.type);
    const previousHashes = await this.evaluations.previousHashes(userId, ch.id);
    const isDuplicate = previousHashes.includes(contentHash);
    
    if (isDuplicate) {
      // Mark as duplicate and skip evaluation entirely
      attempt.status = 'failed';
      attempt.score = 0;
      attempt.duplicate = true;
      attempt.typed = typedOk;
      attempt.submittedAt = now();
      await this.store.update('attempts', attempt.id, {
        status: attempt.status, score: attempt.score, duplicate: attempt.duplicate,
        typed: attempt.typed, submittedAt: attempt.submittedAt,
      });
      await this.store.save();
      
      throw Object.assign(new Error('This submission is identical to one you already submitted. Proofs must be original work.'), { code: 'DUPLICATE_SUBMISSION', status: 409 });
    }

    // Now run evaluation (no race condition since we checked hash first)
    const { evaluation, weaknesses } = await this.evaluations.evaluate({ userId, attemptId: attempt.id, challenge: ch, payload });
    
    console.log(`[submitAttempt] evaluation result:`, { score: evaluation.score, pass: evaluation.pass, id: evaluation.id });
    
    attempt.typed = typedOk;
    attempt.duplicate = false;

    attempt.status = evaluation.pass ? 'passed' : 'failed';
    attempt.score = evaluation.score;
    attempt.evaluationId = evaluation.id;
    attempt.submittedAt = now();
    await this.store.update('attempts', attempt.id, {
      typed: attempt.typed, duplicate: attempt.duplicate, status: attempt.status,
      score: attempt.score, evaluationId: attempt.evaluationId, submittedAt: attempt.submittedAt,
    });
    await this.store.save();

    // ── skill + user progression ──
    let skillResult = null;
    const user = this.users.get(userId);
    const proofsAttempted = (user.proofsAttempted || 0) + 1;
    const proofsPassed = evaluation.pass ? (user.proofsPassed || 0) + 1 : (user.proofsPassed || 0);
    await this.store.update('users', userId, { proofsAttempted, proofsPassed, updatedAt: now() });

    if (ch.skillSlug) skillResult = await this.skills.applyProofResult(userId, ch.skillSlug, {
      score: evaluation.score, passed: evaluation.pass, challengeKind: ch.kind,
    });

    const proof = ch.skillSlug
      ? await this.skills.recordProof({
          userId, skillSlug: ch.skillSlug, challengeId: ch.id, challengeTitle: ch.title,
          kind: ch.kind, score: evaluation.score, passed: evaluation.pass, evaluationId: evaluation.id,
        })
      : null;
    
    console.log(`[submitAttempt] recording proof with score=${evaluation.score}, passed=${evaluation.pass}, skillSlug=${ch.skillSlug || 'none'}`);

    const xpGain = evaluation.pass ? ch.xp : 10;
    const xp = await this.users.addXp(userId, xpGain, evaluation.pass ? 'Proof passed' : 'Attempt');
    await this.users.touchStreak(userId);

    // ── economy ──
    let rewardResult = { granted: false, reason: 'NOT_ELIGIBLE' };
    // For daily challenges, use current date in reward key to prevent cross-day duplicates
    const todayKey = new Date().toISOString().slice(0, 10);
    const rewardKey = ch.kind === 'daily' ? `${userId}:daily:${todayKey}` : `${userId}:${ch.id}`;
    rewardResult = await this.rewards.rewardForAttempt({
      userId, challenge: ch, attempt, evaluation,
      sourceKind: ch.kind === 'daily' ? 'daily' : 'challenge',
      sourceKey: rewardKey,
    });
    if (rewardResult.granted) {
      attempt.rewardClaimed = true;
      await this.store.update('attempts', attempt.id, { rewardClaimed: true });
    }
    await this.store.save();

    // ── gamification & notifications ──
    const newAchievements = await this.users.checkAchievements(userId);
    const treasuryConfigured = Boolean(this.rewards.treasury?.isConfigured?.());
    const payoutSent = Boolean(rewardResult.payout?.ref);
    if (evaluation.pass) {
      const rewardMessage = rewardResult.granted
        ? payoutSent
          ? `+${ch.xp} XP · +${rewardResult.amountNim} NIM sent to your connected wallet.`
          : treasuryConfigured
            ? `+${ch.xp} XP · ${rewardResult.amountNim} NIM credited; wallet payout is pending.`
            : `+${ch.xp} XP · +${rewardResult.amountNim} NIM added to your PROOF balance.`
        : `+${ch.xp} XP`;
      this.notify.push(userId, {
        type: 'proof_passed', emoji: '✅',
        title: `You passed: ${ch.title}`,
        body: rewardMessage,
        href: proof ? `#/proof/${proof.publicId}` : '#/profile',
      });
      if (payoutSent) {
        this.notify.push(userId, {
          type: 'payout_sent', emoji: '💸',
          title: 'NIM sent to your connected wallet',
          body: `${rewardResult.amountNim} NIM · transaction ${rewardResult.payout.ref}`,
          href: '#/profile',
        });
      }
    } else {
      this.notify.push(userId, {
        type: 'proof_failed', emoji: '📝',
        title: `Feedback ready: ${ch.title}`,
        body: `${evaluation.score}/100 — so close. See what to improve.`,
        href: `#/attempt/${attempt.id}`,
      });
    }
    for (const a of newAchievements)
      this.notify.push(userId, { type: 'achievement', emoji: a.emoji, title: `Achievement: ${a.name}`, body: a.desc, href: '#/profile' });
    if (skillResult && !skillResult.before.verified && skillResult.userSkill.verified) {
      this.notify.push(userId, {
        type: 'skill_verified', emoji: '♢',
        title: `Skill verified: ${String(ch.skillSlug).replace(/-/g, ' ')}`,
        body: `Score ${skillResult.userSkill.score}/100 — ${skillResult.userSkill.tier} tier.`,
        href: '#/profile',
      });
    }

    const qualification = await this.qualificationSnapshot(userId);
    return {
      attempt, evaluation, weaknesses, proof,
      reward: rewardResult, xpGained: xpGain, leveledUp: xp.leveledUp, newLevel: xp.newLevel || null,
      skill: skillResult ? {
        slug: ch.skillSlug, score: skillResult.userSkill.score, tier: skillResult.userSkill.tier,
        verified: skillResult.userSkill.verified, previousScore: skillResult.before.score,
      } : null,
      newAchievements,
      qualification,
    };
  }

  /** "You qualify for N opportunities" — verified skills × open market demand. */
  async qualificationSnapshot(userId) {
    const skills = await this.skills.userSkills(userId);
    const tasks = await this.store.all('marketplace_tasks');
    let count = 0;
    for (const t of tasks) {
      const req = t.minProof;
      if (!req) { count++; continue; }
      const us = skills.find((s) => s.skillSlug === req.skillSlug);
      if (us && us.score >= req.min) count++;
    }
    return { opportunities: count };
  }

  async attemptResult(userId, attemptId) {
    const attempt = await this.getAttempt(userId, attemptId);
    const evaluation = attempt.evaluationId ? await this.store.get('evaluations', attempt.evaluationId) : null;
    const ch = await this.get(attempt.challengeId);
    return { attempt, evaluation, challenge: ch };
  }

  async userAttempts(userId, limit = 30) {
    const filtered = await this.store.filter('attempts', (a) => a.userId === userId && a.submittedAt);
    const sorted = filtered
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .slice(0, limit);
    // Fetch challenges for each attempt
    const withChallenges = await Promise.all(
      sorted.map(async (a) => ({ ...a, challenge: await this.get(a.challengeId) }))
    );
    return withChallenges;
  }
}
