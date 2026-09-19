/**
 * PROOF — server entry. Zero-dependency Node HTTP server.
 * Serves: JSON API (/api/*) · static SPA (web/) · public proof pages (/p/:id)
 *         · share cards (/share/:id.svg)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config, validateConfig } from './config.js';
import { seed } from './seed.js';
import { AuthService, sessionCookie, clearSessionCookie } from './auth.js';
import { UserService } from './services/users.js';
import { SkillService } from './services/skills.js';
import { RewardService } from './services/rewards.js';
import { NotificationService } from './services/notifications.js';
import { ChallengeService, chessConfigFromTemplate, chessConfigFromChallenge } from './services/challenges.js';
import { MarketplaceService } from './services/marketplace.js';
import { TeachingService } from './services/teaching.js';
import { generateLearningPath, generateLesson, recommendNextSkill, tutorReply, detectDomain } from './ai/service.js';
import { languageSpeechTargets } from './ai/engine.js';
import { createCurriculumFromDocument, getUserDocumentCurricula, getDocumentCurriculum, documentTutorReply } from './services/document-curriculum.js';
import { cleanupDuplicateSkillPaths } from './services/path-dedupe.js';
import { uid, now, toNim, escapeHtml, RateLimiter, looksLikeNimiqAddress, normalizeNimiqAddress, validate, parseNumber, hmac, kindIncludesReward, shortTxRef } from './util.js';
import * as stockfish from './ai/services/stockfish.js';
import { buildPuzzleHint, normalizeUserMoves, resolvePuzzleTurn } from './chess-hints.js';
import multer from 'multer';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, '../web');

/* ── boot ──────────────────────────────────────────────────────────── */
// Use the embedded JSON store by default (zero npm dependencies). Only when
// DB_MODE=supabase do we dynamic-import the Supabase store — and with it the
// @supabase/supabase-js dependency — so a fresh clone boots with `npm start`.
const { Store } = await import('./store.js');
const store = process.env.DB_MODE === 'supabase'
  ? await (await import('./supabase-store.js')).createStore()
  : await new Store().open();
if (store instanceof Store) {
  // Only seed if using in-memory store (Supabase data managed separately)
  if (!fs.existsSync(path.join(config.dataDir, 'proof.json'))) {
    await seed(store);
  }
} else {
  // Using Supabase - seed only if tables are empty
  console.log('🗄️  Using Supabase - checking if seed needed...');
  const skillCount = await store.count('skills');
  if (skillCount === 0) {
    console.log('📦 Seeding Supabase with demo data...');
    try {
      await seed(store);
      console.log('✅ Seed completed');
    } catch (err) {
      console.error('❌ Seed failed:', err.message);
      console.error('   Server will continue without demo data');
    }
  }
}
validateConfig(console);

const auth = new AuthService(store, config);
const users = new UserService(store, config);
const skills = new SkillService(store, config);
const rewards = new RewardService(store, config);
const notifications = new NotificationService(store);
const challenges = new ChallengeService(store, config, { users, skills, rewards, notifications });
const market = new MarketplaceService(store, config, { users, skills, rewards, notifications, treasury: rewards.treasury });
const teaching = new TeachingService(store, config, { users, skills, rewards, notifications });

// Export store for other modules
export { store };

skills.seedCatalog();
await seedRelations({ users, skills, market, teaching });
console.log(`[proof] ready · engine=${config.ai.apiKey ? 'llm+engine' : 'engine'} · network=${config.nimiq.rpcUrl ? 'nimiq-rpc' : 'demo-ledger'}`);

const payoutRetryTimer = setInterval(() => {
  rewards.retryPendingPayouts().catch((error) => console.error('[rewards] retry worker failed:', error.message));
}, 60_000);
payoutRetryTimer.unref?.();

const streakReminderTimer = setInterval(() => {
  rewards.sendStreakReminders().catch((error) => console.error('[streak] reminder worker failed:', error.message));
}, 6 * 60 * 60 * 1000);
streakReminderTimer.unref?.();
rewards.sendStreakReminders().catch((error) => console.error('[streak] initial reminder worker failed:', error.message));

await cleanupDuplicateSkillPaths(store).catch((error) => console.error('[paths] cleanup failed at startup:', error.message));

/* ── Multer setup for document uploads ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const allowedExts = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Upload PDF, DOCX, or TXT.'), false);
    }
  },
});

async function seedRelations({ users, skills, market, teaching }) {
  // Keep the marketplace task table empty unless a real poster creates a task.
  // Clear any stale persisted rows from older seeded/mock fixtures so the
  // work feed never reports fabricated open task counts at startup.
  const tasks = await store.all('marketplace_tasks');
  for (const task of tasks) {
    await store.remove('marketplace_tasks', task.id);
  }
  await store.save();
}

/* ── tiny routing framework ────────────────────────────────────────── */
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, pattern, handler });

function json(res, status, data, headers = {}) {
  // Dev guard: an un-awaited async service call serializes to {} — catch it loudly
  // instead of letting the client silently receive empty objects.
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const [k, v] of Object.entries(data)) {
      if (v instanceof Promise) console.warn(`[proof] BUG: response field "${k}" is an un-awaited Promise (will serialize to {}). Await it in the route handler.`);
    }
  }
  const body = JSON.stringify(data);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(body);
}
const httpError = (status, code, message, extra = {}) => Object.assign(new Error(message), { status, code, ...extra });

async function synthesizeWithPiper(text, lang, speed = 1) {
  const language = lang.split('-')[0].toLowerCase();
  const model = process.env[`PIPER_MODEL_${language.toUpperCase()}`] || process.env.PIPER_MODEL;
  const binary = process.env.PIPER_BIN || 'piper';
  if (!model) throw httpError(503, 'TTS_NOT_CONFIGURED', 'Piper TTS is not configured for this language.');

  const cacheDir = process.env.TTS_CACHE_DIR || path.join(config.dataDir, 'tts-cache');
  const cacheKey = createHash('sha256').update(`${language}\0${speed}\0${text}`).digest('hex');
  const cachedFile = path.join(cacheDir, `${cacheKey}.wav`);
  try {
    return await fs.promises.readFile(cachedFile);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.promises.mkdir(cacheDir, { recursive: true });
  const outputDir = await fs.promises.mkdtemp(path.join(process.env.TEMP || process.env.TMP || '/tmp', 'proof-piper-'));
  const outputFile = path.join(outputDir, 'speech.wav');
  const timeoutMs = Number(process.env.PIPER_TIMEOUT_MS || 15000);

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(binary, ['--model', model, '--length_scale', String(1 / speed), '--output_file', outputFile], { stdio: ['pipe', 'ignore', 'pipe'] });
      let stderr = '';
      const timeout = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Piper TTS timed out.'));
      }, timeoutMs);
      child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      child.on('error', reject);
      child.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(stderr.trim() || `Piper exited with code ${code}.`));
      });
      child.stdin.end(text);
    });
    const audioContent = await fs.promises.readFile(outputFile);
    await fs.promises.writeFile(cachedFile, audioContent);
    return audioContent;
  } catch (error) {
    if (error?.code === 'ENOENT') throw httpError(503, 'TTS_NOT_CONFIGURED', 'Piper executable is not installed.');
    throw httpError(502, 'TTS_FAILED', error.message || 'Piper failed to synthesize audio.');
  } finally {
    await fs.promises.rm(outputDir, { recursive: true, force: true });
  }
}

function match(pattern, pathname) {
  const pp = pattern.split('/').filter(Boolean);
  const ap = pathname.split('/').filter(Boolean);
  if (pp.length !== ap.length) return null;
  const params = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    else if (pp[i] !== ap[i]) return null;
  }
  return params;
}

const limiter = new RateLimiter();

/* ── AUTH + USER ───────────────────────────────────────────────────── */
route('POST', '/api/onboard', async (ctx) => {
  const { body, res } = ctx;
  const errs = validate(body, {
    type: 'object',
    props: {
      goal: { type: 'string', max: 240 },
      level: { type: 'string', max: 20 },
      minutesPerDay: { type: 'integer', min: 10, max: 240 },
    },
  });
  if (errs.length) throw httpError(400, 'BAD_INPUT', errs[0]);
  const user = await users.createUser({ isDemo: true });
  await users.update(user, { prefs: { goal: body.goal || '', level: body.level || '', minutesPerDay: body.minutesPerDay || 30, style: 'practical', interests: Array.isArray(body.interests) ? body.interests.slice(0, 6) : [] } });
  const hasWelcomeNotification = store.find('notifications', (n) => n.userId === user.id && n.type === 'welcome');
  if (!hasWelcomeNotification) {
    notifications.push(user.id, {
      type: 'welcome',
      emoji: '🎉',
      title: 'Welcome to PROOF',
      body: 'Your learning dashboard is ready. Start your first path and unlock your first proof.',
      href: '/home',
    });
  }
  const token = await auth.createSession(user.id);
  json(res, 201, { user: await publicMe(user), recommended: recommendNextSkill([]) }, { 'set-cookie': sessionCookie(token, undefined, ctx.req) });
});

route('POST', '/api/auth/nonce', async (ctx) => {
  const { body, req, res } = ctx;
  if (limiter.allow('nonce:' + req.socket.remoteAddress, 12, 60_000) !== true)
    throw httpError(429, 'RATE_LIMITED', 'Too many nonce requests — wait a minute.');
  const subject = looksLikeNimiqAddress(body?.subject) ? body.subject : 'demo';
  const result = await auth.issueNonce(subject);
  json(res, 200, result);
});

route('POST', '/api/auth/verify', async (ctx) => {
  const { body, res } = ctx;
  const mode = body?.mode === 'nimiqpay' ? 'nimiqpay' : body?.mode === 'hub' ? 'hub' : 'demo';
  if (mode === 'demo' && !config.demoWalletsEnabled)
    throw httpError(410, 'DEMO_WALLET_DEPRECATED', 'Demo wallets are no longer available. Connect Nimiq Pay or Nimiq Hub instead.');

  // Validate that required fields are present
  if (!body?.nonce) {
    console.error('[auth/verify] Missing nonce in request body:', body);
    throw httpError(400, 'MISSING_NONCE', 'Authentication request is missing nonce. Please try again.');
  }

  if (!body?.publicKey) {
    console.error('[auth/verify] Missing publicKey in request body');
    throw httpError(400, 'MISSING_PUBLIC_KEY', 'Authentication request is missing public key.');
  }

  if (!body?.signature) {
    console.error('[auth/verify] Missing signature in request body');
    throw httpError(400, 'MISSING_SIGNATURE', 'Authentication request is missing signature.');
  }

  // Look the nonce up WITHOUT consuming it yet: if the wallet step fails below
  // (bad signature, mismatch, network blip) the user can retry the same
  // sign-in. Burning the nonce up-front is what turned a single failed attempt
  // into a guaranteed BAD_NONCE on the retry.
  const nonceRow = await auth.findNonce(String(body.nonce));
  if (!nonceRow) {
    throw httpError(400, 'BAD_NONCE', 'This sign-in request expired. Try again.');
  }

  // The wallet provider's selected address is authoritative. Nimiq Pay can expose
  // an address that is not derivable as a basic account from the signing key,
  // including HTLC-related accounts. Keep that address for balance and payout
  // routing; the signature still proves that the wallet approved this session.
  let authenticatedAddress = body.address;
  const walletAddresses = mode === 'nimiqpay'
    ? [...new Set((Array.isArray(body.addresses) ? body.addresses : [body.address])
      .filter((address) => looksLikeNimiqAddress(String(address || '').toUpperCase()))
      .map((address) => normalizeNimiqAddress(address)))]
    : [];
  if (mode === 'nimiqpay') {
    if (!looksLikeNimiqAddress(String(body.address || '').toUpperCase()))
      throw httpError(401, 'INVALID_ADDRESS', 'Invalid Nimiq Pay wallet address.');
    if (!walletAddresses.includes(normalizeNimiqAddress(body.address)))
      throw httpError(401, 'INVALID_ADDRESS', 'Selected address was not returned by Nimiq Pay.');
    authenticatedAddress = normalizeNimiqAddress(body.address);
  } else if (mode === 'hub') {
    // Hub mode: just validate address format, signature verification is sufficient
    if (!looksLikeNimiqAddress(body.address)) {
      throw httpError(401, 'INVALID_ADDRESS', 'Invalid Nimiq address format.');
    }
  }

  const ok = auth.verifySignature({ mode, publicKey: body.publicKey, signature: body.signature, message: nonceRow.message });

  if (!ok) throw httpError(401, 'BAD_SIGNATURE', 'Signature verification failed — wallet ownership not proven.');

  // Signature proved wallet ownership — only now burn the single-use nonce.
  if (!(await auth.consumeNonce(String(body?.nonce || ''))))
    throw httpError(400, 'BAD_NONCE', 'This sign-in request expired. Try again.');

  const isNimiqMode = mode === 'nimiqpay' || mode === 'hub';
  let user = isNimiqMode && looksLikeNimiqAddress(authenticatedAddress)
    ? await users.findByWallet(authenticatedAddress)
    : await users.findByPublicKey(body.publicKey);
  const isNewUser = !user;
  
  // Extract and validate custom username if provided
  let customUsername = null;
  if (body.username && typeof body.username === 'string') {
    const username = body.username.trim();
    // Validate username: 3-20 chars, alphanumeric + underscore only
    if (username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)) {
      // Check if username is already taken
      const existing = await users.findByUsername(username);
      if (!existing || (user && existing.id === user.id)) {
        customUsername = username;
      } else {
        throw httpError(409, 'USERNAME_TAKEN', 'This username is already taken. Please choose another.');
      }
    } else {
      throw httpError(400, 'INVALID_USERNAME', 'Username must be 3-20 characters, letters, numbers, and underscores only.');
    }
  }
  
  if (isNimiqMode && looksLikeNimiqAddress(authenticatedAddress)) {
    if (!user) user = await users.createUser({ walletAddress: authenticatedAddress, walletMode: mode, username: customUsername });
    else {
      const updatedUser = await users.update(user, {
        walletAddress: authenticatedAddress,
        walletMode: mode,
        publicKey: body.publicKey,
        ...(walletAddresses.length ? { prefs: { ...user.prefs, walletAddresses } } : {}),
      });
      // A user cache can outlive a manual Supabase reset. Never issue a
      // session for a row that the database no longer contains.
      user = updatedUser || await users.get(user.id);
      if (!user) user = await users.createUser({ walletAddress: authenticatedAddress, walletMode: mode, username: customUsername });
    }
    if (walletAddresses.length) {
      user = await users.update(user, { prefs: { ...user.prefs, walletAddresses } }) || user;
    }
  } else {
    if (!user) user = await users.createUser({ walletMode: 'demo', username: customUsername });
    else user = await users.update(user, { publicKey: body.publicKey, walletMode: 'demo' }) || await users.get(user.id);
    if (!user) user = await users.createUser({ walletMode: 'demo', username: customUsername });
  }

  const hasWelcomeNotification = store.find('notifications', (n) => n.userId === user.id && n.type === 'welcome');
  if (!hasWelcomeNotification) {
    notifications.push(user.id, {
      type: 'welcome',
      emoji: '🎉',
      title: 'Welcome to PROOF',
      body: 'Your dashboard is ready. Start a path and keep your first proof moving.',
      href: '/home',
    });
  }

  const token = await auth.createSession(user.id);

  json(res, 200, { user: await publicMe(user), demo: mode === 'demo', isNewUser }, { 'set-cookie': sessionCookie(token, undefined, ctx.req) });
});

