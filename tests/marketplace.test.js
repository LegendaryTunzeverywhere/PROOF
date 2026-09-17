import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNimiqAddress, kindIncludesReward } from '../server/util.js';
import { UserService } from '../server/services/users.js';
import { asyncStore, testbed, goodHtml, typedMeta } from './helpers.js';

test('users: listWalletAccounts works with async store.all', async (t) => {
  const tb = await testbed();
  await tb.users.createUser({ username: 'demoer', avatar: '🧪', walletMode: 'demo', isDemo: true });
  await tb.users.createUser({ username: 'walletreal', avatar: '🤖', walletMode: 'hub' });

  const asyncUsers = new UserService(asyncStore(tb.store, ['all']), tb.config);
  const accounts = await asyncUsers.listWalletAccounts();

  assert.ok(Array.isArray(accounts.demo));
  assert.ok(Array.isArray(accounts.real));
  assert.ok(accounts.demo.length >= 1);
  assert.ok(accounts.real.length >= 1);
});

test('util: reward kind checks are safe on absent or non-string kinds', async (t) => {
  assert.equal(kindIncludesReward(undefined), false);
  assert.equal(kindIncludesReward(null), false);
  assert.equal(kindIncludesReward('reward_daily'), true);
  assert.equal(kindIncludesReward('tip'), false);
});

test('users: admin can delete a demo wallet account by id', async (t) => {
  const tb = await testbed();
  const demo = await tb.users.createUser({ username: 'demoer', avatar: '🧪', walletMode: 'demo', isDemo: true });
  const real = await tb.users.createUser({ username: 'realer', walletMode: 'nimiqpay', isDemo: false });
  const asyncUsers = new UserService(asyncStore(tb.store, ['get']), tb.config);
  await asyncUsers.deleteDemoUser(demo.id);
  assert.equal(tb.store.get('users', demo.id), null);
  assert.equal(await asyncUsers.deleteDemoUser(real.id), false);
  assert.ok(tb.store.get('users', real.id));
});

test('marketplace: qualification gate blocks unqualified applicants', async (t) => {
  const tb = await testbed();
  const pro = await tb.users.createUser({});
  const task = tb.market.seedTask({ title: 'Build a landing page', description: 'x', budgetNim: 50, skillSlug: 'web-development', minScore: 70, clientName: 'KickLayer' });
  tb.store.save();
  await assert.rejects(() => tb.market.apply(task.id, pro, 'pick me'), (e) => e.code === 'QUALIFICATION_NOT_MET');
});

test('marketplace: verified proofer can apply; demo client auto-accepts; completion pays', async (t) => {
  const tb = await testbed();
  const pro = await tb.users.createUser({});
  // prove the skill first — the only way in
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'proof', title: 'Landing', brief: 'B', passScore: 70, rewardNim: 0, xp: 100,
      evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
    },
  });
  const { attempt } = await tb.challenges.startAttempt(pro.id, ch.id);
  const res = await tb.challenges.submitAttempt(pro.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });
  assert.ok(res.skill.verified);

  const task = tb.market.seedTask({ title: 'Build a landing page', description: 'x', budgetNim: 50, skillSlug: 'web-development', minScore: 70, clientName: 'KickLayer' });
  tb.store.save();
  const app2 = await tb.market.apply(task.id, pro, 'I just proved this at ' + res.evaluation.score);
  assert.equal(app2.status, 'accepted', 'demo client auto-accepts');
  const before = tb.users.get(pro.id).balanceLuna;
  const pay = await tb.market.completeTask(task.id, tb.users.get(pro.id));
  assert.ok(pay.netLuna > 4800000);
  assert.ok(tb.users.get(pro.id).balanceLuna > before);
  assert.ok(tb.users.get(pro.id).reputation > 50, 'reputation rises on completed work');
});

test('marketplace: postTask forwards escrowed treasury deposit when configured', async (t) => {
  const tb = await testbed();
  const poster = await tb.users.createUser({});
  await tb.rewards.credit(poster.id, 2500000, 'reward', 'seed');
  const sent = [];
  const market = new (await import('../server/services/marketplace.js')).MarketplaceService(tb.store, tb.config, {
    users: tb.users,
    skills: tb.skills,
    rewards: tb.rewards,
    notifications: tb.notifications,
    treasury: {
      isConfigured: () => true,
      send: async ({ recipient, amountLuna }) => {
        sent.push({ recipient, amountLuna });
        return { hash: 'abc123' };
      },
    },
  });

  tb.config.nimiq.treasuryAddress = 'NQ18 TAQ8 CL7P K505 LE2M C78A 1YQC 1CH1 6Y4G';
  await market.postTask(tb.users.get(poster.id), { title: 'Logo', description: 'd', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 });

  assert.equal(sent.length, 1);
  assert.equal(sent[0].recipient, normalizeNimiqAddress(tb.config.nimiq.treasuryAddress));
  assert.equal(sent[0].amountLuna, 2000000);
});

