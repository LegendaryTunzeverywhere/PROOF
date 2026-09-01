/**
 * PROOF — server entry. Zero-dependency Node HTTP server.
 * Serves: JSON API (/api/*) · static SPA (web/) · public proof pages (/p/:id)
 *         · share cards (/share/:id.svg)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, validateConfig } from './config.js';
import { Store } from './store.js';
import { SupabaseStore, createStore } from './supabase-store.js';
import { seed } from './seed.js';
import { AuthService, sessionCookie, CLEAR_COOKIE } from './auth.js';
import { UserService } from './services/users.js';
import { SkillService } from './services/skills.js';
import { RewardService } from './services/rewards.js';
import { NotificationService } from './services/notifications.js';
import { ChallengeService } from './services/challenges.js';
import { MarketplaceService } from './services/marketplace.js';
import { TeachingService } from './services/teaching.js';
import { generateLearningPath, generateLesson, recommendNextSkill, tutorReply, detectDomain } from './ai/service.js';
import { uid, now, toNim, escapeHtml, RateLimiter, looksLikeNimiqAddress, nimiqAddressFromPublicKey, validate, parseNumber } from './util.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, '../web');

/* ── boot ──────────────────────────────────────────────────────────── */
// Use createStore() to automatically choose between Store and SupabaseStore
// based on DB_MODE environment variable
const store = await createStore();
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
const market = new MarketplaceService(store, config, { users, skills, rewards, notifications });
const teaching = new TeachingService(store, config, { users, skills, rewards, notifications });

skills.seedCatalog();
await seedRelations({ users, skills, market, teaching });
console.log(`[proof] ready · engine=${config.ai.apiKey ? 'llm+engine' : 'engine'} · network=${config.nimiq.rpcUrl ? 'nimiq-rpc' : 'demo-ledger'}`);

async function seedRelations({ users, skills, market, teaching }) {
  if (store.count('marketplace_tasks') > 0) return;
  market.seedTask({ title: 'Build a landing page', description: 'Need a one-page site for my sneaker resale shop. Responsive, clean, with a waitlist form. Reference vibes: minimal, bold type.', budgetNim: 50, skillSlug: 'web-development', minScore: 70, clientName: 'KickLayer', clientAvatar: '👟', postedAgoMin: 42, tags: ['html', 'css', 'js'] });
  market.seedTask({ title: 'Create a social media campaign', description: 'Two-week launch campaign for a new stout brand. Need: message, channel plan, 6 post concepts with hooks.', budgetNim: 30, skillSlug: 'marketing', minScore: 65, clientName: 'Zoo Road Brews', clientAvatar: '🍺', postedAgoMin: 90, tags: ['campaign', 'content'] });
  market.seedTask({ title: 'Design mobile UI screens', description: '3 screens for a savings app onboarding. Design system provided. Figma or precise spec.', budgetNim: 75, skillSlug: 'ui-design', minScore: 80, clientName: 'SaveNest', clientAvatar: '🐦', postedAgoMin: 140, tags: ['mobile', 'figma'] });
  market.seedTask({ title: 'Analyze shop sales data', description: 'Small CSV (90 rows). Need: 3 trends, 1 anomaly, recommendation. Clear write-up.', budgetNim: 40, skillSlug: 'data-analysis', minScore: 65, clientName: 'Mama Nkechi Foods', clientAvatar: '🍲', postedAgoMin: 200, tags: ['analysis'] });
  market.seedTask({ title: 'Write a product launch article', description: '400-word launch piece for our delivery app rebrand. Punchy, concrete, one CTA.', budgetNim: 20, skillSlug: 'writing', minScore: 60, clientName: 'SwiftDrop', clientAvatar: '🚀', postedAgoMin: 320, tags: ['copy'] });
  market.seedTask({ title: 'Automate my invoice emails', description: 'AI workflow that drafts + schedules supplier invoice reminders. Specs and samples provided.', budgetNim: 45, skillSlug: 'ai', minScore: 70, clientName: 'Hajar Textiles', clientAvatar: '🧵', postedAgoMin: 400, tags: ['automation'] });
  market.seedTask({ title: 'French conversation practice partner', description: '2× 20-min conversational sessions for a trip to Lyon. Friendly + patient.', budgetNim: 15, skillSlug: 'languages', minScore: 60, clientName: 'Tobi', clientAvatar: '🌍', postedAgoMin: 500, tags: ['french'] });
  market.seedTask({ title: 'Fix my site’s mobile layout', description: 'Menu overlaps content on iPhone. Need it responsive 320px+ without a rebuild.', budgetNim: 25, skillSlug: 'web-development', minScore: 60, clientName: 'Bara Studio', clientAvatar: '🛠️', postedAgoMin: 610, tags: ['css'] });
  store.save();
}