route('POST', '/api/wallet/demo', (ctx) => {
  const { req, res } = ctx;
  if (!config.demoWalletsEnabled)
    throw httpError(410, 'DEMO_WALLET_DEPRECATED', 'Demo wallets are no longer available. Connect Nimiq Pay or Nimiq Hub instead.');

  // Rate limit: prevent demo wallet spam
  if (limiter.allow('demo-wallet:' + req.socket.remoteAddress, 10, 60_000) !== true)
    throw httpError(429, 'RATE_LIMITED', 'Too many demo wallet requests. Wait a minute.');
  
  json(res, 200, { ...auth.createDemoWallet(), mode: 'demo',
    notice: 'Demo wallet: keys live only in this sandbox session for the demo experience. In Nimiq Pay, keys never leave your wallet.' });
});

route('POST', '/api/wallet/demo/sign', (ctx) => {
  const { body, res } = ctx;
  if (!config.demoWalletsEnabled)
    throw httpError(410, 'DEMO_WALLET_DEPRECATED', 'Demo wallets are no longer available. Connect Nimiq Pay or Nimiq Hub instead.');

  const sig = auth.signDemoMessage(String(body?.privateKey || ''), String(body?.message || ''));
  json(res, 200, { signature: sig });
});

route('GET', '/api/auth/session', async (ctx) => {
  const { user, res } = ctx;
  // Return current session user if authenticated, null otherwise
  json(res, 200, { user: user ? await publicMe(user) : null });
});

route('POST', '/api/auth/logout', (ctx) => {
  const { req, res } = ctx;
  const m = (req.headers.cookie || '').match(/proof_session=([^;]+)/);
  if (m) auth.destroySession(decodeURIComponent(m[1]));
  json(res, 200, { ok: true }, { 'set-cookie': clearSessionCookie(req) });
});

async function publicMe(user) {
  const current = await users.get(user.id) || user;
  const storedStreak = current.streak || {};
  const currentStreak = Number(storedStreak.current) || 0;
  const recordedXp = users.recordedXp ? await users.recordedXp(current.id) : 0;
  const totalXpEarned = users.xpEarned ? Math.max(users.xpEarned(current), recordedXp) : (Array.isArray(current.xpLedger) ? current.xpLedger.reduce((sum, entry) => {
    if (!entry) return sum;
    if (typeof entry === 'object') {
      const award = Number(entry.amount ?? entry.xp ?? entry.value ?? 0);
      return Number.isFinite(award) ? sum + award : sum;
    }
    const numeric = Number(entry);
    return Number.isFinite(numeric) ? sum + numeric : sum;
  }, 0) : Number(current.xp || 0));
  const level = users.levelForXp ? users.levelForXp(totalXpEarned) : current.level;
  const streak = {
    current: currentStreak,
    longest: Number(storedStreak.longest) || 0,
    lastDay: storedStreak.lastDay || null,
    emoji: currentStreak >= 30 ? '👑' : currentStreak >= 7 ? '⚡' : currentStreak >= 3 ? '🔥' : '📚',
    atRisk: false,
  };
  const unreadNotifications = await notifications.unreadCount(user.id);
  const walletBalanceNim = await connectedWalletBalance(current);
  const recentTransactions = (await rewards.txHistory(current.id, 8))
    .filter((transaction) => !(transaction.kind === 'payout' && transaction.direction === 'debit'))
    .map((transaction) => ({
      id: transaction.id,
      kind: transaction.kind,
      direction: transaction.direction,
      amountNim: toNim(transaction.amountLuna),
      status: transaction.status,
      note: transaction.note || (transaction.kind === 'payout' ? 'Wallet payout' : 'Transaction'),
      ref: transaction.ref || null,
      createdAt: transaction.createdAt,
    }));
  const verifiedSkillCount = (await skills.userSkills(current.id)).filter((skill) => skill.verified === true).length;
  return {
    id: current.id, username: current.username, avatar: current.avatar,
    level, xp: totalXpEarned, xpEarned: totalXpEarned, totalXpEarned, reputation: current.reputation,
    balanceNim: walletBalanceNim,
    ledgerBalanceNim: toNim(current.balanceLuna),
    walletBalanceNim,
    earnedNim: toNim(current.earnedLuna),
    recentTransactions,
    verifiedSkillCount,
    wallet: { mode: current.walletMode, address: current.walletAddress, connected: !!current.walletMode },
    walletAccounts: Array.isArray(current.prefs?.walletAddresses) ? current.prefs.walletAddresses : (current.walletAddress ? [current.walletAddress] : []),
    streak, prefs: current.prefs,
    proofsPassed: current.proofsPassed || 0,
    walletModeIsDemo: current.walletMode === 'demo',
    unreadNotifications,
  };
}

async function connectedWalletBalance(user) {
  const fallback = toNim(user.balanceLuna);
  if (!user.walletAddress || user.walletMode === 'demo' || !config.nimiq.rpcUrl) return fallback;

  try {
    const response = await fetch(config.nimiq.rpcUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `balance-${user.id}`,
        method: 'getAccountByAddress',
        params: [normalizeNimiqAddress(user.walletAddress)],
      }),
    });
    if (!response.ok) return fallback;
    const payload = await response.json();
    const balanceLuna = Number(payload?.result?.data?.balance ?? payload?.result?.balance);
    return Number.isFinite(balanceLuna) && balanceLuna >= 0 ? toNim(balanceLuna) : fallback;
  } catch (error) {
    console.warn('[wallet] Could not read connected wallet balance:', error.message);
    return fallback;
  }
}

route('GET', '/api/me', async (ctx) => {
  const { user, res } = ctx;
  // console.log('[/api/me] Request - user:', user ? `${user.username} (${user.id})` : 'null');
  // console.log('[/api/me] Cookie header:', ctx.req.headers.cookie ? 'present' : 'missing');
  if (!user) {
    // Public view for anonymous visitors — avoid noisy 401s on first load.
    return json(res, 200, { user: null, skills: [], unread: 0, opportunities: 0 });
  }
  const [userSkillsData, skillCatalog] = await Promise.all([
    skills.userSkills(user.id),
    skills.catalog(),
  ]);
  const skillNames = new Map(skillCatalog.map((skill) => [skill.slug, skill.name]));
  const readableSkillName = (slug = '') => String(slug)
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Untitled skill';
  // `user_skills` stores a slug and score, not the display name. Profile (and
  // other API consumers) need the catalog name to render a skill safely.
  const mySkills = userSkillsData.map((s) => ({
    ...s,
    name: skillNames.get(s.skillSlug) || readableSkillName(s.skillSlug),
    tier: s.tier || skills.tierFor(s.score || 0),
    proofCount: s.passed ?? s.proofs ?? 0,
  }));
  const qualification = await challenges.qualificationSnapshot(user.id);
  json(res, 200, {
    user: await publicMe(user),
    skills: mySkills,
    unread: await notifications.unreadCount(user.id),
    opportunities: qualification.opportunities,
  });
});

route('PATCH', '/api/me', async (ctx) => {
  const { user, body, res } = ctx;
  const patch = {};
  if (body.username) {
    const name = String(body.username).trim().slice(0, 24).replace(/[^\w\d -]/g, '');
    if (name.length < 3) throw httpError(400, 'BAD_USERNAME', 'Username needs at least 3 characters.');
    const existing = await users.findByUsername(name);
    if (existing && existing.id !== user.id)
      throw httpError(409, 'USERNAME_TAKEN', 'That username is taken.');
    patch.username = name; patch.usernameLower = name.toLowerCase();
  }
  if (body.avatar) {
    const avatar = String(body.avatar).trim().slice(0, 4);
    if (/^\p{Extended_Pictographic}$/u.test(avatar) || /^[\u2600-\u27BF]$/u.test(avatar) || /[\u{1F300}-\u{1FAFF}]/u.test(avatar)) {
      patch.avatar = avatar;
    } else {
      throw httpError(400, 'BAD_AVATAR', 'Avatar must be a single emoji or pictograph.');
    }
  }
  if (body.prefs) {
    const p = { ...user.prefs, ...body.prefs };
    p.goal = String(p.goal || '').slice(0, 240);
    p.level = String(p.level || '').slice(0, 20);
    if (p.theme !== undefined && !['light', 'dark', 'system'].includes(p.theme)) delete p.theme;
    if (p.language !== undefined && !['en', 'es', 'fr', 'pt', 'de', 'zh'].includes(p.language)) delete p.language;
    patch.prefs = p;
  }
  await users.update(user, patch);
  const updated = await users.get(user.id);
  json(res, 200, { user: await publicMe(updated) });
});

