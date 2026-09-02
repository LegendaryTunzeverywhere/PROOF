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

const PAYLOAD_SHAPES = {
  html: ['code'],
  'js-static': ['code', 'explanation'],
  text: ['text'],
  explain: ['text'],
  data: ['text'],
  business: ['text'],
  design: ['text'],
  conversation: ['text'],
};

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
      evaluator: template.evaluator,
      createdAt: now(),
    });
    this.store.save();
    return ch;
  }

  get(id) { return this.store.get('challenges', id); }

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
  startAttempt(userId, challengeId) {
    const ch = this.get(challengeId);
    if (!ch) throw Object.assign(new Error('Challenge not found.'), { code: 'NOT_FOUND', status: 404 });

    // resume open attempt
    const open = this.store.find('attempts', (a) => a.userId === userId && a.challengeId === challengeId && a.status === 'in_progress');
    if (open) return { attempt: open, resumed: true };

    // rate limit: min interval between submissions on the same challenge
    const last = this.store.filter('attempts', (a) => a.userId === userId && a.challengeId === challengeId && a.submittedAt)
      .sort((a, b) => b.submittedAt - a.submittedAt)[0];
    if (last) {
      const since = now() - last.submittedAt;
      if (since < this.config.economy.minAttemptIntervalMs) {
        throw Object.assign(new Error('Slow down a little — absorb the feedback first.'), {
          code: 'RATE_LIMITED', status: 429,
          retryInMs: this.config.economy.minAttemptIntervalMs - since,
        });
      }
    }

    const attempt = this.store.insert('attempts', {
      id: uid('at'), challengeId, userId, skillSlug: ch.skillSlug,
      status: 'in_progress', startedAt: now(), submittedAt: null,
      score: null, evaluationId: null, rewardClaimed: false, duplicate: false,
    });
    this.store.save();
    return { attempt, resumed: false };
  }

  getAttempt(userId, attemptId) {
    const a = this.store.get('attempts', attemptId);
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

  validatePayload(type, payload) {
    if (!payload || typeof payload !== 'object') throw Object.assign(new Error('Empty submission.'), { code: 'BAD_PAYLOAD', status: 400 });
    const bytes = JSON.stringify(payload).length;
    if (bytes > this.config.economy.maxSubmissionBytes)
      throw Object.assign(new Error('Submission too large.'), { code: 'TOO_LARGE', status: 413 });
    const clean = {};
    const allowed = PAYLOAD_SHAPES[type] || ['text'];
    for (const key of allowed) {
      const v = payload[key];
      if (typeof v === 'string') clean[key] = v.slice(0, this.config.economy.maxSubmissionBytes);
    }
    if (!Object.keys(clean).length)
      throw Object.assign(new Error('Submission is missing required content.'), { code: 'BAD_PAYLOAD', status: 400 });
    return clean;
  }

  async submitAttempt(userId, attemptId, rawPayload) {
    const attempt = this.getAttempt(userId, attemptId);
    if (attempt.status !== 'in_progress')
      throw Object.assign(new Error('This attempt was already submitted.'), { code: 'ALREADY_SUBMITTED', status: 409 });
    const ch = this.get(attempt.challengeId);
    const payload = this.validatePayload(ch.type, rawPayload);

    // ── typing verification (anti paste / anti AI-dump) ──
    let typingMeta = null;
    let typedOk = true;
    if (this.config.economy.typingVerification) {
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
      this.store.save();
    }

    // ── duplicate-content check BEFORE evaluation (prevents race conditions) ──
    const { generateContentHash } = await import('../ai/evaluators.js');
    const contentHash = generateContentHash(payload, ch.type);
    const previousHashes = this.evaluations.previousHashes(userId, ch.id);
    const isDuplicate = previousHashes.includes(contentHash);
    
    if (isDuplicate) {
      // Mark as duplicate and skip evaluation entirely
      attempt.status = 'failed';
      attempt.score = 0;
      attempt.duplicate = true;
      attempt.typed = typedOk;
      attempt.submittedAt = now();
      this.store.save();
      
      throw Object.assign(new Error('This submission is identical to one you already submitted. Proofs must be original work.'), { code: 'DUPLICATE_SUBMISSION', status: 409 });
    }

    // Now run evaluation (no race condition since we checked hash first)
    const { evaluation, weaknesses } = await this.evaluations.evaluate({ userId, challenge: ch, payload });
    
    attempt.typed = typedOk;
    attempt.duplicate = false;

    attempt.status = evaluation.pass ? 'passed' : 'failed';
    attempt.score = evaluation.score;
    attempt.evaluationId = evaluation.id;
    attempt.submittedAt = now();
    this.store.save();

    // ── skill + user progression ──
    let skillResult = null;
    const user = this.users.get(userId);
    user.proofsAttempted = (user.proofsAttempted || 0) + 1;
    if (evaluation.pass) user.proofsPassed = (user.proofsPassed || 0) + 1;

    if (ch.skillSlug) skillResult = this.skills.applyProofResult(userId, ch.skillSlug, {
      score: evaluation.score, passed: evaluation.pass, challengeKind: ch.kind,
    });

    const proof = this.skills.recordProof({
      userId, skillSlug: ch.skillSlug, challengeId: ch.id, challengeTitle: ch.title,
      kind: ch.kind, score: evaluation.score, passed: evaluation.pass, evaluationId: evaluation.id,
    });

    const xpGain = evaluation.pass ? ch.xp : 10;
    const xp = this.users.addXp(userId, xpGain, evaluation.pass ? 'Proof passed' : 'Attempt');
    this.users.touchStreak(userId);

    // ── economy ──
    let rewardResult = { granted: false, reason: 'NOT_ELIGIBLE' };
    // For daily challenges, use current date in reward key to prevent cross-day duplicates
    const todayKey = new Date().toISOString().slice(0, 10);
    const rewardKey = ch.kind === 'daily' ? `${userId}:daily:${todayKey}` : `${userId}:${ch.id}`;
    rewardResult = this.rewards.rewardForAttempt({
      userId, challenge: ch, attempt, evaluation,
      sourceKind: ch.kind === 'daily' ? 'daily' : 'challenge',
      sourceKey: rewardKey,
    });
    if (rewardResult.granted) attempt.rewardClaimed = true;
    this.store.save();

    // ── gamification & notifications ──
    const newAchievements = this.users.checkAchievements(userId);
    if (evaluation.pass) {
      this.notify.push(userId, {
        type: 'proof_passed', emoji: '✅',
        title: `You passed: ${ch.title}`,
        body: rewardResult.granted ? `+${ch.xp} XP · +${rewardResult.amountNim} NIM` : `+${ch.xp} XP`,
        href: `#/proof/${proof.publicId}`,
      });
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

    const qualification = this.qualificationSnapshot(userId);
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

  attemptResult(userId, attemptId) {
    const attempt = this.getAttempt(userId, attemptId);
    const evaluation = attempt.evaluationId ? this.store.get('evaluations', attempt.evaluationId) : null;
    const ch = this.get(attempt.challengeId);
    return { attempt, evaluation, challenge: ch };
  }

  async userAttempts(userId, limit = 30) {
    const filtered = await this.store.filter('attempts', (a) => a.userId === userId && a.submittedAt);
    return filtered
      .sort((a, b) => b.submittedAt - a.submittedAt)
      .slice(0, limit)
      .map((a) => ({ ...a, challenge: this.get(a.challengeId) }));
  }
}