/* ── tiny routing framework ────────────────────────────────────────── */
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, pattern, handler });

function json(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(body);
}
const httpError = (status, code, message, extra = {}) => Object.assign(new Error(message), { status, code, ...extra });

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
route('POST', '/api/onboard', (ctx) => {
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
  const user = users.createUser({ isDemo: true });
  users.update(user, { prefs: { goal: body.goal || '', level: body.level || '', minutesPerDay: body.minutesPerDay || 30, style: 'practical', interests: Array.isArray(body.interests) ? body.interests.slice(0, 6) : [] } });
  const token = auth.createSession(user.id);
  json(res, 201, { user: publicMe(user), recommended: recommendNextSkill([]) }, { 'set-cookie': sessionCookie(token) });
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
  const { body, req, res } = ctx;
  
  console.log('[verify] Request received:', {
    mode: body?.mode,
    hasNonce: !!body?.nonce,
    hasPublicKey: !!body?.publicKey,
    hasSignature: !!body?.signature,
    hasAddress: !!body?.address,
  });
  
  const mode = body?.mode === 'nimiqpay' ? 'nimiqpay' : body?.mode === 'hub' ? 'hub' : 'demo';
  const nonceRow = await auth.consumeNonce(String(body?.nonce || ''));
  
  console.log('[verify] Nonce lookup result:', nonceRow ? 'found' : 'NOT FOUND');
  
  if (!nonceRow) {
    console.log('[verify] BAD_NONCE - nonce:', body?.nonce);
    throw httpError(400, 'BAD_NONCE', 'This sign-in request expired. Try again.');
  }
  
  // For Hub mode, trust the address from Hub since it handles contract addresses
  // For nimiqpay, validate that address matches the public key (basic account only)
  if (mode === 'nimiqpay') {
    const derivedAddress = nimiqAddressFromPublicKey(String(body?.publicKey || ''));
    const providedAddress = String(body.address).replace(/\s+/g, ' ').trim();
    const normalizedDerived = derivedAddress ? derivedAddress.replace(/\s+/g, ' ').trim() : null;
    
    if (!looksLikeNimiqAddress(body.address) || !derivedAddress || normalizedDerived !== providedAddress) {
      throw httpError(401, 'ADDRESS_MISMATCH', 'Wallet address does not match the public key.');
    }
  } else if (mode === 'hub') {
    // Hub mode: just validate address format, signature verification is sufficient
    if (!looksLikeNimiqAddress(body.address)) {
      throw httpError(401, 'INVALID_ADDRESS', 'Invalid Nimiq address format.');
    }
  }
  
  const ok = auth.verifySignature({ mode, publicKey: body.publicKey, signature: body.signature, message: nonceRow.message });
  
  if (!ok) throw httpError(401, 'BAD_SIGNATURE', 'Signature verification failed — wallet ownership not proven.');

  let user = null;
  const isNimiqMode = mode === 'nimiqpay' || mode === 'hub';
  if (isNimiqMode && looksLikeNimiqAddress(body.address)) {
    user = await users.findByWallet(body.address);
    if (!user) user = await users.createUser({ walletAddress: body.address, walletMode: mode });
    else await users.update(user, { walletAddress: body.address, walletMode: mode, publicKey: body.publicKey });
  } else {
    user = await users.findByPublicKey(body.publicKey);
    if (!user) user = await users.createUser({ walletMode: 'demo' });
    await users.update(user, { publicKey: body.publicKey, walletMode: 'demo' });
  }
  
  console.log('[verify] User created/found:', { id: user.id, username: user.username });
  
  const token = await auth.createSession(user.id);
  
  console.log('[verify] Session created:', { token: token.slice(0, 20) + '...', userId: user.id });
  console.log('[verify] Setting cookie...');
  
  json(res, 200, { user: publicMe(user), demo: mode === 'demo' }, { 'set-cookie': sessionCookie(token) });
  
  console.log('[verify] Response sent with session cookie');
});

route('POST', '/api/wallet/demo', (ctx) => {
  const { req, res } = ctx;
  // Rate limit: prevent demo wallet spam
  if (limiter.allow('demo-wallet:' + req.socket.remoteAddress, 10, 60_000) !== true)
    throw httpError(429, 'RATE_LIMITED', 'Too many demo wallet requests. Wait a minute.');
  
  json(res, 200, { ...auth.createDemoWallet(), mode: 'demo',
    notice: 'Demo wallet: keys live only in this sandbox session for the demo experience. In Nimiq Pay, keys never leave your wallet.' });
});