/* ── HOME ──────────────────────────────────────────────────────────── */
route('GET', '/api/home', async (ctx) => {
  const { user, res } = ctx;

  // All queries run concurrently
  const daily = await challenges.todayDaily();

  const [myPaths, userSkillRows, catalog, sponsored, discovery, dailyDone, allTasks, userAttempts] = await Promise.all([
    store.filter('paths', (p) => p.userId === user.id),
    skills.userSkills(user.id),
    skills.catalog(),
    store.all('sponsored_challenges'),
    discoveryFeed(user.id),
    store.findOptimized('attempts', { userId: user.id, challengeId: daily.id, submittedAt_not_null: true }),
    market.listTasks(user.id, { onlyQualified: true }),
    store.filter('attempts', (a) => a.userId === user.id && a.submittedAt),
  ]);

  // Continue Learning: Most recently updated path (based on actual progress timestamps)
  const pathsWithActivity = myPaths.map(p => {
    const progressValues = Object.values(p.progress || {});
    const lastActivity = progressValues.length > 0 
      ? Math.max(...progressValues.filter(v => typeof v === 'number'))
      : p.createdAt;
    return { path: p, lastActivity };
  });
  const mostRecentPath = pathsWithActivity
    .filter(p => pathProgress(p.path) < 100)
    .sort((a, b) => b.lastActivity - a.lastActivity)[0];
  
  const continueLearning = mostRecentPath ? await pathView(mostRecentPath.path, user.id) : null;

  // Skills You're Building: Top 4 skills based on actual activity (progress + recent work)
  const skillActivity = userSkillRows.reduce((acc, userSkill) => {
    if (!userSkill.skillSlug) return acc;
    acc[userSkill.skillSlug] = {
      skillSlug: userSkill.skillSlug,
      pathCount: 1,
      totalProgress: Number(userSkill.score) || 0,
      recentActivity: Number(userSkill.updatedScoreAt) || 0,
      lessonsCompleted: 0,
    };
    return acc;
  }, {});

  myPaths.reduce((acc, path) => {
    const skill = path.skillSlug;
    if (!skill) return acc;
    
    if (!acc[skill]) {
      acc[skill] = {
        skillSlug: skill,
        pathCount: 0,
        totalProgress: 0,
        recentActivity: 0,
        lessonsCompleted: 0
      };
    }
    
    acc[skill].pathCount += 1;
    acc[skill].totalProgress += pathProgress(path);
    
    // Count completed lessons in this path
    const progressKeys = Object.keys(path.progress || {});
    const lessonKeys = progressKeys.filter(k => k.includes(':lesson'));
    acc[skill].lessonsCompleted += lessonKeys.length;
    
    // Get most recent activity timestamp
    const progressValues = Object.values(path.progress || {}).filter(v => typeof v === 'number');
    if (progressValues.length > 0) {
      const latest = Math.max(...progressValues);
      if (latest > acc[skill].recentActivity) {
        acc[skill].recentActivity = latest;
      }
    }
    
    return acc;
  }, skillActivity);

  const topSkills = Object.values(skillActivity)
    .sort((a, b) => {
      // Sort by: recent activity (70%) + progress (30%)
      const scoreA = (b.recentActivity > 0 ? 0.7 : 0) + (b.totalProgress / b.pathCount * 0.3);
      const scoreB = (a.recentActivity > 0 ? 0.7 : 0) + (a.totalProgress / a.pathCount * 0.3);
      return scoreB - scoreA;
    })
    .slice(0, 4)
    .map(s => {
      const skillInfo = catalog.find(c => c.slug === s.skillSlug);
      const userSkill = userSkillRows.find((skill) => skill.skillSlug === s.skillSlug);
      const avgProgress = userSkill ? userSkill.score : s.totalProgress / s.pathCount;
      return {
        skillSlug: s.skillSlug,
        name: skillInfo?.name || s.skillSlug,
        progress: Math.round(avgProgress),
        verified: !!userSkill?.verified,
        score: userSkill?.score ?? Math.round(avgProgress),
        tier: userSkill?.tier || 'Learning',
      };
    });

  // Recent achievements come from the same persisted XP awards shown in the
  // user's total. This keeps the activity feed populated even when attempts
  // do not include their related challenge row.
  const xpLedger = Array.isArray(user.xpLedger) ? user.xpLedger : [];
  const achievements = xpLedger
    .map((entry, index) => {
      const amount = typeof entry === 'object' ? Number(entry.amount || 0) : Number(entry || 0);
      if (!(amount > 0)) return null;

      const eventKey = typeof entry === 'object' ? String(entry.eventKey || '') : '';
      const reason = typeof entry === 'object' ? String(entry.reason || '') : '';
      const detail = eventKey.includes(':lesson')
        ? 'Lesson completed'
        : eventKey.includes(':practice')
          ? 'Practice completed'
          : eventKey.startsWith('proof:')
            ? 'Proof submitted'
            : reason || 'XP awarded';

      return {
        id: eventKey || `xp-award-${index}`,
        title: `+${amount.toLocaleString()} XP`,
        detail,
        xp: amount,
        nim: 0,
        completedAt: typeof entry === 'object' ? (entry.grantedAt || entry.createdAt || now()) : now(),
        type: 'xp',
      };
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.completedAt) - Number(a.completedAt))
    .slice(0, 3);

  // Older users may have XP but no ledger entries yet.
  if (achievements.length === 0 && Number(user.xp) > 0) {
    achievements.push({
      id: 'xp-earned',
      title: `${user.xp.toLocaleString()} XP earned`,
      detail: `Level ${user.level || 1}`,
      xp: user.xp,
      nim: 0,
      completedAt: now(),
      type: 'xp',
    });
  }

  // Trending Proofs: Skills with most user activity (real data)
  const skillUsage = new Map();
  for (const path of await store.all('paths')) {
    const slug = path.skillSlug;
    if (!slug) continue;
    skillUsage.set(slug, (skillUsage.get(slug) || 0) + 1);
  }
  const trending = await Promise.all(
    [...skillUsage.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(async ([slug, count]) => {
        const skill = catalog.find(s => s.slug === slug);
        if (!skill) return null;
        return { ...skill, learners: count };
      })
  ).then(results => results.filter(Boolean));

  const tasks = allTasks.slice(0, 3);

  json(res, 200, {
    user: await publicMe(user),
    continueLearning,
    mySkills: topSkills,
    daily: { ...dailyView(daily), done: !!dailyDone, passed: dailyDone?.status === 'passed' },
    trending,
    sponsored: await Promise.all(sponsored.slice().sort((a, b) => b.poolLuna - a.poolLuna).slice(0, 3)
      .map((s) => sponsoredView(s, user.id))),
    recommendedTasks: tasks,
    recommendedSkills: recommendNextSkill(userSkillRows.map((s) => s.skillSlug)),
    recentAchievements: achievements.slice(0, 3),
    discovery,
  });
});

async function discoveryFeed(userId) {
  // Run all queries in parallel
  const [topProofers, allTasks, allTeachers] = await Promise.all([
    users.leaderboard('xp', 3),
    market.listTasks(userId),
    teaching.list(),
  ]);

  return {
    topProofers,
    newTasks: allTasks.slice(0, 2),
    teachers: allTeachers.slice(0, 2),
  };
}

/* ── PATHS ─────────────────────────────────────────────────────────── */
const pathGenerationInFlight = new Map();

route('POST', '/api/paths', async (ctx) => {
  const { user, body, req, res } = ctx;
  // Validate goal
  const goalErrs = validate(body, { type: 'object', required: ['goal'], props: { goal: { type: 'string', min: 3, max: 240 } } });
  if (goalErrs.length) throw httpError(400, 'BAD_INPUT', 'Tell us what you want to learn (at least 3 characters).');
  
  // Sanitize and validate all inputs - NEVER trust the frontend!
  const goal = String(body.goal || '').trim().slice(0, 240);
  const domain = body.domain ? String(body.domain).trim().slice(0, 50) : null;
  const level = ['beginner', 'intermediate', 'advanced'].includes(body.level) ? body.level : (user.prefs?.level || 'beginner');
  const minutesPerDay = parseNumber(body.minutesPerDay, { min: 5, max: 480, default: user.prefs?.minutesPerDay || 30 });
  const style = ['practical', 'theoretical', 'mixed'].includes(body.style) ? body.style : 'practical';
  
  // Additional validation
  if (domain && !/^[a-z0-9-]+$/.test(domain)) {
    throw httpError(400, 'BAD_INPUT', 'Invalid skill domain format');
  }
  
  // One active path per skill keeps progress and history in one place. Return
  // the existing path so the client can open it and continue learning.
  const existingPaths = await store.filter('paths', (p) =>
    p.userId === user.id && 
    (
      p.goal === goal ||
      (domain && domain !== 'languages' && p.skillSlug === domain)
    )
  );
  if (existingPaths.length > 0) {
    const existingPath = existingPaths.sort((a, b) => b.createdAt - a.createdAt)[0];
    console.log(`[DEDUP] Returning existing path ${existingPath.id} for user ${user.id}`);
    return json(res, 200, { path: await pathView(existingPath, user.id), generatedBy: 'cached', isDuplicate: true });
  }

  await cleanupDuplicateSkillPaths(store, user.id).catch((error) => console.error('[paths] cleanup failed during create check:', error.message));

  // Rate limit only requests that will actually invoke path generation.
  if (limiter.allow('paths:' + user.id, 5, 300_000) !== true)
    throw httpError(429, 'RATE_LIMITED', 'Path generation limit reached. Wait 5 minutes before creating another path.');
  
  const generationKey = `${user.id}:${domain || ''}:${goal.toLowerCase()}`;
  let generation = pathGenerationInFlight.get(generationKey);
  if (!generation) {
    generation = generateLearningPath({ goal, domain, level, minutesPerDay, style })
      .finally(() => pathGenerationInFlight.delete(generationKey));
    pathGenerationInFlight.set(generationKey, generation);
  } else {
    console.log(`[PATH GENERATION] Joining in-flight request for user ${user.id}`);
  }
  const gen = await generation;
  if (!gen || !Array.isArray(gen.days) || !gen.days.length)
    throw httpError(502, 'PATH_GENERATION_FAILED', 'No learning path could be generated for that goal — try a more specific goal.');
  // Guard the shape we rely on below so a bad generator/LLM output can never
  // crash the route with a cryptic TypeError after we already inserted a row.
  if (!gen.days.every((d) => d && Array.isArray(d.items) && d.items.every((i) => i && i.topic)))
    throw httpError(502, 'PATH_GENERATION_FAILED', 'Generated path was malformed — try again in a minute.');

  const generatedSkillPath = (await store.filter('paths', (p) =>
    p.userId === user.id &&
    gen.skillSlug !== 'languages' &&
    p.skillSlug === gen.skillSlug
  )).sort((a, b) => b.createdAt - a.createdAt)[0];
  if (generatedSkillPath) {
    console.log(`[DEDUP] Returning existing generated-skill path ${generatedSkillPath.id} for user ${user.id}`);
    return json(res, 200, { path: await pathView(generatedSkillPath, user.id), generatedBy: 'cached', isDuplicate: true });
  }

  // persist path + create its proof challenges
  let pathRow;
  try {
    pathRow = await store.insert('paths', {
      id: uid('path'), userId: user.id,
      goal: gen.goal, skillSlug: gen.skillSlug, skillName: gen.skillName, skillEmoji: gen.skillEmoji,
      title: gen.title, description: gen.description,
      level: gen.level, minutesPerDay: gen.minutesPerDay,
      days: gen.days, totalXp: gen.totalXp,
      engine: gen.engine, progress: {}, createdAt: now(),
    });
  } catch (e) {
    // PostgREST reports unknown columns as "could not find the 'x' column …
    // in the schema cache" — that is a DB schema drift, not a user error.
    if (/column.*schema cache|Insert failed/i.test(String(e.message || '')))
      throw httpError(500, 'DB_SCHEMA_MISMATCH', 'Database is missing columns the app expects — run database/fix-learning-path-columns.sql against Supabase, then retry.');
    throw e;
  }
  if (!pathRow || !Array.isArray(pathRow.days)) {
    // If insert succeeded but the returned row has no usable `days`, do not
    // leave a half-persisted path behind.
    if (pathRow?.id) await store.remove('paths', pathRow.id);
    throw httpError(500, 'PATH_PERSIST_FAILED', 'Learning path could not be stored — the database schema may be out of date (see database/fix-learning-path-columns.sql).');
  }
  for (const day of pathRow.days) {
    for (const item of day.items) {
      if (item.challengeTemplate) {
        const ch = await challenges.createFromTemplate({
          skillSlug: gen.skillSlug,
          template: item.challengeTemplate,
          pathId: pathRow.id, dayIndex: day.index,
        });
        item.challengeId = ch.id;
        delete item.challengeTemplate;
      }
    }
  }
  await store.update('paths', pathRow.id, { days: pathRow.days });
  await store.save();
  json(res, 201, { path: await pathView(pathRow, user.id), generatedBy: gen.engine });
});

route('GET', '/api/paths', async (ctx) => {
  const { user, res } = ctx;
  const filtered = await store.filter('paths', (p) => p.userId === user.id);
  const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
  const mine = await Promise.all(sorted.map((p) => pathView(p, user.id)));
  json(res, 200, { paths: mine });
});

route('GET', '/api/paths/:id', async (ctx) => {
  const { user, params, res } = ctx;
  const p = await store.get('paths', params.id);
  if (!p || p.userId !== user.id) throw httpError(404, 'NOT_FOUND', 'Path not found.');
  json(res, 200, { path: await pathView(p, user.id) });
});

route('DELETE', '/api/paths/:id', async (ctx) => {
  const { user, params, res } = ctx;
  
  // Verify ownership before deletion
  const p = await store.get('paths', params.id);
  if (!p) throw httpError(404, 'NOT_FOUND', 'Path not found.');
  if (p.userId !== user.id) throw httpError(403, 'FORBIDDEN', 'You can only delete your own paths.');
  
  // Delete the path
  await store.remove('paths', params.id);
  await store.save();
  
  console.log(`[DELETE] User ${user.id} deleted path ${params.id}`);
  json(res, 200, { message: 'Path deleted successfully', pathId: params.id });
});

route('POST', '/api/paths/:id/progress', async (ctx) => {
  const { user, params, body, res } = ctx;
  
  // Validate path ownership
  const p = await store.get('paths', params.id);
  if (!p || p.userId !== user.id) throw httpError(404, 'NOT_FOUND', 'Path not found.');
  
  // Validate and sanitize inputs - NEVER trust the frontend!
  const dayIndex = parseNumber(body.dayIndex, { min: 0, max: 365, default: null });
  const topicSlug = body.topicSlug ? String(body.topicSlug).trim().slice(0, 100) : null;
  const part = ['lesson', 'practice', 'quiz', 'recall', 'socratic'].includes(body.part) ? body.part : null;
  
  // Validate required fields
  if (dayIndex === null || !topicSlug || !part) {
    throw httpError(400, 'BAD_INPUT', 'Missing or invalid dayIndex, topicSlug, or part');
  }
  
  // Validate slug format (only alphanumeric, hyphens, underscores)
  if (!/^[a-z0-9_-]+$/i.test(topicSlug)) {
    throw httpError(400, 'BAD_INPUT', 'Invalid topicSlug format');
  }
  
  // Verify the day/topic actually exists in this path
  const dayExists = p.days.some(d => d.index === dayIndex);
  if (!dayExists) {
    throw httpError(400, 'BAD_INPUT', `Day ${dayIndex} does not exist in this path`);
  }
  
  const topicExists = p.days.flatMap(d => d.items).some(item => item.topic === topicSlug);
  if (!topicExists) {
    throw httpError(400, 'BAD_INPUT', `Topic ${topicSlug} does not exist in this path`);
  }
  
  const key = `${dayIndex}:${topicSlug}:${part}`;
  const firstTime = !p.progress[key];
  if (firstTime) {
    p.progress[key] = now();
    await store.update('paths', p.id, { progress: p.progress });
    if (part === 'lesson') {
      await users.touchStreak(user.id);
      await users.addXp(user.id, 20, 'Lesson complete', `path:${p.id}:${dayIndex}:${topicSlug}:lesson`);
      await userStats.incrementLessons(user.id);
      await learningGoals.updateGoalProgress(user.id, 'weekly_lessons', 1);
      await masteryBadges.checkSpecialBadges(user.id);
      // Schedule this topic for spaced repetition — learning that repeats.
      const doneItem = p.days.flatMap((d) => d.items).find((i) => i.topic === topicSlug);
      if (doneItem) {
        await spacedRepetition.scheduleReview(user.id, {
          topicSlug: topicSlug,
          topicTitle: doneItem.title,
          skillSlug: p.skillSlug,
        });
      }
    }
    if (part === 'practice') {
      await users.touchStreak(user.id);
      await users.addXp(user.id, 10, 'Practice complete', `path:${p.id}:${dayIndex}:${topicSlug}:practice`);
      await userStats.incrementPractices(user.id);
      await learningGoals.updateGoalProgress(user.id, 'weekly_practices', 1);
    }
    // Check for new badges
    const awarded = await masteryBadges.checkAndAwardBadges(user.id);
    await store.save();
    
    // Send notifications for new badges
    for (const badge of awarded) {
      notifications.push(user.id, { 
        type: 'badge', 
        emoji: badge.definition.emoji, 
        title: `Badge unlocked: ${badge.definition.name}`, 
        body: badge.definition.description, 
        href: '#/profile' 
      });
    }
  }
  json(res, 200, { progress: p.progress, percent: pathProgress(p), xpAwarded: firstTime ? (part === 'lesson' ? 20 : 10) : 0 });
});

function pathProgress(p) {
  const items = p.days.flatMap((d) => d.items);
  const total = items.length;
  if (!total) return 0;
  
  // Count only items that have actual completed lessons or proof challenges
  const progressKeys = Object.keys(p.progress || {});
  if (progressKeys.length === 0) return 0;
  
  // Count topics that have at least lesson OR practice completed
  const completedTopics = new Set();
  progressKeys.forEach(key => {
    const parts = key.split(':');
    if (parts.length >= 2) {
      const topic = parts[1];
      completedTopics.add(topic);
    }
  });
  
  const doneItems = items.filter((i) => completedTopics.has(i.topic));
  return Math.round((doneItems.length / total) * 100);
}

/**
 * Older generated paths can contain proof items without a persisted challenge
 * ID. Recreate only those missing records from the deterministic curriculum so
 * every visible checkpoint, including Chess, remains startable after deploys.
 */
async function repairPathChallenges(pathRow) {
  const proofItems = pathRow.days.flatMap((day) =>
    day.items.filter((item) => item.kind !== 'study').map((item) => ({ day, item }))
  );
  if (!proofItems.length) return pathRow;

  const existingChallenges = await store.filter('challenges', (challenge) => challenge.pathId === pathRow.id);
  const existingIds = new Set(existingChallenges.map((challenge) => challenge.id));
  const missing = proofItems.filter(({ item }) => !item.challengeId || !existingIds.has(item.challengeId));
  const chessWithoutBoardData = proofItems.filter(({ item }) => {
    const challenge = existingChallenges.find((candidate) => candidate.id === item.challengeId);
    return challenge?.type === 'chess' && !chessConfigFromChallenge(challenge);
  });
  const outdatedSpecialMoves = proofItems.filter(({ item }) => {
    const challenge = existingChallenges.find((candidate) => candidate.id === item.challengeId);
    const chess = chessConfigFromChallenge(challenge);
    return item.topic === 'special-moves' && challenge?.type === 'chess'
      && ['8/4P3/8/8/8/8/8/4K2k w - - 0 1', '7k/6P1/6K1/8/8/8/8/8 w - - 0 1'].includes(chess?.scenarios?.[2]?.fen);
  });
  if (!missing.length && !chessWithoutBoardData.length && !outdatedSpecialMoves.length) return pathRow;

  const generated = await generateLearningPath({
    goal: pathRow.goal,
    domain: pathRow.skillSlug,
    level: String(pathRow.level || 'beginner').toLowerCase(),
    minutesPerDay: pathRow.minutesPerDay,
  });
  const templates = generated.days.flatMap((day) => day.items)
    .filter((item) => item.challengeTemplate);
  let repaired = false;

  for (const { item } of [...chessWithoutBoardData, ...outdatedSpecialMoves]) {
    const template = templates.find((candidate) => candidate.topic === item.topic && candidate.kind === item.kind)?.challengeTemplate;
    if (!template) continue;
    const challenge = existingChallenges.find((candidate) => candidate.id === item.challengeId);
    await store.update('challenges', item.challengeId, {
      evaluator: { ...(challenge?.evaluator || {}), chess: chessConfigFromTemplate(template) },
    });
    repaired = true;
  }

  for (const { day, item } of missing) {
    const template = item.challengeTemplate || templates.find((candidate) =>
      candidate.topic === item.topic && candidate.kind === item.kind
    )?.challengeTemplate;
    if (!template) continue;

    const challenge = await challenges.createFromTemplate({
      skillSlug: pathRow.skillSlug,
      template,
      pathId: pathRow.id,
      dayIndex: day.index,
    });
    item.challengeId = challenge.id;
    delete item.challengeTemplate;
    repaired = true;
  }

  if (repaired) {
    await store.update('paths', pathRow.id, { days: pathRow.days });
    await store.save();
  }
  return pathRow;
}

function normalizeTopicForProgress(topic) {
  return String(topic || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/--+/g, '-');
}

function hasProgressItem(progress, dayIndex, topic, part) {
  const normalizedTopic = normalizeTopicForProgress(topic);
  const directKey = `${dayIndex}:${topic}:${part}`;
  if (progress?.[directKey]) return true;

  for (const [key, value] of Object.entries(progress || {})) {
    if (!value) continue;
    const [storedDay, storedTopic, storedPart] = String(key).split(':');
    if (storedPart !== part) continue;
    if (Number(storedDay) !== Number(dayIndex)) continue;
    if (normalizeTopicForProgress(storedTopic) === normalizedTopic) return true;
  }
  return false;
}

const refreshedPathIds = new Set();

async function refreshPathCurriculum(pathRow) {
  if (!pathRow || pathRow.isFromDocument || refreshedPathIds.has(pathRow.id)) return pathRow;
  refreshedPathIds.add(pathRow.id);

  try {
    const generated = await generateLearningPath({
      goal: pathRow.goal,
      domain: pathRow.skillSlug,
      level: String(pathRow.level || 'beginner').toLowerCase(),
      minutesPerDay: pathRow.minutesPerDay,
    });
    const existingByKey = new Map();
    for (const day of pathRow.days || []) {
      for (const item of day.items || []) {
        const key = `${item.kind}:${item.topic}`;
        const items = existingByKey.get(key) || [];
        items.push(item);
        existingByKey.set(key, items);
      }
    }

    const days = generated.days.map((day) => ({
      ...day,
      items: day.items.map((item) => {
        const previous = existingByKey.get(`${item.kind}:${item.topic}`)?.shift();
        return previous?.challengeId ? { ...item, challengeId: previous.challengeId } : item;
      }),
    }));
    const dayByTopic = new Map();
    for (const day of days) {
      for (const item of day.items) dayByTopic.set(item.topic, day.index);
    }
    const progress = {};
    for (const [key, value] of Object.entries(pathRow.progress || {})) {
      const [, topic, part] = String(key).split(':');
      const newDay = dayByTopic.get(topic);
      if (newDay && part) progress[`${newDay}:${topic}:${part}`] = value;
      else if (!newDay) progress[key] = value;
    }

    const patch = {
      days,
      progress,
      totalXp: generated.totalXp,
      title: generated.title,
      description: generated.description,
      level: generated.level,
      engine: generated.engine,
    };
    const updated = await store.update('paths', pathRow.id, patch);
    Object.assign(pathRow, updated || patch);
    await store.save();
  } catch (error) {
    refreshedPathIds.delete(pathRow.id);
    console.warn(`[PATH REFRESH] Could not refresh ${pathRow.id}:`, error.message);
  }
  return pathRow;
}

async function pathView(p, userId) {
  if (!p.isFromDocument) {
    await refreshPathCurriculum(p);
    await repairPathChallenges(p);
  }
  // OPTIMIZED: Fetch all user attempts once using optimized query
  const userAttempts = await store.filterOptimized('attempts', { userId: userId, submittedAt_not_null: true });
  const attemptsByChallenge = new Map(userAttempts.map(a => [a.challengeId, a]));
  
  const days = p.days.map((d) => ({
    ...d,
    items: d.items.map((i) => ({
      ...i,
      rewardNim: i.rewardNim ?? i.challengeTemplate?.rewardNim,
      lessonDone: hasProgressItem(p.progress, d.index, i.topic, 'lesson'),
      practiceDone: hasProgressItem(p.progress, d.index, i.topic, 'practice'),
      attempt: i.challengeId ? (attemptsByChallenge.get(i.challengeId) || null) : null,
    })),
  }));
  // Total NIM attachable across all proof items in the path (mirrors the
  // generator's rewardPool) — the UI shows this as the path's reward pool.
  const rewardNim = days.reduce((total, d) => total + (d.items || []).reduce((dayTotal, i) => dayTotal + Number(i.rewardNim || 0), 0), 0);
  return {
    id: p.id, title: p.title, description: p.description, goal: p.goal,
    skillSlug: p.skillSlug, skillName: p.skillName, skillEmoji: p.skillEmoji,
    level: p.level, minutesPerDay: p.minutesPerDay, engine: p.engine,
    totalXp: p.totalXp, rewardNim,
    days, percent: pathProgress(p), createdAt: p.createdAt,
  };
}

/* ── DOCUMENT CURRICULUM ────────────────────────────────────────────── */
route('POST', '/api/curriculum/from-document', async (ctx) => {
  const { user, req, res } = ctx;
  try {
    // Wrap multer in a promise so upload errors reach the request boundary.
    await new Promise((resolve, reject) => {
      upload.single('document')(req, res, (err) => {
        if (err) return reject(httpError(400, 'UPLOAD_ERROR', err.message));
        if (!req.file) return reject(httpError(400, 'NO_FILE', 'No document uploaded.'));
        resolve();
      });
    });

    const userGoal = req.body?.goal || '';
    const result = await createCurriculumFromDocument(user.id, req.file, userGoal);
    json(res, 201, { 
      path: await pathView(result.path, user.id),
      message: 'Curriculum created from your document! 🎓' 
    });
  } catch (e) {
    console.error('[curriculum/from-document] Error:', e.message);
    if (e.status) throw e;
    if (e.message?.includes('LLM_NOT_CONFIGURED')) {
      throw httpError(503, 'AI_NOT_CONFIGURED', 'Document curricula are temporarily unavailable because AI is not configured.');
    }
    if (e.message?.includes('empty or too short')) {
      throw httpError(400, 'DOCUMENT_TOO_SHORT', e.message);
    }
    throw httpError(502, 'CURRICULUM_FAILED', e.message || 'Failed to generate curriculum from document.');
  }
});

route('GET', '/api/curriculum/documents', async (ctx) => {
  const { user, res } = ctx;
  const paths = await getUserDocumentCurricula(user.id);
  const views = await Promise.all(paths.map((p) => pathView(p, user.id)));
  json(res, 200, { paths: views });
});

route('GET', '/api/curriculum/documents/:id', async (ctx) => {
  const { user, params, res } = ctx;
  const path = await getDocumentCurriculum(user.id, params.id);
  json(res, 200, { path: await pathView(path, user.id) });
});

route('DELETE', '/api/curriculum/documents/:id', async (ctx) => {
  const { user, params, res } = ctx;
  
  // Get the path to verify ownership
  const path = await getDocumentCurriculum(user.id, params.id);

  for (const day of path.days || []) {
    for (const item of day.items || []) {
      for (const language of ['en', 'es', 'fr', 'de', 'pt', 'zh']) {
        lessonCache.delete(`${language}:${path.skillSlug}:${item.topic}`);
      }
    }
  }
  
  // Delete associated challenges first (they reference the path)
  const challenges = await store.filter('challenges', (c) =>
    c.pathId === params.id || c.documentPathId === params.id || c.evaluator?.documentPathId === params.id
  );
  for (const challenge of challenges) {
    const removed = await store.remove('challenges', challenge.id);
    if (removed === false) throw httpError(502, 'CURRICULUM_DELETE_FAILED', 'Could not remove the curriculum challenges. Please try again.');
  }
  
  // Delete the path
  const removedPath = await store.remove('paths', params.id);
  if (removedPath === false) throw httpError(502, 'CURRICULUM_DELETE_FAILED', 'Could not remove the curriculum. Please try again.');
  
  json(res, 200, { success: true, message: 'Curriculum deleted successfully' });
});

/* ── LESSON CONTENT ────────────────────────────────────────────────── */
// Cache for lesson content (lessons don't change during runtime)
const lessonCache = new Map();

route('GET', '/api/lesson/:skill/:topic', async (ctx) => {
  const { params, res } = ctx;
  const startTime = Date.now();
  const requestedLanguage = new URL(ctx.req.url, 'http://localhost').searchParams.get('lang');
  const language = ['en', 'es', 'fr', 'de', 'pt', 'zh'].includes(requestedLanguage || '') ? requestedLanguage : 'en';
  
  // Check cache first
  const cacheKey = `${language}:${params.skill}:${params.topic}`;
  if (lessonCache.has(cacheKey)) {
    const cachedLesson = lessonCache.get(cacheKey);
    const staleDocumentLesson = params.skill === 'document-study'
      && ((!Array.isArray(cachedLesson?.recall) || cachedLesson.recall.length === 0)
        || (!Array.isArray(cachedLesson?.practice) || cachedLesson.practice.length === 0));
    if (!staleDocumentLesson) {
      console.log(`[LESSON CACHE HIT] ${cacheKey} (${Date.now() - startTime}ms)`);
      return json(res, 200, cachedLesson);
    }
    lessonCache.delete(cacheKey);
    console.log(`[LESSON CACHE EVICT] ${cacheKey} missing recall or practice prompts`);
  }
  
  console.log(`[LESSON CACHE MISS] ${cacheKey}`);
  
  try {
    const genStart = Date.now();
    const lesson = await generateLesson(params.skill, params.topic, language);
    console.log(`[LESSON GENERATED] ${cacheKey} (${Date.now() - genStart}ms)`);
    
    lessonCache.set(cacheKey, lesson); // Cache the result
    console.log(`[LESSON TOTAL] ${cacheKey} (${Date.now() - startTime}ms)`);
    json(res, 200, lesson);
  } catch (e) {
    // Try generating from document-based curriculum
    try {
      const { generateDocumentLesson } = await import('./services/document-curriculum.js');
      const docLesson = await generateDocumentLesson(params.skill, params.topic);
      lessonCache.set(cacheKey, docLesson); // Cache document lesson too
      json(res, 200, docLesson);
    } catch (docError) {
      // If both fail, return a basic structure
      const basicLesson = {
        skillSlug: params.skill,
        topicSlug: params.topic,
        estMin: 10,
        topic: params.topic,
        title: params.topic.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        tldr: 'Build a useful foundation for this topic, then apply it in the practice step.',
        sections: [{
          h: 'Overview',
          body: 'This lesson is part of a personalized curriculum. Read the topic overview, then continue to practice when you are ready.'
        }],
        keyPoints: ['Explain the main idea in your own words before moving on.'],
        practice: [{
          q: `Which action best helps you apply ${params.topic.replace(/-/g, ' ')}?`,
          choices: ['Explain the idea and use it in a small example', 'Skip the explanation and memorize the title', 'Wait until the final assessment'],
          answerIdx: 0,
          why: 'Explaining an idea and applying it in a small example creates a useful proof of understanding.'
        }],
        quiz: [],
        recall: [],
        summary: 'This lesson is ready for practice.'
      };
      json(res, 200, basicLesson);
    }
  }
});

/* ── TUTOR ─────────────────────────────────────────────────────────── */
route('POST', '/api/tutor', async (ctx) => {
  const { user, body, res } = ctx;
  // Rate limit: AI tutor queries
  if (limiter.allow('tutor:' + user.id, 30, 60_000) !== true)
    throw httpError(429, 'RATE_LIMITED', 'Too many tutor questions. Take a moment to read the response, then try again.');
  
  const errs = validate(body, { type: 'object', required: ['question'], props: { question: { type: 'string', min: 1, max: 600 } } });
  if (errs.length) throw httpError(400, 'BAD_INPUT', 'Ask the tutor a question.');
  if (body.skillSlug === 'document-study') {
    const out = await documentTutorReply({
      pathId: body.pathId,
      skillSlug: body.skillSlug,
      topicSlug: body.topicSlug || '',
      question: body.question,
      history: Array.isArray(body.history) ? body.history.slice(-8) : [],
      lessonContext: body.lessonContext,
    });
    return json(res, 200, out);
  }
  try {
    const out = await tutorReply({
      domain: body.skillSlug || 'web-development',
      topicSlug: body.topicSlug || '',
      question: body.question,
      history: Array.isArray(body.history) ? body.history.slice(-8) : [],
    });
    json(res, 200, out);
  } catch (error) {
    // Tutor failures must not take down the lesson. Return the built-in lesson
    // context as a useful answer when a provider or topic lookup fails.
    console.error('[Tutor] Falling back after tutor failure:', error.message);
    try {
      const lesson = await generateLesson(body.skillSlug || 'web-development', body.topicSlug || '');
      const content = lesson.lesson || lesson;
      return json(res, 200, {
        intent: 'explain',
        reply: `${content.tldr || 'Let us work through this lesson together.'}\n\n${(content.sections || []).slice(0, 2).map((section) => `${section.h}: ${section.body}`).join('\n\n')}\n\nKey points:\n${(content.keyPoints || []).slice(0, 6).map((point) => `• ${point}`).join('\n')}`,
        engine: 'proof-engine',
      });
    } catch (fallbackError) {
      console.error('[Tutor] Lesson fallback failed:', fallbackError.message);
      return json(res, 200, {
        intent: 'coach',
        reply: 'I could not load the tutor context right now. Try asking about a specific piece, square, or chess idea again.',
        engine: 'proof-engine',
      });
    }
  }
});

/* ── CHALLENGES / PROOFS ───────────────────────────────────────────── */
route('GET', '/api/challenges', async (ctx) => {
  const { user, res } = ctx;
  const [daily, allChallenges] = await Promise.all([
    challenges.todayDaily(),
    store.all('challenges'),
  ]);
  // Group seeded path/proof challenges by skill so clients can browse by category.
  const bySkill = new Map();
  for (const c of allChallenges) {
    if (!c.skillSlug || c.kind === 'daily') continue;
    if (!bySkill.has(c.skillSlug)) bySkill.set(c.skillSlug, []);
    bySkill.get(c.skillSlug).push(c.id);
  }
  const categories = [...bySkill.entries()].map(([skillSlug, ids]) => ({ skillSlug, count: ids.length }));
  json(res, 200, {
    daily: { ...dailyView(daily), kind: 'daily' },
    categories,
    total: allChallenges.length,
  });
});

route('GET', '/api/challenges/:id', async (ctx) => {
  const { user, params, res } = ctx;
  let ch = await challenges.get(params.id);
  if (!ch) throw httpError(404, 'NOT_FOUND', 'Challenge not found.');
  // A bookmarked Chess proof should also receive its FEN configuration, even
  // if it predates the path repair that normally runs in the Prove hub.
  if (ch.type === 'chess' && !chessConfigFromChallenge(ch) && ch.pathId) {
    const pathRow = await store.get('paths', ch.pathId);
    if (pathRow?.userId === user.id) {
      await repairPathChallenges(pathRow);
      ch = await challenges.get(params.id);
    }
  }
  const open = await store.find('attempts', (a) => a.userId === user.id && a.challengeId === ch.id && a.status === 'in_progress');
  json(res, 200, { challenge: challengeView(ch), openAttemptId: open?.id || null });
});

route('GET', '/api/daily', async (ctx) => {
  const { user, res } = ctx;
  const daily = await challenges.todayDaily();
  const done = await store.findOptimized('attempts', { userId: user.id, challengeId: daily.id, submittedAt_not_null: true });
  json(res, 200, { challenge: { ...challengeView(daily), kind: 'daily' }, done: !!done, passed: done?.status === 'passed', attemptId: done?.id || null });
});

route('POST', '/api/challenges/:id/start', async (ctx) => {
  const { user, params, res } = ctx;
  const { attempt, resumed } = await challenges.startAttempt(user.id, params.id);
  json(res, resumed ? 200 : 201, { attemptId: attempt.id, resumed });
});

route('POST', '/api/attempts/:id/submit', async (ctx) => {
  const { user, params, body, res } = ctx;
  const result = await challenges.submitAttempt(user.id, params.id, body);
  json(res, 200, result);
});

route('GET', '/api/attempts/:id', async (ctx) => {
  const { user, params, res } = ctx;
  json(res, 200, await challenges.attemptResult(user.id, params.id));
});

route('GET', '/api/me/attempts', async (ctx) => {
  const { user, res } = ctx;
  const attempts = await challenges.userAttempts(user.id);
  json(res, 200, { attempts });
});

route('GET', '/api/me/proofs', async (ctx) => {
  const { user, query, res } = ctx;
  let proofs = await store.filter('skill_proofs', (p) => p.userId === user.id);
  if (query.get('skill')) proofs = proofs.filter((p) => p.skillSlug === query.get('skill'));
  proofs.sort((a, b) => b.completedAt - a.completedAt);
  json(res, 200, { proofs });
});

function publicChessConfig(chess) {
  if (!chess) return null;
  const sanitize = (entry) => {
    if (!entry) return entry;
    const { correctMoves, solution, ...publicEntry } = entry;
    return publicEntry;
  };
  return {
    fen: chess.fen,
    tasks: chess.tasks,
    scenarios: (chess.scenarios || []).map(sanitize),
    positions: (chess.positions || []).map(sanitize),
    puzzles: (chess.puzzles || []).map(sanitize),
  };
}

function challengeView(ch) {
  const speechConfig = ch.type === 'speech' ? (ch.evaluator?.config || {}) : null;
  const legacySpeechLanguage = speechConfig && !speechConfig.language
    ? languageSpeechTargets().find((target) => target.text === speechConfig.targets?.[0])?.language
    : null;
  return {
    id: ch.id, skillSlug: ch.skillSlug, kind: ch.kind, type: ch.type,
    title: ch.title, brief: ch.brief, requirements: ch.requirements,
    timeMin: ch.timeMin, passScore: ch.passScore, rewardNim: ch.rewardNim, xp: ch.xp,
    chess: ch.type === 'chess' ? publicChessConfig(chessConfigFromChallenge(ch)) : undefined,
    speech: speechConfig ? { target: speechConfig.targets?.[0] || '', language: speechConfig.language || legacySpeechLanguage || 'en' } : undefined,
    submissionFields: ch.type === 'html' ? ['code']
      : ch.type === 'js-static' ? ['code', 'explanation']
      : ch.type === 'chess' ? ['positions']
      : ch.type === 'speech' ? ['transcript']
      : ['text'],
  };
}

function dailyView(ch) {
  const v = challengeView(ch);
  return { ...v, kind: 'daily' };
}

async function chessPuzzleView(puzzle) {
  const position = puzzle.position || await store.get('ChessPosition', puzzle.positionId);
  if (!position) return { ...puzzle, position: null };

  return {
    ...puzzle,
    position: {
      ...position,
      sideToMove: resolvePuzzleTurn(position.fen || null, position.sideToMove || null),
    },
  };
}

/* ── CHESS ─────────────────────────────────────────────────────────── */
// Puzzles
route('GET', '/api/chess/puzzles/random', async (ctx) => {
  const { user, query, res } = ctx;
  const difficulty = query.get('difficulty') || null;
  const theme = query.get('theme') || null;
  const limit = parseInt(query.get('limit')) || 5;

  const puzzles = await Promise.all((await store.randomChessPuzzles({ difficulty, theme, limit })).map(chessPuzzleView));
  
  json(res, 200, { puzzles });
});

route('POST', '/api/chess/curriculum', async (ctx) => {
  const { user, body, res } = ctx;
  const level = ['beginner', 'intermediate', 'advanced'].includes(body?.level) ? body.level : 'beginner';
  const themes = Array.isArray(body?.themes) && body.themes.length
    ? body.themes.slice(0, 7).map((theme) => String(theme))
    : ['fork', 'pin', 'skewer', 'discovery', 'deflection', 'back-rank', 'double-attack'];
  const days = [];
  for (let index = 0; index < themes.length; index++) {
    const theme = themes[index];
    const puzzles = await store.randomChessPuzzles({ difficulty: level, theme, limit: 5 });
    days.push({
      index: index + 1,
      title: `${theme.replaceAll('-', ' ')} practice`,
      objective: `Learn to recognize ${theme.replaceAll('-', ' ')} patterns.`,
      items: puzzles.map((puzzle, puzzleIndex) => ({
        type: 'chess-puzzle',
        topic: puzzle.title,
        puzzleId: puzzle.id,
        positionId: puzzle.positionId,
        order: puzzleIndex + 1,
        completed: false,
      })),
    });
  }
  const path = await store.insert('paths', {
    id: uid('path'),
    userId: user.id,
    goal: `Build ${level} chess tactics fluency`,
    skillSlug: 'chess',
    skillName: 'Chess tactics',
    skillEmoji: '♞',
    title: `${level[0].toUpperCase() + level.slice(1)} chess tactics`,
    description: 'A real-puzzle curriculum that moves from pattern recognition to independent calculation.',
    level,
    minutesPerDay: 20,
    days,
    totalXp: days.reduce((total, day) => total + day.items.length * 20, 0),
    engine: 'lichess-puzzle-curriculum',
    progress: {},
    createdAt: now(),
  });
  await store.save();
  json(res, 201, { path: await pathView(path, user.id), source: 'lichess' });
});

route('GET', '/api/chess/puzzles/:topicSlug', async (ctx) => {
  const { user, params, res } = ctx;
  const puzzles = await Promise.all((await store.filter('ChessPuzzle', (p) => p.topicSlug === params.topicSlug)).map(chessPuzzleView));
  json(res, 200, { puzzles });
});

route('POST', '/api/chess/puzzles/:id/attempt', async (ctx) => {
  const { user, params, body, res } = ctx;
  const puzzle = await store.get('ChessPuzzle', params.id);
  if (!puzzle) throw httpError(404, 'NOT_FOUND', 'Puzzle not found');
  
  const { moves, timeSpentMs, hintsUsed } = body;
  const position = await store.get('ChessPosition', puzzle.positionId);
  const normalizedSolution = normalizeUserMoves(position?.fen || puzzle.position?.fen || null, puzzle.solution || []);
  const correct = JSON.stringify(moves || []) === JSON.stringify(normalizedSolution);
  
  // Calculate score based on correctness, hints, and time
  let score = correct ? 100 : 0;
  score -= (hintsUsed || 0) * 20;
  if (timeSpentMs && timeSpentMs < 10000) score += 10; // Time bonus
  score = Math.max(0, Math.min(100, score));
  
  const attempt = await store.create('ChessPuzzleAttempt', {
    userId: user.id,
    puzzleId: params.id,
    moves: moves || [],
    correct,
    hintsUsed: hintsUsed || 0,
    timeSpentMs: timeSpentMs || 0,
    score,
    createdAt: now(),
  });

  const reward = correct
    ? await rewards.rewardForChessPuzzle({ userId: user.id, puzzle, attempt })
    : { granted: false, reason: 'NOT_PASSED' };

  const currentProgress = await store.find('ChessUserProgress', (progress) => progress.userId === user.id) || {
    puzzleRating: 1200,
  };
  const previousRating = Number.isFinite(currentProgress.puzzleRating) ? currentProgress.puzzleRating : 1200;
  const hintPenalty = Math.min(Number(hintsUsed) || 0, 5) * 10;
  const ratingDelta = correct ? Math.max(5, 25 - hintPenalty) : -Math.max(25, 25 + hintPenalty);
  const nextRating = Math.max(400, previousRating + ratingDelta);
  await store.recordChessProgress({ userId: user.id, correct, hintsUsed, score });
  const baseXpGained = correct ? 25 : 5;
  const xpGained = correct && (hintsUsed || 0) > 0 ? Math.max(1, Math.round(baseXpGained * 0.5)) : baseXpGained;
  const xpResult = await users.addXp(
    user.id,
    xpGained,
    correct ? 'Chess puzzle solved' : 'Chess practice attempt',
    `chess:${puzzle.id}:${attempt.id}`,
  );
  const streak = await users.touchStreak(user.id);
  const newAchievements = await users.checkAchievements(user.id);
  
  json(res, 201, {
    attempt,
    correct,
    score,
    ratingDelta,
    previousRating,
    newRating: nextRating,
    reward: reward.granted ? { amountNim: reward.amountNim } : null,
    rewardReason: reward.reason || null,
    xpGained,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel || null,
    streak,
    newAchievements,
  });
});

route('GET', '/api/chess/puzzles/:id/hint', async (ctx) => {
  const { user, params, query, res } = ctx;
  const puzzle = await store.get('ChessPuzzle', params.id);
  if (!puzzle) throw httpError(404, 'NOT_FOUND', 'Puzzle not found');

  const hintLevel = parseInt(query.get('level')) || 1;
  const position = await store.get('ChessPosition', puzzle.positionId);
  const hintResponse = await buildPuzzleHint(puzzle, hintLevel, position?.fen || null);

  json(res, 200, {
    hint: hintResponse.hint,
    hasMore: hintResponse.hasMore,
    bestMove: hintResponse.bestMove,
  });
});

// Analysis
route('POST', '/api/chess/analyze/position', async (ctx) => {
  const { user, body, res } = ctx;
  const { fen, depth } = body;
  if (!fen) throw httpError(400, 'BAD_INPUT', 'FEN position required');
  
  const evaluation = await stockfish.evaluatePosition(fen, { depth: depth || 15 });
  const hints = await stockfish.getTacticalHints(fen);
  
  json(res, 200, { evaluation, hints });
});

route('POST', '/api/chess/analyze/game', async (ctx) => {
  const { user, body, res } = ctx;
  const { pgn, topicSlug } = body;
  if (!pgn) throw httpError(400, 'BAD_INPUT', 'PGN required');
  
  const analysis = await stockfish.analyzeGame(pgn, { depth: 12 });
  
  // Save analysis to database
  const saved = await store.create('ChessGameAnalysis', {
    userId: user.id,
    pgn,
    whitePlayer: 'User',
    blackPlayer: 'Opponent',
    result: '*',
    analysis: analysis,
    notes: '',
    topicSlug: topicSlug || null,
  });
  
  json(res, 201, { analysis, analysisId: saved.id });
});

route('POST', '/api/chess/validate/move', async (ctx) => {
  const { body, res } = ctx;
  const { fen, move } = body;
  if (!fen || !move) throw httpError(400, 'BAD_INPUT', 'FEN and move required');
  
  const validation = stockfish.validateMove(fen, move);
  json(res, 200, validation);
});

// Opening Repertoire
route('GET', '/api/chess/repertoire', async (ctx) => {
  const { user, res } = ctx;
  const repertoire = await store.filter('ChessOpeningRepertoire', (r) => r.userId === user.id);
  json(res, 200, { repertoire });
});

route('POST', '/api/chess/repertoire', async (ctx) => {
  const { user, body, res } = ctx;
  const { name, color, eco, moves, notes } = body;
  
  const opening = await store.create('ChessOpeningRepertoire', {
    userId: user.id,
    name: name || 'Untitled Opening',
    color: color || 'white',
    eco: eco || null,
    moves: moves || [],
    notes: notes || '',
    practiceCount: 0,
    accuracy: 0,
    lastPracticed: new Date().toISOString(),
  });
  
  json(res, 201, { opening });
});

route('PUT', '/api/chess/repertoire/:id', async (ctx) => {
  const { user, params, body, res } = ctx;
  const opening = await store.get('ChessOpeningRepertoire', params.id);
  if (!opening || opening.userId !== user.id) {
    throw httpError(404, 'NOT_FOUND', 'Opening not found');
  }
  
  const updated = await store.update('ChessOpeningRepertoire', params.id, body);
  json(res, 200, { opening: updated });
});

route('DELETE', '/api/chess/repertoire/:id', async (ctx) => {
  const { user, params, res } = ctx;
  const opening = await store.get('ChessOpeningRepertoire', params.id);
  if (!opening || opening.userId !== user.id) {
    throw httpError(404, 'NOT_FOUND', 'Opening not found');
  }
  
  await store.delete('ChessOpeningRepertoire', params.id);
  json(res, 200, { success: true });
});

// Progress
route('GET', '/api/chess/progress', async (ctx) => {
  const { user, res } = ctx;
  const progress = await store.filter('ChessUserProgress', (p) => p.userId === user.id);
  const userProgress = progress[0] || {
    puzzleRating: 1200,
    puzzlesSolved: 0,
    averageAccuracy: 0,
    strongThemes: [],
    weakThemes: [],
    currentStreak: 0,
  };
  
  json(res, 200, { progress: userProgress });
});

route('GET', '/api/chess/progress/themes', async (ctx) => {
  const { user, res } = ctx;
  const attempts = await store.filter('ChessPuzzleAttempt', (a) => a.userId === user.id);
  
  // Group by theme
  const themeStats = {};
  for (const attempt of attempts) {
    const puzzle = await store.get('ChessPuzzle', attempt.puzzleId);
    if (puzzle && puzzle.themes) {
      for (const theme of puzzle.themes) {
        if (!themeStats[theme]) {
          themeStats[theme] = { theme, total: 0, correct: 0, accuracy: 0 };
        }
        themeStats[theme].total++;
        if (attempt.correct) themeStats[theme].correct++;
      }
    }
  }
  
  // Calculate accuracy
  for (const theme in themeStats) {
    themeStats[theme].accuracy = 
      Math.round((themeStats[theme].correct / themeStats[theme].total) * 100);
  }
  
  json(res, 200, { themes: Object.values(themeStats) });
});

route('GET', '/api/chess/progress/history', async (ctx) => {
  const { user, query, res } = ctx;
  const limit = parseInt(query.get('limit')) || 20;
  const attempts = await store.filter('ChessPuzzleAttempt', (a) => a.userId === user.id);
  const recent = attempts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
  
  json(res, 200, { attempts: recent });
});

// Challenge Integration
route('POST', '/api/chess/challenge/start', async (ctx) => {
  const { user, body, res } = ctx;
  const { challengeId } = body;
  
  const challenge = await store.get('challenges', challengeId);
  if (!challenge || challenge.skill !== 'chess') {
    throw httpError(404, 'NOT_FOUND', 'Chess challenge not found');
  }
  
  // Create attempt using existing challenge system
  const { attempt, resumed } = await challenges.startAttempt(user.id, challengeId);
  
  json(res, 200, { attempt, resumed });
});

route('POST', '/api/chess/challenge/:id/submit', async (ctx) => {
  const { user, params, body, res } = ctx;
  
  // Use existing challenge submission system
  const result = await challenges.submitAttempt(user.id, params.id, body);
  
  json(res, 200, result);
});

/* ── WALLET / ECONOMY ──────────────────────────────────────────────── */
route('GET', '/api/wallet', async (ctx) => {
  const { user, res } = ctx;
  const current = await users.get(user.id) || user;
  const walletBalanceNim = await connectedWalletBalance(current);
  json(res, 200, {
    mode: current.walletMode || 'disconnected',
    network: config.nimiq.rpcUrl ? 'nimiq-mainnet' : 'demo-ledger',
    address: current.walletAddress,
    balanceNim: walletBalanceNim,
    ledgerBalanceNim: toNim(current.balanceLuna),
    walletBalanceNim,
    earnedNim: toNim(current.earnedLuna),
    pendingPayouts: await rewards.pendingPayoutsForUser(user.id),
    txs: (await rewards.txHistory(user.id)).map((t) => ({ ...t, amountNim: toNim(t.amountLuna) })),
  });
});

route('POST', '/api/wallet/payout', async (ctx) => {
  const { user, body, res } = ctx;
  let amountNim;
  try {
    amountNim = parseNumber(body?.amountNim, { min: 0, max: 1_000_000 });
  } catch (error) {
    throw httpError(400, 'INVALID_AMOUNT', error.message);
  }
  const tx = await rewards.requestPayout(user.id, amountNim);
  notifications.push(user.id, {
    type: 'payout_sent',
    emoji: '💸',
    title: 'NIM payout sent',
    body: `${amountNim} NIM was sent to your wallet${tx.ref ? ` · ${shortTxRef(tx.ref)}` : ''}.`,
    href: '#/profile',
  });
  json(res, 201, { tx: { ...tx, amountNim: toNim(tx.amountLuna) } });
});

route('POST', '/api/tips', async (ctx) => {
  const { user, body, res } = ctx;
  const to = await users.get(String(body?.toUserId || ''));
  if (!to) throw httpError(404, 'NOT_FOUND', 'User not found.');
  const amountNim = parseNumber(body?.amountNim, { min: 0.01, max: 10_000 });
  const tx = await rewards.tip(user.id, to.id, amountNim, String(body?.note || '').slice(0, 140));
  notifications.push(to.id, { type: 'tip', emoji: '💸', title: `${user.username} tipped you ${amountNim} NIM`, body: String(body?.note || ''), href: '#/profile' });
  json(res, 201, { ok: true, tx: { ...tx, amountNim: toNim(tx.amountLuna) } });
});

route('GET', '/api/rewards', async (ctx) => {
  const { user, res } = ctx;
  const [rows, today] = await Promise.all([
    store.filter('rewards', (r) => r.userId === user.id),
    rewards.dailyRewardTotals(user.id),
  ]);
  json(res, 200, {
    rewards: rows.sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({ ...r, amountNim: toNim(r.amountLuna) })),
    today,
  });
});