test('marketplace: demo wallets cannot post tasks or earn rewards', async (t) => {
  const tb = await testbed();
  const demo = await tb.users.createUser({ username: 'demoer', walletMode: 'demo', isDemo: true });

  await assert.rejects(
    () => tb.market.postTask(tb.users.get(demo.id), { title: 'Logo', description: 'd', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 }),
    (e) => e.code === 'DEMO_WALLET_REQUIRED'
  );

  const result = await tb.rewards.rewardForAttempt({
    userId: demo.id,
    challenge: { id: 'c-demo', title: 'Reward gate', rewardNim: 1 },
    attempt: { duplicate: false },
    evaluation: { pass: true },
    sourceKind: 'challenge',
    sourceKey: 'demo-reward-gate',
  });

  assert.equal(result.granted, false);
  assert.equal(result.reason, 'DEMO_WALLET_REQUIRED');
});

test('marketplace: double-apply and own-task are rejected', async (t) => {
  const tb = await testbed();
  const owner = await tb.users.createUser({});
  const pro = await tb.users.createUser({});
  await tb.rewards.credit(owner.id, 5000000, 'reward', 'seed');
  const t1 = await tb.market.postTask(tb.users.get(owner.id), { title: 'Logo', description: 'd', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 });
  await assert.rejects(() => tb.market.apply(t1.id, tb.users.get(owner.id), ''), (e) => e.code === 'OWN_TASK');
  // qualify pro minimally
  await tb.skills.ensureUserSkill(pro.id, 'ui-design');
  await tb.skills.applyProofResult(pro.id, 'ui-design', { score: 80, passed: true });
  await tb.market.apply(t1.id, tb.users.get(pro.id), 'hi');
  await assert.rejects(() => tb.market.apply(t1.id, tb.users.get(pro.id), 'again'), (e) => e.code === 'ALREADY_APPLIED');
});

test('teaching: only verified skills 70+ can teach; booking pays the teacher', async (t) => {
  const tb = await testbed();
  const teacher = await tb.users.createUser({});
  const student = await tb.users.createUser({});
  await tb.rewards.credit(student.id, 1000000, 'reward', 'seed');

  await assert.rejects(
    () => tb.teaching.createSession(tb.users.get(teacher.id), { title: 'X', description: 'd', durationMin: 20, priceNim: 5, maxStudents: 5, skillSlug: 'python' }),
    (e) => e.code === 'NOT_VERIFIED',
  );

  await tb.skills.applyProofResult(teacher.id, 'python', { score: 92, passed: true });
  const session = await tb.teaching.createSession(tb.users.get(teacher.id), { title: 'Python for Beginners — 20 minutes', description: 'd', durationMin: 20, priceNim: 5, maxStudents: 5, skillSlug: 'python' });
  const before = tb.users.get(teacher.id).balanceLuna;
  await tb.teaching.book(session.id, tb.users.get(student.id));
  const after = tb.users.get(teacher.id).balanceLuna;
  assert.equal(after - before, 490000, 'teacher receives 5 NIM − 2% fee');
  assert.equal(tb.users.get(student.id).balanceLuna, 500000);

  // review → reputation moves
  const repBefore = tb.users.get(teacher.id).reputation;
  await tb.teaching.review(session.id, tb.users.get(student.id), { rating: 5, text: 'brilliant' });
  assert.ok(tb.users.get(teacher.id).reputation > repBefore);
  await assert.rejects(() => tb.teaching.review(session.id, tb.users.get(student.id), { rating: 5 }), (e) => e.code === 'ALREADY_REVIEWED');
});

test('users: listWalletAccounts exposes demo and real wallet users with usernames and visible addresses', async (t) => {
  const tb = await testbed();
  const demo = await tb.users.createUser({ username: 'demoer', avatar: '🧪', walletMode: 'demo', isDemo: true });
  const realAddress = 'NQ18 TAQ8 CL7P K505 LE2M C78A 1YQC 1CH1 6Y4G';
  const real = await tb.users.createUser({ username: 'realer', avatar: '🌍', walletMode: 'nimiqpay', walletAddress: realAddress, isDemo: false });

  const wallets = await tb.users.listWalletAccounts();
  assert.ok(wallets.demo.some((u) => u.username === 'demoer' && u.avatar === '🧪' && u.walletMode === 'demo'));
  assert.ok(wallets.real.some((u) => u.username === 'realer' && u.avatar === '🌍' && u.walletMode === 'nimiqpay' && u.walletAddress === normalizeNimiqAddress(realAddress)));
  assert.ok(!wallets.demo.some((u) => u.id === real.id));
});

test('gamification: achievements unlock through the pipeline', async (t) => {
  const tb = await testbed();
  const u = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'proof', title: 'L2', brief: 'B', passScore: 70, rewardNim: 2, xp: 100,
      evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
    },
  });
  const { attempt } = await tb.challenges.startAttempt(u.id, ch.id);
  const res = await tb.challenges.submitAttempt(u.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });
  const ids = res.newAchievements.map((a) => a.id);
  assert.ok(ids.includes('first_proof'), 'first proof achievement');
  assert.ok(ids.includes('nim_earner'), 'nim earner achievement');
  assert.ok(tb.users.get(u.id).streak.current >= 1, 'streak touched');
});