route('POST', '/api/wallet/demo/sign', (ctx) => {
  const { body, res } = ctx;
  const sig = auth.signDemoMessage(String(body?.privateKey || ''), String(body?.message || ''));
  json(res, 200, { signature: sig });
});

route('POST', '/api/auth/logout', (ctx) => {
  const { req, res } = ctx;
  const m = (req.headers.cookie || '').match(/proof_session=([^;]+)/);
  if (m) auth.destroySession(decodeURIComponent(m[1]));
  json(res, 200, { ok: true }, { 'set-cookie': CLEAR_COOKIE });
});

function publicMe(user) {
  const streak = users.touchStreak(user.id);
  return {
    id: user.id, username: user.username, avatar: user.avatar,
    level: user.level, xp: user.xp, reputation: user.reputation,
    balanceNim: toNim(user.balanceLuna), earnedNim: toNim(user.earnedLuna),
    wallet: { mode: user.walletMode, address: user.walletAddress, connected: !!user.walletMode },
    streak, prefs: user.prefs,
    proofsPassed: user.proofsPassed || 0,
    walletModeIsDemo: user.walletMode === 'demo',
  };
}

route('GET', '/api/me', (ctx) => {
  const { user, res } = ctx;
  console.log('[/api/me] Request - user:', user ? `${user.username} (${user.id})` : 'null');
  console.log('[/api/me] Cookie header:', ctx.req.headers.cookie ? 'present' : 'missing');
  if (!user) {
    // Public view for anonymous visitors — avoid noisy 401s on first load.
    return json(res, 200, { user: null, skills: [], unread: 0, opportunities: 0 });
  }
  const mySkills = skills.userSkills(user.id).map((s) => ({ ...s, tier: skills.tierFor(s.score) }));
  json(res, 200, {
    user: publicMe(user),
    skills: mySkills,
    unread: notifications.unreadCount(user.id),
    opportunities: challenges.qualificationSnapshot(user.id).opportunities,
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
  if (body.prefs) {
    const p = { ...user.prefs, ...body.prefs };
    p.goal = String(p.goal || '').slice(0, 240);
    p.level = String(p.level || '').slice(0, 20);
    patch.prefs = p;
  }
  await users.update(user, patch);
  const updated = await users.get(user.id);
  json(res, 200, { user: publicMe(updated) });
});

/* ── HOME ──────────────────────────────────────────────────────────── */
route('GET', '/api/home', (ctx) => {
  const { user, res } = ctx;
  const myPaths = store.filter('paths', (p) => p.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const active = myPaths.find((p) => pathProgress(p) < 100) || null;
  const daily = challenges.todayDaily();
  const dailyDone = store.find('attempts', (a) => a.userId === user.id && a.challengeId === daily.id && a.submittedAt);
  const mySkills = skills.userSkills(user.id);
  const tasks = market.listTasks(user.id, { onlyQualified: true }).slice(0, 3);
  json(res, 200, {
    user: publicMe(user),
    continueLearning: active ? pathView(active, user.id) : null,
    mySkills: mySkills.map((s) => ({ skillSlug: s.skillSlug, score: s.score, verified: s.verified })),
    daily: { ...dailyView(daily), done: !!dailyDone, passed: dailyDone?.status === 'passed' },
    trending: [...skills.catalog()].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 6)
      .map((s) => ({ ...s, learners: 120 + (s.popularity || 0) * 37 })),
    sponsored: store.all('sponsored_challenges').sort((a, b) => b.poolLuna - a.poolLuna).slice(0, 3)
      .map((s) => sponsoredView(s, user.id)),
    recommendedTasks: tasks,
    recommendedSkills: recommendNextSkill(mySkills.map((s) => s.skillSlug)),
    discovery: discoveryFeed(user.id),
  });
});

function discoveryFeed(userId) {
  const topProofers = users.leaderboard('proofs', 3);
  const newTasks = market.listTasks(userId).slice(0, 2);
  const teachers = teaching.list().slice(0, 2);
  return { topProofers, newTasks, teachers };
}

/* ── PATHS ─────────────────────────────────────────────────────────── */
route('POST', '/api/paths', async (ctx) => {
  const { user, body, req, res } = ctx;
  // Rate limit: path generation is AI-expensive
  if (limiter.allow('paths:' + user.id, 5, 300_000) !== true)
    throw httpError(429, 'RATE_LIMITED', 'Path generation limit reached. Wait 5 minutes before creating another path.');
  
  const errs = validate(body, { type: 'object', required: ['goal'], props: { goal: { type: 'string', min: 3, max: 240 } } });
  if (errs.length) throw httpError(400, 'BAD_INPUT', 'Tell us what you want to learn (at least 3 characters).');
  const gen = await generateLearningPath({
    goal: body.goal,
    domain: body.domain,
    level: body.level || user.prefs?.level,
    minutesPerDay: body.minutesPerDay || user.prefs?.minutesPerDay || 30,
    style: body.style || 'practical',
  });
  // persist path + create its proof challenges
  const pathRow = store.insert('paths', {
    id: uid('path'), userId: user.id,
    goal: gen.goal, skillSlug: gen.skillSlug, skillName: gen.skillName, skillEmoji: gen.skillEmoji,
    title: gen.title, description: gen.description,
    level: gen.level, minutesPerDay: gen.minutesPerDay,
    days: gen.days, totalXp: gen.totalXp, rewardNim: gen.rewardNim,
    engine: gen.engine, progress: {}, createdAt: now(),
  });
  for (const day of pathRow.days) {
    for (const item of day.items) {
      if (item.challengeTemplate) {
        const ch = challenges.createFromTemplate({
          skillSlug: gen.skillSlug,
          template: item.challengeTemplate,
          pathId: pathRow.id, dayIndex: day.index,
        });
        item.challengeId = ch.id;
        delete item.challengeTemplate;
      }
    }
  }
  store.update('paths', pathRow.id, { days: pathRow.days });
  store.save();
  json(res, 201, { path: pathView(pathRow, user.id), generatedBy: gen.engine });
});

route('GET', '/api/paths', (ctx) => {
  const { user, res } = ctx;
  const mine = store.filter('paths', (p) => p.userId === user.id).sort((a, b) => b.createdAt - a.createdAt)
    .map((p) => pathView(p, user.id));
  json(res, 200, { paths: mine });
});

route('GET', '/api/paths/:id', (ctx) => {
  const { user, params, res } = ctx;
  const p = store.get('paths', params.id);
  if (!p || p.userId !== user.id) throw httpError(404, 'NOT_FOUND', 'Path not found.');
  json(res, 200, { path: pathView(p, user.id) });
});

route('POST', '/api/paths/:id/progress', async (ctx) => {
  const { user, params, body, res } = ctx;
  const p = store.get('paths', params.id);
  if (!p || p.userId !== user.id) throw httpError(404, 'NOT_FOUND', 'Path not found.');
  const key = `${body.dayIndex}:${body.topicSlug}:${body.part}`;
  const firstTime = !p.progress[key];
  if (firstTime) {
    p.progress[key] = now();
    store.update('paths', p.id, { progress: p.progress });
    if (body.part === 'lesson') {
      users.addXp(user.id, 20, 'Lesson complete');
      await userStats.incrementLessons(user.id);
      await learningGoals.updateGoalProgress(user.id, 'weekly_lessons', 1);
      masteryBadges.checkSpecialBadges(user.id);
    }
    if (body.part === 'practice') {
      users.addXp(user.id, 10, 'Practice complete');
      await userStats.incrementPractices(user.id);
      await learningGoals.updateGoalProgress(user.id, 'weekly_practices', 1);
    }
    // Check for new badges
    const awarded = masteryBadges.checkAndAwardBadges(user.id);
    store.save();
    
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
  json(res, 200, { progress: p.progress, percent: pathProgress(p), xpAwarded: firstTime ? (body.part === 'lesson' ? 20 : 10) : 0 });
});

function pathProgress(p) {
  const items = p.days.flatMap((d) => d.items);
  const total = items.length;
  if (!total) return 0;
  
  // Count items with any progress: check progress keys by topic
  const keys = new Set(Object.keys(p.progress).map((k) => k.split(':')[1]));
  const doneItems = items.filter((i) => 
    keys.has(i.topic) || 
    (i.challengeId && store.get('challenges', i.challengeId) && 
     store.find('attempts', (a) => a.challengeId === i.challengeId && a.userId === p.userId && a.submittedAt))
  );
  return Math.round((doneItems.length / total) * 100);
}

function pathView(p, userId) {
  const days = p.days.map((d) => ({
    ...d,
    items: d.items.map((i) => ({
      ...i,
      lessonDone: !!p.progress[`${d.index}:${i.topic}:lesson`],
      practiceDone: !!p.progress[`${d.index}:${i.topic}:practice`],
      attempt: i.challengeId ? (store.find('attempts', (a) => a.challengeId === i.challengeId && a.userId === userId && a.submittedAt) || null) : null,
    })),
  }));
  return {
    id: p.id, title: p.title, description: p.description, goal: p.goal,
    skillSlug: p.skillSlug, skillName: p.skillName, skillEmoji: p.skillEmoji,
    level: p.level, minutesPerDay: p.minutesPerDay, engine: p.engine,
    totalXp: p.totalXp, rewardNim: p.rewardNim,
    days, percent: pathProgress(p), createdAt: p.createdAt,
  };
}

/* ── LESSON CONTENT ────────────────────────────────────────────────── */
route('GET', '/api/lesson/:skill/:topic', async (ctx) => {
  const { params, res } = ctx;
  try {
    const lesson = await generateLesson(params.skill, params.topic);
    json(res, 200, lesson);
  } catch (e) {
    throw httpError(404, 'TOPIC_NOT_FOUND', 'Lesson not found for this topic.');
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
  const out = await tutorReply({
    domain: body.skillSlug || 'web-development',
    topicSlug: body.topicSlug || '',
    question: body.question,
    history: Array.isArray(body.history) ? body.history.slice(-8) : [],
  });
  json(res, 200, out);
});

/* ── CHALLENGES / PROOFS ───────────────────────────────────────────── */
route('GET', '/api/challenges/:id', (ctx) => {
  const { user, params, res } = ctx;
  const ch = challenges.get(params.id);
  if (!ch) throw httpError(404, 'NOT_FOUND', 'Challenge not found.');
  const open = store.find('attempts', (a) => a.userId === user.id && a.challengeId === ch.id && a.status === 'in_progress');
  json(res, 200, { challenge: challengeView(ch), openAttemptId: open?.id || null });
});

route('GET', '/api/daily', (ctx) => {
  const { user, res } = ctx;
  const daily = challenges.todayDaily();
  const done = store.find('attempts', (a) => a.userId === user.id && a.challengeId === daily.id && a.submittedAt);
  json(res, 200, { challenge: { ...challengeView(daily), kind: 'daily' }, done: !!done, passed: done?.status === 'passed', attemptId: done?.id || null });
});

route('POST', '/api/challenges/:id/start', (ctx) => {
  const { user, params, res } = ctx;
  const { attempt, resumed } = challenges.startAttempt(user.id, params.id);
  json(res, resumed ? 200 : 201, { attemptId: attempt.id, resumed });
});

route('POST', '/api/attempts/:id/submit', async (ctx) => {
  const { user, params, body, res } = ctx;
  const result = await challenges.submitAttempt(user.id, params.id, body);
  json(res, 200, result);
});

route('GET', '/api/attempts/:id', (ctx) => {
  const { user, params, res } = ctx;
  json(res, 200, challenges.attemptResult(user.id, params.id));
});

route('GET', '/api/me/attempts', (ctx) => {
  const { user, res } = ctx;
  json(res, 200, { attempts: challenges.userAttempts(user.id) });
});

route('GET', '/api/me/proofs', (ctx) => {
  const { user, query, res } = ctx;
  let proofs = store.filter('skill_proofs', (p) => p.userId === user.id);
  if (query.get('skill')) proofs = proofs.filter((p) => p.skillSlug === query.get('skill'));
  proofs.sort((a, b) => b.completedAt - a.completedAt);
  json(res, 200, { proofs });
});

function challengeView(ch) {
  return {
    id: ch.id, skillSlug: ch.skillSlug, kind: ch.kind, type: ch.type,
    title: ch.title, brief: ch.brief, requirements: ch.requirements,
    timeMin: ch.timeMin, passScore: ch.passScore, rewardNim: ch.rewardNim, xp: ch.xp,
    submissionFields: ch.type === 'html' ? ['code']
      : ch.type === 'js-static' ? ['code', 'explanation'] : ['text'],
  };
}

function dailyView(ch) {
  const v = challengeView(ch);
  return { ...v, kind: 'daily' };
}

/* ── WALLET / ECONOMY ──────────────────────────────────────────────── */
route('GET', '/api/wallet', (ctx) => {
  const { user, res } = ctx;
  json(res, 200, {
    mode: user.walletMode || 'disconnected',
    network: config.nimiq.rpcUrl ? 'nimiq-mainnet' : 'demo-ledger',
    address: user.walletAddress,
    balanceNim: toNim(user.balanceLuna),
    earnedNim: toNim(user.earnedLuna),
    txs: rewards.txHistory(user.id).map((t) => ({ ...t, amountNim: toNim(t.amountLuna) })),
  });
});

route('POST', '/api/wallet/payout', (ctx) => {
  const { user, body, res } = ctx;
  const amountNim = parseNumber(body?.amountNim, { min: 0, max: 1_000_000 });
  const tx = rewards.requestPayout(user.id, amountNim);
  json(res, 201, { tx: { ...tx, amountNim: toNim(tx.amountLuna) } });
});

route('POST', '/api/tips', (ctx) => {
  const { user, body, res } = ctx;
  const to = users.get(String(body?.toUserId || ''));
  if (!to) throw httpError(404, 'NOT_FOUND', 'User not found.');
  const amountNim = parseNumber(body?.amountNim, { min: 0.01, max: 10_000 });
  const tx = rewards.tip(user.id, to.id, amountNim, String(body?.note || '').slice(0, 140));
  notifications.push(to.id, { type: 'tip', emoji: '💸', title: `${user.username} tipped you ${amountNim} NIM`, body: String(body?.note || ''), href: '#/profile' });
  json(res, 201, { ok: true, tx: { ...tx, amountNim: toNim(tx.amountLuna) } });
});

route('GET', '/api/rewards', (ctx) => {
  const { user, res } = ctx;
  json(res, 200, {
    rewards: store.filter('rewards', (r) => r.userId === user.id).sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({ ...r, amountNim: toNim(r.amountLuna) })),
    today: rewards.dailyRewardTotals(user.id),
  });
});

/* ── MARKETPLACE ───────────────────────────────────────────────────── */
route('GET', '/api/market/tasks', (ctx) => {
  const { user, query, res } = ctx;
  json(res, 200, { tasks: market.listTasks(user.id, { onlyQualified: query.get('qualified') === '1' }) });
});
route('GET', '/api/market/tasks/:id', (ctx) => {
  const { user, params, res } = ctx;
  const t = market.get(params.id, user.id);
  if (!t) throw httpError(404, 'NOT_FOUND', 'Task not found.');
  json(res, 200, { task: t });
});
route('POST', '/api/market/tasks/:id/apply', (ctx) => {
  const { user, params, body, res } = ctx;
  json(res, 201, { application: market.apply(params.id, user, body?.pitch) });
});
route('POST', '/api/market/tasks/:id/complete', (ctx) => {
  const { user, params, res } = ctx;
  json(res, 200, market.completeTask(params.id, user));
});
route('POST', '/api/market/tasks', (ctx) => {
  const { user, body, res } = ctx;
  json(res, 201, { task: market.postTask(user, body || {}) });
});
route('GET', '/api/market/my', (ctx) => {
  const { user, res } = ctx;
  json(res, 200, market.myTasks(user.id));
});

/* ── TEACHING ──────────────────────────────────────────────────────── */
route('GET', '/api/teach/sessions', (ctx) => {
  const { user, query, res } = ctx;
  json(res, 200, { sessions: teaching.list({ skillSlug: query.get('skill') || null }) });
});
route('POST', '/api/teach/sessions', (ctx) => {
  const { user, body, res } = ctx;
  json(res, 201, { session: teaching.view(teaching.createSession(user, body || {})) });
});
route('GET', '/api/teach/mine', (ctx) => {
  const { user, res } = ctx;
  json(res, 200, { sessions: teaching.mine(user.id) });
});
route('POST', '/api/teach/sessions/:id/book', (ctx) => {
  const { user, params, res } = ctx;
  json(res, 201, { session: teaching.book(params.id, user) });
});
route('POST', '/api/teach/sessions/:id/review', (ctx) => {
  const { user, params, body, res } = ctx;
  json(res, 201, { session: teaching.review(params.id, user, body || {}) });
});

/* ── EXTRAS ────────────────────────────────────────────────────────── */
route('GET', '/api/leaderboard', (ctx) => {
  const { query, res } = ctx;
  const cat = ['proofs', 'score', 'helpful', 'teacher', 'consistent', 'tasks', 'earned'].includes(query.get('cat')) ? query.get('cat') : 'proofs';
  json(res, 200, { category: cat, entries: users.leaderboard(cat, 12) });
});

route('GET', '/api/achievements', (ctx) => {
  const { user, res } = ctx;
  const unlocked = store.filter('achievements', (a) => a.userId === user.id).map((a) => a.achievementId);
  json(res, 200, {
    achievements: users.ACHIEVEMENTS.map((a) => ({ ...a, unlocked: unlocked.includes(a.id) })),
  });
});

route('GET', '/api/notifications', (ctx) => {
  const { user, res } = ctx;
  json(res, 200, { notifications: notifications.list(user.id), unread: notifications.unreadCount(user.id) });
});
route('POST', '/api/notifications/read', (ctx) => {
  const { user, res } = ctx;
  notifications.markAllRead(user.id);
  json(res, 200, { ok: true });
});

route('GET', '/api/sponsored', (ctx) => {
  const { user, res } = ctx;
  json(res, 200, { sponsored: store.all('sponsored_challenges').map((s) => sponsoredView(s, user.id)) });
});

route('POST', '/api/sponsored/:id/join', (ctx) => {
  const { user, params, res } = ctx;
  const s = store.get('sponsored_challenges', params.id);
  if (!s) throw httpError(404, 'NOT_FOUND', 'Challenge not found.');
  const key = `${user.id}:${s.id}`;
  if (store.find('sponsored_participants', (p) => p.key === key))
    throw httpError(409, 'ALREADY_JOINED', 'You already joined this challenge.');
  store.insert('sponsored_participants', { id: uid('sp'), key, userId: user.id, sponsoredId: s.id, joinedAt: now() });
  store.update('sponsored_challenges', s.id, { participants: s.participants + 1 });
  notifications.push(user.id, { type: 'sponsored', emoji: '🏆', title: `You're in: ${s.title}`, body: `${toNim(s.poolLuna)} NIM pool — pass the final proof to qualify.`, href: '#/prove' });
  store.save();
  json(res, 201, { sponsored: sponsoredView(store.get('sponsored_challenges', s.id), user.id) });
});

function sponsoredView(s, userId) {
  return {
    id: s.id, title: s.title, description: s.description, skillSlug: s.skillSlug,
    emoji: s.emoji, sponsor: s.sponsor,
    poolNim: toNim(s.poolLuna), topNim: toNim(s.topLuna), qualifiedNim: toNim(s.qualifiedLuna),
    participants: s.participants, endsInDays: s.endsInDays,
    joined: !!store.find('sponsored_participants', (p) => p.userId === userId && p.sponsoredId === s.id),
  };
}

route('GET', '/api/skills/:slug', (ctx) => {
  const { user, params, res } = ctx;
  const skill = skills.bySlug(params.slug);
  if (!skill) throw httpError(404, 'NOT_FOUND', 'Skill not found.');
  const us = skills.userSkill(user.id, params.slug);
  const sessions = teaching.list({ skillSlug: params.slug }).slice(0, 3);
  const tasks = market.listTasks(user.id).filter((t) => t.minProof?.skillSlug === params.slug).slice(0, 3);
  json(res, 200, {
    skill, my: us ? { score: us.score, tier: skills.tierFor(us.score), verified: us.verified, proofs: us.proofs } : null,
    teachers: sessions, tasks,
    learners: 90 + (skill.popularity || 0) * 29,
  });
});

route('GET', '/api/profile/:username', (ctx) => {
  const { params, res } = ctx;
  const u = users.findByUsername(params.username);
  if (!u) throw httpError(404, 'NOT_FOUND', 'Proofer not found.');
  const profile = users.publicProfile(u.id);
  profile.isDemoUser = !!u.isClient;
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
  const awarded = masteryBadges.checkAndAwardBadges(user.id);
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
  const badges = masteryBadges.getUserBadges(user.id);
  const progress = masteryBadges.getBadgeProgress(user.id);
  const next = masteryBadges.getNextBadges(user.id, 5);
  json(res, 200, { badges, progress, next });
});

route('GET', '/api/badges/definitions', async (ctx) => {
  const { res } = ctx;
  const definitions = masteryBadges.getBadgeDefinitions();
  json(res, 200, { definitions });
});

route('POST', '/api/badges/check', async (ctx) => {
  const { user, res } = ctx;
  const awarded = masteryBadges.checkAndAwardBadges(user.id);
  const specialBadges = masteryBadges.checkSpecialBadges(user.id);
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
  
  const session = await socraticTutor.startGrillingSession(user.id, body);
  json(res, 201, { session });
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

/* ── PUBLIC PAGES: proof page + share card ────────────────────────── */
function proofData(publicId) {
  const proof = skills.proofByPublicId(publicId);
  if (!proof) return null;
  const user = users.get(proof.userId);
  const skill = skills.bySlug(proof.skillSlug);
  const us = skills.userSkill(proof.userId, proof.skillSlug);
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

route('GET', '/p/:publicId', (ctx) => {
  const { params, res } = ctx;
  const d = proofData(params.publicId);
  if (!d) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Proof not found'); return; }
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(d.username)} proved ${escapeHtml(d.skillName)} · PROOF</title>
<meta property="og:title" content="${escapeHtml(d.username)} — verified ${escapeHtml(d.skillName)}">
<meta property="og:description" content="Score ${proof_score(d)}/100 · verified on PROOF. Don't just say you can build. Prove it.">
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(160deg,#141639,#3d2f8f 55%,#8f5bd6);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;padding:24px}
  .card{width:100%;max-width:420px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:28px;padding:34px 30px;backdrop-filter:blur(12px);box-shadow:0 30px 80px rgba(0,0,0,.45);text-align:center}
  .badge{display:inline-flex;align-items:center;gap:8px;background:#12b76a;color:#04150c;font-weight:800;font-size:12px;letter-spacing:.14em;padding:7px 14px;border-radius:999px}
  h1{font-size:30px;margin:18px 0 2px;letter-spacing:-.02em}
  .skill{color:#c9c4ff;font-weight:700;font-size:17px}
  .score{font-size:64px;font-weight:900;margin:16px 0 2px;background:linear-gradient(90deg,#ffd28a,#ff9d43);-webkit-background-clip:text;background-clip:text;color:transparent}
  .of{color:rgba(255,255,255,.55);font-size:13px;letter-spacing:.2em;font-weight:700}
  .meta{display:flex;justify-content:center;gap:22px;margin-top:22px;color:rgba(255,255,255,.75);font-size:13px}
  .meta b{display:block;color:#fff;font-size:16px}
  .chal{margin-top:18px;padding:14px 16px;background:rgba(255,255,255,.06);border-radius:14px;font-size:13px;color:rgba(255,255,255,.8)}
  .foot{margin-top:26px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.5)}
  .logo{font-weight:900;letter-spacing:.22em;font-size:13px}
  .logo span{color:#ffb15e}
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

route('GET', '/share/:file', (ctx) => {
  const { params, res } = ctx;
  const publicId = String(params.file || '').replace(/\.svg$/i, '');
  const d = proofData(publicId);
  if (!d) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); return; }
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="336" viewBox="0 0 600 336">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#15173b"/><stop offset=".55" stop-color="#3d2f8f"/><stop offset="1" stop-color="#8f5bd6"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffd28a"/><stop offset="1" stop-color="#ff9d43"/>
    </linearGradient>
  </defs>
  <rect width="600" height="336" rx="28" fill="url(#bg)"/>
  <rect x="1" y="1" width="598" height="334" rx="27" fill="none" stroke="rgba(255,255,255,.18)"/>
  <text x="40" y="58" fill="#ffffff" font-family="Arial,Helvetica,sans-serif" font-size="15" font-weight="bold" letter-spacing="6">PRO<span fill="#ffb15e">O</span>F</text>
  <text x="560" y="58" text-anchor="end" fill="#7ef0b0" font-family="Arial" font-size="13" font-weight="bold">✓ VERIFIED SKILL</text>
  <text x="40" y="120" fill="#ffffff" font-family="Arial" font-size="30" font-weight="bold">${escapeHtml(d.avatar + ' ' + d.username)}</text>
  <text x="40" y="156" fill="#c9c4ff" font-family="Arial" font-size="20" font-weight="bold">${escapeHtml(d.skillName.toUpperCase())}${d.tier ? ' · ' + escapeHtml(d.tier.toUpperCase()) : ''}</text>
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
        res.writeHead(200, { 'content-type': MIME['.html'] });
        res.end(index);
      });
      return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': config.env === 'production' ? 'public,max-age=300' : 'no-cache' });
    res.end(data);
  });
}

/* ── server ────────────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const pathname = url.pathname;
  try {
    if (pathname.startsWith('/api/') || pathname.startsWith('/p/') || pathname.startsWith('/share/')) {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const params = match(r.pattern, pathname);
        if (!params) continue;
        const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readBody(req) : null;
        const user = await auth.userFromRequest(req);
        if (!pathname.startsWith('/p/') && requiresUser(r.pattern) && !user)
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

const USER_ROUTES = new Set(['/api/home', '/api/paths', '/api/wallet', '/api/rewards', '/api/achievements', '/api/notifications', '/api/market', '/api/teach', '/api/sponsored', '/api/challenges', '/api/attempts', '/api/tips', '/api/tutor']);
function requiresUser(pattern) {
  const publicDemoWalletRoute = pattern === '/api/wallet/demo' || pattern === '/api/wallet/demo/sign';
  return !publicDemoWalletRoute && (USER_ROUTES.has('/' + pattern.split('/').slice(0, 3).join('/').replace(/^\//, '')) || pattern.startsWith('/api/paths') || pattern.startsWith('/api/attempts') || pattern.startsWith('/api/challenges') || pattern.startsWith('/api/wallet') || pattern.startsWith('/api/rewards') || pattern.startsWith('/api/tips') || pattern.startsWith('/api/tutor') || pattern === '/api/home' || pattern.startsWith('/api/market') || pattern.startsWith('/api/teach') || pattern === '/api/notifications/read');
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

server.listen(config.port, '0.0.0.0', () => console.log(`[proof] listening on :${config.port}`));
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { store.save(); server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500); });