async function dailyLearningActivity(userId) {
  const start = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z').getTime();
  const [paths, attempts] = await Promise.all([
    store.filter('paths', (path) => path.userId === userId),
    store.filter('attempts', (attempt) => attempt.userId === userId && attempt.submittedAt >= start),
  ]);
  const progressActivity = paths.flatMap((path) => Object.entries(path.progress || {}))
    .map(([key, value]) => ({ part: String(key).split(':').at(-1), value }))
    .find(({ part, value }) => {
      const timestamp = typeof value === 'number' ? value : Date.parse(String(value));
      return ['lesson', 'practice', 'quiz'].includes(part) && Number.isFinite(timestamp) && timestamp >= start;
    });
  const hasActivity = Boolean(progressActivity || attempts.length);
  return { hasActivity, source: progressActivity?.part || (attempts.length ? 'proof' : null) };
}

async function dailyClaimView(userId) {
  const user = await store.get('users', userId);
  const today = rewards.todayKey();
  const claim = await store.find('rewards', (reward) => reward.userId === userId && reward.key === `${userId}:daily:${today}`);
  const activity = await dailyLearningActivity(userId);
  const streak = users.currentStreak(user);
  return {
    claimed: Boolean(claim),
    eligible: !claim && activity.hasActivity,
    amountNim: claim ? toNim(claim.amountLuna) : Math.round(Math.max(1, streak + (activity.hasActivity && streak === 0 ? 1 : 0)) * 0.1 * 10) / 10,
    streak: Math.max(1, streak),
    activity: activity.source,
  };
}

route('GET', '/api/rewards/daily', async (ctx) => {
  const { user, res } = ctx;
  json(res, 200, await dailyClaimView(user.id));
});

route('POST', '/api/rewards/daily/claim', async (ctx) => {
  const { user, res } = ctx;
  const activity = await dailyLearningActivity(user.id);
  if (!activity.hasActivity) throw httpError(400, 'DAILY_ACTIVITY_REQUIRED', 'Complete a lesson, quiz, practice, or proof before claiming today\'s NIM.');

  const streak = await users.touchStreak(user.id);
  const dailyChallenge = await challenges.todayDaily();
  const result = await rewards.claimDaily({
    userId: user.id,
    challengeId: dailyChallenge.id,
    streak: streak?.current || 1,
  });
  if (!result.granted && result.reason === 'ALREADY_CLAIMED') {
    throw httpError(409, 'ALREADY_CLAIMED', 'Today\'s NIM has already been claimed.');
  }
  if (result.payout?.ref) {
    const ref = result.payout.ref;
    notifications.push(user.id, {
      type: 'payout_sent', emoji: '💸', title: 'Daily NIM sent to your connected wallet',
      body: `${result.amountNim} NIM sent · ${shortTxRef(ref)}`,
      href: `https://nimiq.watch/#${ref}`,
    });
  }
  json(res, 201, { ...result, amountNim: result.amountNim });
});

/* ── MARKETPLACE ───────────────────────────────────────────────────── */
route('GET', '/api/market/treasury', async (ctx) => {
  const { res } = ctx;
  const treasuryAddress = config.nimiq.treasuryAddress || '';
  json(res, 200, { treasuryAddress, configured: Boolean(treasuryAddress) });
});
route('GET', '/api/market/tasks', async (ctx) => {
  const { user, query, res } = ctx;
  json(res, 200, { tasks: await market.listTasks(user.id, { onlyQualified: query.get('qualified') === '1' }) });
});
route('GET', '/api/market/tasks/:id', async (ctx) => {
  const { user, params, res } = ctx;
  const t = await market.get(params.id, user.id);
  if (!t) throw httpError(404, 'NOT_FOUND', 'Task not found.');
  json(res, 200, { task: t });
});
route('POST', '/api/market/tasks/:id/apply', async (ctx) => {
  const { user, params, body, res } = ctx;
  json(res, 201, { application: await market.apply(params.id, user, body?.pitch) });
});
route('POST', '/api/market/tasks/:id/complete', async (ctx) => {
  const { user, params, res } = ctx;
  json(res, 200, await market.completeTask(params.id, user));
});
route('POST', '/api/market/tasks', async (ctx) => {
  const { user, body, res } = ctx;
  json(res, 201, { task: await market.postTask(user, body || {}) });
});
route('GET', '/api/market/my', async (ctx) => {
  const { user, res } = ctx;
  const tasks = await market.myTasks(user.id);
  json(res, 200, tasks);
});

/* ── TEACHING ──────────────────────────────────────────────────────── */
route('GET', '/api/teach/sessions', async (ctx) => {
  const { user, query, res } = ctx;
  json(res, 200, { sessions: await teaching.list({ skillSlug: query.get('skill') || null }) });
});
route('POST', '/api/teach/sessions', async (ctx) => {
  const { user, body, res } = ctx;
  const session = await teaching.createSession(user, body || {});
  json(res, 201, { session: teaching.view(session) });
});
route('GET', '/api/teach/mine', async (ctx) => {
  const { user, res } = ctx;
  json(res, 200, { sessions: await teaching.mine(user.id) });
});
route('POST', '/api/teach/sessions/:id/book', async (ctx) => {
  const { user, params, res } = ctx;
  json(res, 201, { session: await teaching.book(params.id, user) });
});
route('POST', '/api/teach/sessions/:id/review', async (ctx) => {
  const { user, params, body, res } = ctx;
  json(res, 201, { session: await teaching.review(params.id, user, body || {}) });
});

/* ── EXTRAS ────────────────────────────────────────────────────────── */
route('GET', '/api/leaderboard', async (ctx) => {
  const { query, res } = ctx;
  const cat = ['xp', 'streak', 'proofs', 'score', 'helpful', 'teacher', 'consistent', 'tasks', 'earned'].includes(query.get('cat')) ? query.get('cat') : 'xp';
  const limit = Math.max(1, Math.min(50, parseInt(query.get('limit') || '10', 10) || 10));
  const offset = Math.max(0, parseInt(query.get('offset') || '0', 10) || 0);
  json(res, 200, { category: cat, entries: await users.leaderboard(cat, limit, offset), total: (await users.leaderboard(cat, 1000)).length });
});

route('GET', '/api/achievements', async (ctx) => {
  const { user, res } = ctx;
  const filtered = await store.filter('user_achievements', (a) => a.userId === user.id);
  const unlocked = filtered.map((a) => a.achievementId);
  const definitions = await store.all('achievements');
  const definitionIds = new Map(definitions.map((a) => [a.id, a.key]));
  json(res, 200, {
    achievements: users.ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: unlocked.some((id) => definitionIds.get(id) === a.id || id === a.id),
    })),
  });
});

route('GET', '/api/notifications', async (ctx) => {
  const { user, res } = ctx;
  const list = await notifications.list(user.id);
  const unread = await notifications.unreadCount(user.id);
  json(res, 200, { notifications: list, unread });
});
route('POST', '/api/notifications/read', async (ctx) => {
  const { user, res } = ctx;
  await notifications.markAllRead(user.id);
  json(res, 200, { ok: true });
});

route('GET', '/api/search', async (ctx) => {
  const { user, query, res } = ctx;
  const term = String(query.get('q') || '').trim().toLowerCase().slice(0, 80);
  if (term.length < 2) return json(res, 200, { results: [] });

  const matches = (...values) => values.some((value) => String(value || '').toLowerCase().includes(term));
  const [catalog, paths, attempts, allChallenges] = await Promise.all([
    skills.catalog(),
    store.filter('paths', (pathRow) => pathRow.userId === user.id),
    store.filter('attempts', (attempt) => attempt.userId === user.id && attempt.submittedAt),
    store.all('challenges'),
  ]);
  const challengeById = new Map(allChallenges.map((challenge) => [challenge.id, challenge]));
  const results = [
    ...catalog.filter((skill) => matches(skill.name, skill.slug, skill.description, skill.category)).slice(0, 8).map((skill) => ({
      type: 'skill', title: skill.name, detail: skill.description || skill.category || 'Skill', to: `/learn?skill=${encodeURIComponent(skill.slug)}`,
    })),
    ...paths.filter((pathRow) => matches(pathRow.title, pathRow.description, pathRow.goal, pathRow.skillName, pathRow.skillSlug)).slice(0, 8).map((pathRow) => ({
      type: 'path', title: pathRow.title, detail: pathRow.goal || pathRow.skillName || 'Learning path', to: `/learn/path/${pathRow.id}`,
    })),
    ...attempts.map((attempt) => ({ attempt, challenge: challengeById.get(attempt.challengeId) }))
      .filter(({ challenge }) => challenge && matches(challenge.title, challenge.brief, challenge.skillSlug))
      .slice(0, 8).map(({ attempt, challenge }) => ({
        type: 'proof', title: challenge.title, detail: `${challenge.skillSlug || 'Skill'} · ${attempt.status === 'passed' ? 'Passed proof' : 'Proof attempt'}`, to: `/prove/challenge/${challenge.id}`,
      })),
  ].slice(0, 20);
  json(res, 200, { results });
});

route('GET', '/api/sponsored', async (ctx) => {
  const { user, res } = ctx;
  const all = await store.all('sponsored_challenges');
  json(res, 200, { sponsored: await Promise.all(all.map((s) => sponsoredView(s, user.id))) });
});

route('POST', '/api/sponsored/:id/join', async (ctx) => {
  const { user, params, res } = ctx;
  const s = store.get('sponsored_challenges', params.id);
  if (!s) throw httpError(404, 'NOT_FOUND', 'Challenge not found.');
  const key = `${user.id}:${s.id}`;
  if (store.find('sponsored_participants', (p) => p.key === key))
    throw httpError(409, 'ALREADY_JOINED', 'You already joined this challenge.');
  store.insert('sponsored_participants', { id: uid('sp'), key, userId: user.id, sponsoredId: s.id, joinedAt: now() });
  notifications.push(user.id, { type: 'sponsored', emoji: '🏆', title: `You're in: ${s.title}`, body: `${toNim(s.poolLuna)} NIM pool — pass the final proof to qualify.`, href: '#/prove' });
  store.save();
  json(res, 201, { sponsored: await sponsoredView(store.get('sponsored_challenges', s.id), user.id) });
});

async function sponsoredView(s, userId) {
  return {
    id: s.id, title: s.title, description: s.description, skillSlug: s.skillSlug,
    emoji: s.emoji, sponsor: s.sponsor,
    poolNim: toNim(s.poolLuna), topNim: toNim(s.topLuna), qualifiedNim: toNim(s.qualifiedLuna),
    participants: await store.count('sponsored_participants', (p) => p.sponsoredId === s.id), endsInDays: s.endsInDays,
    joined: !!store.find('sponsored_participants', (p) => p.userId === userId && p.sponsoredId === s.id),
  };
}

route('GET', '/api/skills', async (ctx) => {
  const { user, res } = ctx;
  const [catalog, mine] = await Promise.all([
    skills.catalog(),
    skills.userSkills(user.id),
  ]);
  const myBySlug = new Map(mine.map((s) => [s.skillSlug, s]));
  json(res, 200, {
    skills: catalog.map((s) => {
      const us = myBySlug.get(s.slug);
      return {
        ...s,
        my: us ? { score: us.score, tier: skills.tierFor(us.score), verified: us.verified, proofs: us.proofs } : null,
      };
    }),
    total: catalog.length,
  });
});

route('GET', '/api/skills/tree', async (ctx) => {
  const { user, res } = ctx;
  json(res, 200, { skills: await skills.skillTree(user.id) });
});

route('GET', '/api/skills/:slug', async (ctx) => {
  const { user, params, res } = ctx;
  const skill = await skills.bySlug(params.slug);
  if (!skill) throw httpError(404, 'NOT_FOUND', 'Skill not found.');
  const us = skills.userSkill(user.id, params.slug);
  const [sessions, tasks] = await Promise.all([
    teaching.list({ skillSlug: params.slug }),
    market.listTasks(user.id),
  ]);
  json(res, 200, {
    skill,
    my: us ? { score: us.score, tier: skills.tierFor(us.score), verified: us.verified, proofs: us.proofs } : null,
    teachers: sessions.slice(0, 3),
    tasks: tasks.filter((t) => t.minProof?.skillSlug === params.slug).slice(0, 3),
    learners: 90 + (skill.popularity || 0) * 29,
  });
});

route('GET', '/api/profile/:username', async (ctx) => {
  const { params, res } = ctx;
  const u = await users.findByUsername(params.username);
  if (!u) throw httpError(404, 'NOT_FOUND', 'Proofer not found.');
  const profile = await users.publicProfile(u.id);
  profile.isDemoUser = !!u.isDemo;
  json(res, 200, { profile });
});

route('GET', '/api/share/proof/:publicId', (ctx) => {
  const { params, res } = ctx;
  const proof = skills.proofByPublicId(params.publicId);
  if (!proof) throw httpError(404, 'NOT_FOUND', 'Proof not found.');
  const user = users.get(proof.userId);
  const us = skills.userSkill(proof.userId, proof.skillSlug);
  json(res, 200, {
    proof: {
      publicId: proof.publicId, username: user?.username, avatar: user?.avatar,
      skillName: skills.bySlug(proof.skillSlug)?.name || proof.skillSlug,
      skillSlug: proof.skillSlug, score: proof.score, passed: proof.passed,
      challengeTitle: proof.challengeTitle, kind: proof.kind,
      tier: us ? skills.tierFor(us.score) : null, verified: us?.verified || false,
      proofsCompleted: us?.passed || 1,
      reputation: user?.reputation, completedAt: proof.completedAt,
      shareUrl: `${config.appUrl}/p/${proof.publicId}`,
    },
  });
});

/* ── USER STATS & LEARN ANYTHING FEATURES ──────────────────────────── */
import * as userStats from './services/user-stats.js';
import * as learningGoals from './services/learning-goals.js';
import * as spacedRepetition from './services/spaced-repetition.js';
import * as masteryBadges from './services/mastery-badges.js';
import * as socraticTutor from './services/socratic-tutor.js';

// Initialize services with store
userStats.setStore(store);
learningGoals.setStore(store);
spacedRepetition.setStore(store);
masteryBadges.setStore(store);
socraticTutor.setStore(store);

route('GET', '/api/stats', async (ctx) => {
  const { user, res } = ctx;
  const stats = await userStats.getComprehensiveStats(user.id);
  json(res, 200, { stats });
});

route('GET', '/api/stats/streak', async (ctx) => {
  const { user, res } = ctx;
  const streak = await userStats.getStreakStatus(user.id);
  json(res, 200, { streak });
});

route('GET', '/api/stats/calendar', async (ctx) => {
  const { user, query, res } = ctx;
  const days = parseInt(query.get('days') || '365', 10);
  const calendar = await userStats.getActivityCalendar(user.id, days);
  json(res, 200, { calendar });
});

route('POST', '/api/sessions', async (ctx) => {
  const { user, body, res } = ctx;
  const sessionId = await userStats.recordSession(user.id, body);
  json(res, 201, { sessionId });
});

// Learning Goals
route('GET', '/api/goals', async (ctx) => {
  const { user, res } = ctx;
  const summary = await learningGoals.getGoalSummary(user.id);
  json(res, 200, summary);
});

route('POST', '/api/goals', async (ctx) => {
  const { user, body, res } = ctx;
  const goal = await learningGoals.createGoal(user.id, body);
  json(res, 201, { goal });
});

route('DELETE', '/api/goals/:id', async (ctx) => {
  const { user, params, res } = ctx;
  await learningGoals.deleteGoal(user.id, params.id);
  json(res, 200, { ok: true });
});

route('POST', '/api/goals/default', async (ctx) => {
  const { user, res } = ctx;
  const goals = await learningGoals.createDefaultGoals(user.id);
  json(res, 201, { goals });
});

// Spaced Repetition Reviews
route('GET', '/api/reviews/due', async (ctx) => {
  const { user, query, res } = ctx;
  const limit = parseInt(query.get('limit') || '20', 10);
  const reviews = await spacedRepetition.getDueReviews(user.id, limit);
  json(res, 200, { reviews, count: reviews.length });
});

// `/api/review` — concise alias for the review queue (the mobile Review tab).
route('GET', '/api/review', async (ctx) => {
  const { user, query, res } = ctx;
  const limit = parseInt(query.get('limit') || '20', 10);
  const reviews = await spacedRepetition.getDueReviews(user.id, limit);
  json(res, 200, { reviews, count: reviews.length, due: reviews.length });
});

route('POST', '/api/reviews', async (ctx) => {
  const { user, body, res } = ctx;
  const errs = validate(body, {
    type: 'object',
    required: ['topicSlug', 'topicTitle', 'skillSlug'],
    props: {
      topicSlug: { type: 'string', max: 100 },
      topicTitle: { type: 'string', max: 200 },
      skillSlug: { type: 'string', max: 50 }
    }
  });
  if (errs.length) throw httpError(400, 'BAD_INPUT', errs[0]);
  
  const review = await spacedRepetition.scheduleReview(user.id, body);
  json(res, 201, { review });
});

route('POST', '/api/reviews/:id/complete', async (ctx) => {
  const { user, params, body, res } = ctx;
  const errs = validate(body, {
    type: 'object',
    required: ['quality'],
    props: {
      quality: { type: 'integer', min: 0, max: 5 }
    }
  });
  if (errs.length) throw httpError(400, 'BAD_INPUT', errs[0]);
  
  const updated = await spacedRepetition.recordReview(user.id, params.id, body.quality);
  await userStats.incrementReviews(user.id);
  await learningGoals.updateGoalProgress(user.id, 'weekly_reviews', 1);
  
  // Check for badges
  const awarded = await masteryBadges.checkAndAwardBadges(user.id);
  for (const badge of awarded) {
    notifications.push(user.id, { 
      type: 'badge', 
      emoji: badge.definition.emoji, 
      title: `Badge unlocked: ${badge.definition.name}`, 
      body: badge.definition.description, 
      href: '#/profile' 
    });
  }
  
  json(res, 200, { review: updated, newBadges: awarded });
});

route('GET', '/api/reviews/stats', async (ctx) => {
  const { user, res } = ctx;
  const stats = await spacedRepetition.getReviewStats(user.id);
  json(res, 200, { stats });
});

route('DELETE', '/api/reviews/:id', async (ctx) => {
  const { user, params, res } = ctx;
  await spacedRepetition.deleteReview(user.id, params.id);
  json(res, 200, { ok: true });
});

route('POST', '/api/reviews/:id/suspend', async (ctx) => {
  const { user, params, res } = ctx;
  await spacedRepetition.suspendReview(user.id, params.id);
  json(res, 200, { ok: true });
});

// Mastery Badges
route('GET', '/api/badges', async (ctx) => {
  const { user, res } = ctx;
  const badges = await masteryBadges.getUserBadges(user.id);
  const progress = await masteryBadges.getBadgeProgress(user.id);
  const next = await masteryBadges.getNextBadges(user.id, 5);
  json(res, 200, { badges, progress, next });
});

route('GET', '/api/badges/definitions', async (ctx) => {
  const { res } = ctx;
  const definitions = masteryBadges.getBadgeDefinitions();
  json(res, 200, { definitions });
});

route('POST', '/api/badges/check', async (ctx) => {
  const { user, res } = ctx;
  const awarded = await masteryBadges.checkAndAwardBadges(user.id);
  const specialBadges = await masteryBadges.checkSpecialBadges(user.id);
  json(res, 200, { awarded: [...awarded, ...specialBadges] });
});

// Socratic Teaching
route('POST', '/api/socratic/start', async (ctx) => {
  const { user, body, res } = ctx;
  const errs = validate(body, {
    type: 'object',
    required: ['type', 'topicTitle'],
    props: {
      type: { type: 'string' },
      topicSlug: { type: 'string', max: 100 },
      topicTitle: { type: 'string', max: 200 },
      context: { type: 'object' }
    }
  });
  if (errs.length) throw httpError(400, 'BAD_INPUT', errs[0]);
  
  try {
    const session = await socraticTutor.startGrillingSession(user.id, body);
    json(res, 201, { session });
  } catch (e) {
    if (/column.*schema cache|Insert failed/i.test(String(e.message || '')))
      throw httpError(500, 'DB_SCHEMA_MISMATCH', 'Database is missing socratic_sessions columns — run database/fix-socratic-columns.sql against Supabase, then retry.');
    throw e;
  }
});

route('POST', '/api/socratic/:id/respond', async (ctx) => {
  const { user, params, body, res } = ctx;
  const errs = validate(body, {
    type: 'object',
    required: ['response'],
    props: {
      response: { type: 'string', min: 1, max: 2000 }
    }
  });
  if (errs.length) throw httpError(400, 'BAD_INPUT', errs[0]);
  
  const result = await socraticTutor.recordResponse(params.id, body.response);
  json(res, 200, result);
});

route('GET', '/api/socratic/sessions', async (ctx) => {
  const { user, query, res } = ctx;
  const limit = parseInt(query.get('limit') || '10', 10);
  const sessions = await socraticTutor.getUserSessions(user.id, limit);
  json(res, 200, { sessions });
});

route('GET', '/api/socratic/:id/insights', async (ctx) => {
  const { user, params, res } = ctx;
  const insights = await socraticTutor.getSessionInsights(params.id);
  json(res, 200, insights);
});

route('POST', '/api/socratic/wait-what', async (ctx) => {
  const { user, body, res } = ctx;
  const session = await socraticTutor.triggerWaitWhat(user.id, {
    topicSlug: body.topicSlug,
    specificText: body.specificText
  });
  json(res, 201, { session });
});

// Glossary
route('GET', '/api/glossary', async (ctx) => {
  const { user, query, res } = ctx;
  const level = query.get('level'); // beginner, intermediate, expert
  const limit = parseInt(query.get('limit') || '50', 10);
  const glossary = await socraticTutor.getGlossary(user.id, { level, limit });
  json(res, 200, { terms: glossary, count: glossary.length });
});

route('POST', '/api/glossary', async (ctx) => {
  const { user, body, res } = ctx;
  const errs = validate(body, {
    type: 'object',
    required: ['term', 'definition', 'level'],
    props: {
      term: { type: 'string', min: 1, max: 100 },
      definition: { type: 'string', min: 1, max: 1000 },
      level: { type: 'string' },
      source: { type: 'string', max: 100 }
    }
  });
  if (errs.length) throw httpError(400, 'BAD_INPUT', errs[0]);
  
  const entry = await socraticTutor.addToGlossary(user.id, body);
  json(res, 201, { term: entry });
});

route('DELETE', '/api/glossary/:id', async (ctx) => {
  const { user, params, res } = ctx;
  await socraticTutor.deleteGlossaryTerm(user.id, params.id);
  json(res, 200, { ok: true });
});

route('GET', '/api/health', (ctx) => json(ctx.res, 200, { ok: true, uptime: process.uptime() }));

route('GET', '/api/tts', async (ctx) => {
  const text = String(ctx.query.get('text') || '').trim();
  const lang = String(ctx.query.get('lang') || '').trim().replace('_', '-');
  const requestedSpeed = Number(ctx.query.get('speed') || 1);
  const speed = Number.isFinite(requestedSpeed) ? Math.min(1, Math.max(0.5, requestedSpeed)) : 1;
  if (!text || text.length > 5000) throw httpError(400, 'BAD_INPUT', 'Text must be between 1 and 5000 characters.');
  if (!/^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(lang)) throw httpError(400, 'BAD_INPUT', 'Invalid language code.');

  const audioContent = await synthesizeWithPiper(text, lang, speed);
  ctx.res.writeHead(200, {
    'content-type': 'audio/wav',
    'content-length': audioContent.length,
    'x-tts-engine': 'piper',
    'cache-control': 'private, max-age=3600',
  });
  ctx.res.end(audioContent);
});

/* ── PUBLIC PAGES: proof page + share card ────────────────────────── */
async function proofData(publicId) {
  const proof = await skills.proofByPublicId(publicId);
  if (!proof) return null;
  const user = users.get(proof.userId);
  const skill = skills.bySlug(proof.skillSlug);
  const us = await skills.userSkill(proof.userId, proof.skillSlug);
  return {
    proof, user, skill,
    skillName: skill?.name || proof.skillSlug,
    username: user?.username || 'Proofer',
    avatar: user?.avatar || '🙂',
    tier: us ? skills.tierFor(us.score) : null,
    proofsPassed: us?.passed || 1,
    date: new Date(proof.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
}

route('GET', '/p/:publicId', async (ctx) => {
  const { params, res } = ctx;
  const d = await proofData(params.publicId);
  if (!d) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Proof not found'); return; }
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(d.username)} proved ${escapeHtml(d.skillName)} · PROOF</title>
<meta property="og:title" content="${escapeHtml(d.username)} — verified ${escapeHtml(d.skillName)}">
<meta property="og:description" content="Score ${proof_score(d)}/100 · verified on PROOF. Don't just say you can build. Prove it.">
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(120% 120% at 100% 0%, rgba(233,178,19,.16), transparent 42%),linear-gradient(160deg,#1F2348,#2A2E66 55%,#5F4B8B);font-family:'Muli',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;padding:24px}
  .card{width:100%;max-width:420px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:34px 30px;backdrop-filter:blur(12px);box-shadow:0 30px 80px rgba(0,0,0,.45);text-align:center}
  .badge{display:inline-flex;align-items:center;gap:8px;background:radial-gradient(100% 100% at bottom right,#41A38E,#21BCA5);color:#fff;font-weight:800;font-size:12px;letter-spacing:.14em;padding:7px 14px;border-radius:999px}
  h1{font-size:30px;margin:18px 0 2px;letter-spacing:-.02em}
  .skill{color:rgba(255,255,255,.75);font-weight:700;font-size:17px}
  .score{font-size:64px;font-weight:900;margin:16px 0 2px;background:linear-gradient(90deg,#F8DE7A,#EC991C);-webkit-background-clip:text;background-clip:text;color:transparent}
  .of{color:rgba(255,255,255,.55);font-size:13px;letter-spacing:.2em;font-weight:700}
  .meta{display:flex;justify-content:center;gap:22px;margin-top:22px;color:rgba(255,255,255,.75);font-size:13px}
  .meta b{display:block;color:#fff;font-size:16px}
  .chal{margin-top:18px;padding:14px 16px;background:rgba(255,255,255,.06);border-radius:14px;font-size:13px;color:rgba(255,255,255,.8)}
  .foot{margin-top:26px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.5)}
  .logo{font-weight:900;letter-spacing:.22em;font-size:13px}
  .logo span{color:#E9B213}
</style></head><body>
<div class="card">
  <div class="badge">✓ PROOF VERIFIED</div>
  <h1>${escapeHtml(d.avatar + ' ' + d.username)}</h1>
  <div class="skill">${escapeHtml(d.skillName)}${d.tier ? ' · ' + escapeHtml(d.tier) : ''}</div>
  <div class="score">${proof_score(d)}</div>
  <div class="of">/ 100 · PROOF SCORE</div>
  <div class="meta">
    <div><b>${d.proofsPassed}</b>proofs passed</div>
    <div><b>${d.user ? d.user.reputation : '—'}</b>reputation</div>
    <div><b>${escapeHtml(d.date.split(',')[0])}</b>verified</div>
  </div>
  <div class="chal">Proved by completing: <b>${escapeHtml(d.proof.challengeTitle)}</b></div>
  <div class="foot"><div class="logo">PR<span>O</span>OF</div><div>Learn it. Prove it. Earn it.</div></div>
</div></body></html>`;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
});

function proof_score(d) { return Math.round(d.proof.score); }

route('GET', '/share/:file', async (ctx) => {
  const { params, res } = ctx;
  const publicId = String(params.file || '').replace(/\.svg$/i, '');
  const d = await proofData(publicId);
  if (!d) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); return; }
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="336" viewBox="0 0 600 336">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1F2348"/><stop offset=".55" stop-color="#2A2E66"/><stop offset="1" stop-color="#5F4B8B"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#F8DE7A"/><stop offset="1" stop-color="#EC991C"/>
    </linearGradient>
  </defs>
  <rect width="600" height="336" rx="28" fill="url(#bg)"/>
  <rect x="1" y="1" width="598" height="334" rx="27" fill="none" stroke="rgba(255,255,255,.18)"/>
  <text x="40" y="58" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="bold" letter-spacing="6">PRO<span fill="#E9B213">O</span>F</text>
  <text x="560" y="58" text-anchor="end" fill="#63D8C6" font-family="Arial" font-size="13" font-weight="bold">✓ VERIFIED SKILL</text>
  <text x="40" y="120" fill="#ffffff" font-family="Arial" font-size="30" font-weight="bold">${escapeHtml(d.avatar + ' ' + d.username)}</text>
  <text x="40" y="156" fill="#C0BBE3" font-family="Arial" font-size="20" font-weight="bold">${escapeHtml(d.skillName.toUpperCase())}${d.tier ? ' · ' + escapeHtml(d.tier.toUpperCase()) : ''}</text>
  <text x="40" y="238" fill="url(#gold)" font-family="Arial" font-size="64" font-weight="900">${proof_score(d)}%</text>
  <text x="40" y="266" fill="rgba(255,255,255,.6)" font-family="Arial" font-size="13">${d.proofsPassed} PROOFS PASSED · ⭐ REPUTATION ${d.user ? d.user.reputation : '—'}</text>
  <text x="40" y="308" fill="rgba(255,255,255,.55)" font-family="Arial" font-size="13" font-style="italic">“Don’t just say you can build. Prove it.”</text>
  <circle cx="520" cy="220" r="52" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="10"/>
  <circle cx="520" cy="220" r="52" fill="none" stroke="url(#gold)" stroke-width="10" stroke-linecap="round"
    stroke-dasharray="${(2 * Math.PI * 52 * proof_score(d) / 100).toFixed(1)} 400" transform="rotate(-90 520 220)"/>
  <text x="520" y="228" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="18" font-weight="bold">${proof_score(d)}/100</text>
</svg>`;
  res.writeHead(200, { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=3600' });
  res.end(svg);
});

/* ── ADMIN ANALYTICS ───────────────────────────────────────────────── */
// Admin authentication endpoint
route('POST', '/api/admin/authenticate', async (ctx) => {
  const { body, res } = ctx;
  const { password } = body || {};
  
  const adminSecret = process.env.ADMIN_SECRET || config.adminSecret;
  
  if (!adminSecret) {
    throw httpError(500, 'CONFIG_ERROR', 'Admin secret not configured');
  }
  
  if (password !== adminSecret) {
    throw httpError(403, 'INVALID_PASSWORD', 'Invalid admin password');
  }
  
  // Create admin session token with HMAC signature
  const sessionId = uid('adm');
  const createdAt = now();
  const expiry = createdAt + 86400000; // 24h expiry
  const payload = `${sessionId}:${createdAt}:${expiry}:admin`;
  const signature = hmac(payload, config.authSecret);
  const token = `${sessionId}.${signature.slice(0, 32)}`;
  
  // Store in sessions table temporarily
  await store.insert('admin_sessions', { id: sessionId, createdAt, expiresAt: expiry });
  await store.save();
  
  res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
  json(res, 200, { success: true });
});

route('GET', '/api/admin/payouts/pending', async (ctx) => {
  const { req, res } = ctx;
  if (!(await verifyAdminSession(req))) throw httpError(403, 'FORBIDDEN', 'Admin authentication required');
  const pending = await rewards.pendingPayouts();
  const usersById = new Map((await store.all('users')).map((user) => [user.id, user]));
  json(res, 200, {
    count: pending.length,
    totalNim: pending.reduce((total, reward) => total + toNim(reward.amountLuna), 0),
    payouts: pending.map((reward) => {
      const user = usersById.get(reward.userId);
      return {
        rewardId: reward.id,
        userId: reward.userId,
        username: user?.username || null,
        walletAddress: user?.walletAddress || null,
        amountNim: toNim(reward.amountLuna),
        challengeId: reward.challengeId,
        createdAt: reward.createdAt,
      };
    }),
  });
});

route('DELETE', '/api/admin/users/:id', async (ctx) => {
  const { params, req, res } = ctx;
  if (!(await verifyAdminSession(req))) throw httpError(403, 'FORBIDDEN', 'Admin authentication required');

  const target = await users.get(params.id);
  if (!target) throw httpError(404, 'NOT_FOUND', 'User not found');
  if (!target.isDemo && target.walletMode !== 'demo') {
    throw httpError(400, 'NOT_DEMO_WALLET', 'Only demo wallet accounts may be deleted from admin');
  }

  const removed = await users.deleteDemoUser(params.id);
  if (!removed) throw httpError(404, 'NOT_FOUND', 'User not found');

  json(res, 200, { ok: true, deletedUserId: params.id });
});

// Helper function to verify admin session
async function verifyAdminSession(req) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/admin_session=([^;]+)/);
  if (!match) return false;
  
  const token = match[1];
  if (!token || !token.includes('.')) return false;
  
  const [sessionId, providedSignature] = token.split('.');
  const session = await store.get('admin_sessions', sessionId);
  
  if (!session || session.expiresAt < now()) {
    if (session) {
      await store.remove('admin_sessions', sessionId);
      await store.save();
    }
    return false;
  }
  
  // Verify HMAC signature
  const payload = `${sessionId}:${session.createdAt}:${session.expiresAt}:admin`;
  const expectedSignature = hmac(payload, config.authSecret).slice(0, 32);
  
  return providedSignature === expectedSignature;
}

route('GET', '/api/admin/analytics', async (ctx) => {
  const { query, req, res } = ctx;
  
  // Admin authentication check
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) throw httpError(403, 'FORBIDDEN', 'Admin authentication required');
  
  const timeRange = query.get('range') || '24h'; // 24h, 7d, 30d, all
  const now = Date.now();
  const cutoff = timeRange === '24h' ? now - 86400000
               : timeRange === '7d' ? now - 604800000
               : timeRange === '30d' ? now - 2592000000
               : 0;

  // Get all users
  const allUsers = await store.all('users');
  const allAttempts = await store.all('attempts');
  const allTransactions = await store.all('wallet_txs');
  const walletAccounts = await users.listWalletAccounts();
  
  // Filter by time range
  const recentUsers = allUsers.filter(u => new Date(u.createdAt).getTime() > cutoff);
  const recentAttempts = allAttempts.filter(a => new Date(a.submittedAt || a.createdAt).getTime() > cutoff);
  const recentTxs = allTransactions.filter(t => new Date(t.createdAt).getTime() > cutoff);
  const usernames = new Map(allUsers.map((u) => [u.id, u.username]));
  
  // Calculate metrics
  const analytics = {
    // User Metrics
    users: {
      total: allUsers.length,
      new: recentUsers.length,
      demo: allUsers.filter(u => u.isDemo).length,
      real: allUsers.filter(u => !u.isDemo).length,
      active: recentAttempts.map(a => a.userId).filter((v, i, a) => a.indexOf(v) === i).length,
    },
    
    // Activity Metrics
    activity: {
      totalAttempts: recentAttempts.length,
      passedAttempts: recentAttempts.filter(a => a.status === 'passed').length,
      failedAttempts: recentAttempts.filter(a => a.status === 'failed').length,
      averageScore: recentAttempts.length > 0 ? Math.round(recentAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / recentAttempts.length) : 0,
    },
    
    // Economy Metrics
    economy: {
      totalDistributed: Math.round(recentTxs
        .filter(t => t.direction === 'credit' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amountLuna, 0) / 100000), // Convert to NIM
      totalCirculating: Math.round(allUsers.reduce((sum, u) => sum + u.balanceLuna, 0) / 100000),
      averageBalance: allUsers.length > 0 ? Math.round(allUsers.reduce((sum, u) => sum + u.balanceLuna, 0) / allUsers.length / 100000) : 0,
      rewardsToday: Math.round(recentTxs
        .filter(t => kindIncludesReward(t.kind) && t.direction === 'credit')
        .reduce((sum, t) => sum + (Number(t.amountLuna) || 0), 0) / 100000),
    },

    recentTransactions: recentTxs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map((transaction) => ({
        id: transaction.id,
        userId: transaction.userId,
        username: usernames.get(transaction.userId) || 'Unknown user',
        kind: transaction.kind,
        direction: transaction.direction,
        amountNim: toNim(transaction.amountLuna),
        status: transaction.status,
        note: transaction.note,
        ref: transaction.ref || null,
        createdAt: transaction.createdAt,
      })),
    
    // Top Users
    topUsers: allUsers
      .sort((a, b) => b.earnedLuna - a.earnedLuna)
      .slice(0, 10)
      .map(u => ({
        id: u.id,
        username: u.username,
        level: u.level,
        earned: Math.round(u.earnedLuna / 100000),
        proofs: u.proofsPassed,
      })),

    // Wallet account visibility map for the admin dashboard
    walletAccounts,
    
    // Abuse Detection
    suspicious: await detectSuspiciousActivity(store, cutoff),
  };
  
  json(res, 200, analytics);
});

// Helper function to detect suspicious patterns
async function detectSuspiciousActivity(store, cutoffTime) {
  const users = await store.all('users');
  const attempts = await store.all('attempts');
  const txs = await store.all('wallet_txs');
  
  const suspicious = [];
  
  for (const user of users) {
    const flags = [];
    const userAttempts = attempts.filter(a => a.userId === user.id);
    const userTxs = txs.filter(t => t.userId === user.id && new Date(t.createdAt).getTime() > cutoffTime);
    const rewardTxs = userTxs.filter(t => kindIncludesReward(t.kind));
    
    // Flag 1: Hitting daily cap consistently
    const daysAtCap = rewardTxs.filter(t => {
      const tDate = typeof t.createdAt === 'number' ? new Date(t.createdAt).toISOString().slice(0, 10) : t.createdAt.slice(0, 10);
      const dayRewards = rewardTxs
        .filter(r => {
          const rDate = typeof r.createdAt === 'number' ? new Date(r.createdAt).toISOString().slice(0, 10) : r.createdAt.slice(0, 10);
          return rDate === tDate;
        })
        .reduce((sum, r) => sum + r.amountLuna, 0);
      return dayRewards >= 1500000; // 15 NIM
    }).length;
    
    if (daysAtCap > 7) flags.push('hits_daily_cap_often');
    
    // Flag 2: High attempt rate
    const attemptsPerDay = userAttempts.length / 30;
    if (attemptsPerDay > 20) flags.push('high_attempt_rate');
    
    // Flag 3: Low score variance (bot-like behavior)
    const scores = userAttempts.filter(a => a.score).map(a => a.score);
    if (scores.length > 10) {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
      if (variance < 50) flags.push('low_score_variance');
    }
    
    // Flag 4: Earned too much too fast
    const earnedNim = user.earnedLuna / 100000;
    const userCreatedTime = typeof user.createdAt === 'number' ? user.createdAt : new Date(user.createdAt).getTime();
    const accountAgeHours = (Date.now() - userCreatedTime) / 3600000;
    if (accountAgeHours < 168 && earnedNim > 100) flags.push('rapid_earnings');
    
    if (flags.length >= 2) {
      suspicious.push({
        userId: user.id,
        username: user.username,
        flags,
        earned: Math.round(earnedNim),
        attempts: userAttempts.length,
        accountAge: Math.round(accountAgeHours / 24) + ' days',
      });
    }
  }
  
  return suspicious.sort((a, b) => b.flags.length - a.flags.length);
}

/* ── USER ACTIVITY LOGS ────────────────────────────────────────────────── */
route('GET', '/api/admin/users/:id/activity', async (ctx) => {
  const { params, req, res } = ctx;
  
  // Admin authentication check
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) throw httpError(403, 'FORBIDDEN', 'Admin authentication required');
  
  const targetUser = await store.get('users', params.id);
  if (!targetUser) throw httpError(404, 'NOT_FOUND', 'User not found');
  
  const [attempts, txs, skills, achievements] = await Promise.all([
    store.filter('attempts', a => a.userId === params.id),
    store.filter('wallet_txs', t => t.userId === params.id),
    store.filter('user_skills', s => s.userId === params.id),
    store.filter('user_achievements', a => a.userId === params.id),
  ]);
  
  json(res, 200, {
    user: {
      id: targetUser.id,
      username: targetUser.username,
      level: targetUser.level,
      xp: targetUser.xp,
      reputation: targetUser.reputation,
      balance: Math.round(targetUser.balanceLuna / 100000),
      earned: Math.round(targetUser.earnedLuna / 100000),
      proofsPassed: targetUser.proofsPassed,
      proofsAttempted: targetUser.proofsAttempted,
      streak: targetUser.streak,
      createdAt: targetUser.createdAt,
      isDemo: targetUser.isDemo,
    },
    activity: {
      attempts: attempts.length,
      passed: attempts.filter(a => a.status === 'passed').length,
      failed: attempts.filter(a => a.status === 'failed').length,
      averageScore: attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length) : 0,
    },
    economy: {
      totalTransactions: txs.length,
      rewardsReceived: txs.filter(t => kindIncludesReward(t.kind) && t.direction === 'credit').length,
      tips: {
        received: txs.filter(t => t.kind === 'tip' && t.direction === 'credit').length,
        sent: txs.filter(t => t.kind === 'tip' && t.direction === 'debit').length,
      },
    },
    skills: skills.map(s => ({
      skill: s.skillSlug,
      score: s.score,
      tier: s.tier,
      verified: s.verified,
    })),
    achievements: achievements.length,
    recentActivity: attempts
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 20)
      .map(a => ({
        challengeId: a.challengeId,
        status: a.status,
        score: a.score,
        rewarded: a.rewarded,
        timestamp: a.submittedAt,
      })),
  });
});

/* ── REAL-TIME METRICS ────────────────────────────────────────────────── */
route('GET', '/api/admin/metrics/realtime', async (ctx) => {
  const { req, res } = ctx;
  
  // Admin authentication check
  const isAdmin = await verifyAdminSession(req);
  if (!isAdmin) throw httpError(403, 'FORBIDDEN', 'Admin authentication required');
  
  const now = Date.now();
  const last24h = now - 86400000;
  const last1h = now - 3600000;
  
  const [attempts, txs] = await Promise.all([
    store.all('attempts'),
    store.all('wallet_txs'),
  ]);
  
  const recent24h = attempts.filter(a => new Date(a.submittedAt || a.createdAt).getTime() > last24h);
  const recent1h = attempts.filter(a => new Date(a.submittedAt || a.createdAt).getTime() > last1h);
  
  const txs24h = txs.filter(t => new Date(t.createdAt).getTime() > last24h);
  
  json(res, 200, {
    timestamp: new Date().toISOString(),
    last24Hours: {
      attempts: recent24h.length,
      passed: recent24h.filter(a => a.status === 'passed').length,
      activeUsers: [...new Set(recent24h.map(a => a.userId))].length,
      nimDistributed: Math.round(txs24h
        .filter(t => t.direction === 'credit' && kindIncludesReward(t.kind))
        .reduce((s, t) => s + (Number(t.amountLuna) || 0), 0) / 100000),
    },
    lastHour: {
      attempts: recent1h.length,
      passed: recent1h.filter(a => a.status === 'passed').length,
      activeUsers: [...new Set(recent1h.map(a => a.userId))].length,
    },
  });
});

/* ── static files ──────────────────────────────────────────────────── */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

function serveStatic(req, res, pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  const file = path.join(WEB_DIR, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(WEB_DIR)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(WEB_DIR, 'index.html'), (e2, index) => {
        if (e2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': config.env === 'production' ? 'public,max-age=300' : 'no-store, max-age=0' });
        res.end(index);
      });
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': config.env === 'production' ? 'public,max-age=300' : 'no-store, max-age=0' });
    res.end(data);
  });
}

/* ── server ────────────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const pathname = url.pathname;
  const origin = String(req.headers.origin || '');
  const allowlist = new Set(config.allowedOrigins || []);

  if (origin && allowlist.size > 0 && !allowlist.has(origin)) {
    res.writeHead(403, {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization',
      'vary': 'Origin',
    });
    res.end(JSON.stringify({ error: 'Origin not allowed.' }));
    return;
  }

  if (origin && allowlist.size > 0) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (pathname.startsWith('/api/') || pathname.startsWith('/p/') || pathname.startsWith('/share/')) {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const params = match(r.pattern, pathname);
        if (!params) continue;
        // Skip readBody for file upload routes (multer will handle the body)
        const isFileUpload = pathname === '/api/curriculum/from-document';
        const body = !isFileUpload && ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : null;
        const user = await auth.userFromRequest(req);
        if (!pathname.startsWith('/p/') && requiresUser(r.pattern, r.method) && !user)
          throw httpError(401, 'UNAUTHENTICATED', 'Connect a wallet first — it takes one tap.');
        await r.handler({ req, res, params, query: url.searchParams, body, user });
        return;
      }
      throw httpError(404, 'NO_ROUTE', 'Unknown API route.');
    }
    serveStatic(req, res, pathname);
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error('[error]', pathname, e);
    json(res, status, { error: { code: e.code || 'ERROR', message: e.message || 'Something went wrong.', retryInMs: e.retryInMs } });
  }
});

/**
 * Guard: does this route need a signed-in user?
 *
 * Everything not explicitly public touches the current user's private data or
 * mutates user-owned state, so anonymous callers must get a clean 401 instead
 * of a 500 from a null `user` (and must never read another context's data).
 */
function requiresUser(pattern, method = 'GET') {
  if (!pattern.startsWith('/api/')) return false;          // /p/… and /share/… are public pages
  if (pattern === '/api/wallet/demo' || pattern === '/api/wallet/demo/sign') return false; // demo sign-in itself is public
  if (pattern.startsWith('/api/auth/')) return false;      // nonce / verify / logout handshake
  if (pattern === '/api/onboard') return false;            // creates the guest demo user
  if (pattern === '/api/health') return false;
  if (pattern === '/api/tts') return false;
  if (pattern === '/api/me' && method === 'GET') return false; // guest-safe by design: { user: null }
  // Read-only public content:
  if (pattern.startsWith('/api/lesson/')) return false;    // lesson text (learning is public content)
  if (pattern.startsWith('/api/profile/')) return false;   // public profile pages
  if (pattern.startsWith('/api/leaderboard')) return false;
  if (pattern.startsWith('/api/share/')) return false;     // shared proof pages
  if (pattern === '/api/badges/definitions') return false; // static badge catalog
  return true; // user-scoped (incl. glossary, goals, reviews, stats…) or mutating → must be authenticated
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 1_500_000) { reject(httpError(413, 'TOO_LARGE', 'Request too large.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(httpError(400, 'BAD_JSON', 'Invalid JSON body.')); }
    });
    req.on('error', reject);
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  server.listen(config.port, '0.0.0.0', () => console.log(`[proof] listening on :${config.port}`));
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { store.save(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500); });
}
