import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { config } from '../server/config.js';
import { normalizeNimiqAddress, kindIncludesReward } from '../server/util.js';
import { UserService } from '../server/services/users.js';
import { SupabaseStore } from '../server/supabase-store.js';
import { asyncStore, testbed, goodHtml, typedMeta } from './helpers.js';

test('schema: task applications include delivery review fields required by the escrow flow', async () => {
  const sql = await readFile(new URL('../database/complete-migration.sql', import.meta.url), 'utf8');
  const prismaSchema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8');

  for (const fragment of [
    '"deliveredAt" TIMESTAMP',
    '"deliveryNote" TEXT',
    '"deliveryUrl" TEXT',
    '"deliveryAttachment" TEXT',
    '"reviewedAt" TIMESTAMP',
    '"reviewFeedback" TEXT',
    '"completedAt" TIMESTAMP',
  ]) {
    assert.ok(sql.includes(fragment), `Missing migration column: ${fragment}`);
  }

  for (const name of ['deliveredAt', 'deliveryNote', 'deliveryUrl', 'deliveryAttachment', 'reviewedAt', 'reviewFeedback', 'completedAt']) {
    assert.ok(prismaSchema.includes(name), `Missing Prisma field: ${name}`);
  }
});

test('supabase: update retries after stripping missing task application columns from a stale schema', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

  const store = new SupabaseStore();
  let attempts = 0;
  store.client.from = () => ({
    update: (patch) => {
      attempts += 1;
      const chain = {
        eq: () => ({
          select: () => ({
            single: async () => {
              if (attempts === 1) {
                const err = new Error("Update failed: Could not find the 'deliveredAt' column of 'TaskApplication' in the schema cache");
                err.code = 'PGRST204';
                throw err;
              }
              return { data: { id: 'app_1', ...patch }, error: null };
            },
          }),
        }),
      };
      return chain;
    },
  });

  const result = await store.update('task_applications', 'app_1', {
    status: 'submitted',
    deliveredAt: Date.now(),
    deliveryNote: 'note',
    reviewFeedback: 'feedback',
    extraField: 'ignore-me',
  });

  assert.equal(attempts, 2);
  assert.equal(result.status, 'submitted');
  assert.equal(result.deliveryNote, 'note');
  assert.equal(result.reviewFeedback, 'feedback');
  assert.equal(result.extraField, undefined);
});

test('supabase: legacy bigint marketplace timestamps stay numeric instead of ISO strings', async () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

  const store = new SupabaseStore();
  let savedPatch = null;
  store.client.from = () => ({
    update: (patch) => {
      savedPatch = patch;
      return {
        eq: () => ({
          select: () => ({
            single: async () => ({ data: { id: 'app_1', ...patch }, error: null }),
          }),
        }),
      };
    },
  });

  await store.update('task_applications', 'app_1', {
    status: 'completed',
    completedAt: 1726750000000,
    reviewedAt: 1726750001000,
    reviewFeedback: 'Looks good',
  });

  assert.equal(typeof savedPatch.completedAt, 'number');
  assert.equal(typeof savedPatch.reviewedAt, 'number');
  assert.equal(savedPatch.reviewFeedback, 'Looks good');
});

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

test('marketplace: zero-score requirements do not block applicants without a proof record', async (t) => {
  const tb = await testbed();
  const pro = await tb.users.createUser({});
  const task = tb.market.seedTask({ title: 'Simple social post', description: 'x', budgetNim: 10, skillSlug: 'social', minScore: 0, clientName: 'BrandLab' });
  tb.store.save();
  const app = await tb.market.apply(task.id, pro, 'I can handle this');
  assert.equal(app.userId, pro.id);
  assert.equal(app.status, 'accepted', 'demo clients auto-accept and the zero-score gate should not block');
});

test('marketplace: submitted delivery cards carry the actual task and delivery content for review', async (t) => {
  const tb = await testbed();
  const client = await tb.users.createUser({ username: 'client-review-content', walletMode: 'nimiqpay' });
  const applicant = await tb.users.createUser({ username: 'applicant-review-content', walletMode: 'nimiqpay' });
  await tb.rewards.credit(client.id, 5000000, 'reward', 'seed');
  await tb.skills.ensureUserSkill(applicant.id, 'ui-design');
  await tb.skills.applyProofResult(applicant.id, 'ui-design', { score: 80, passed: true });
  const task = await tb.market.postTask(tb.users.get(client.id), { title: 'Build a landing page', description: 'Landing page design with hero + CTA', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 });
  const app = await tb.market.apply(task.id, tb.users.get(applicant.id), 'I can handle this');
  await tb.market.acceptApplication(task.id, app.id, tb.users.get(client.id));
  await tb.market.submitDelivery(task.id, tb.users.get(applicant.id), {
    note: 'Here is the hash and the ready-to-review mockup.',
    url: 'https://example.com/review',
    attachment: 'mockup.png',
  });

  const taskView = await tb.market.get(task.id, client.id);
  const submittedApp = taskView.applicationDetails.find((item) => item.userId === applicant.id);

  assert.ok(submittedApp, 'Missing submitted application details');
  assert.equal(submittedApp.taskTitle, 'Build a landing page');
  assert.equal(submittedApp.taskDescription, 'Landing page design with hero + CTA');
  assert.equal(submittedApp.deliveryNote, 'Here is the hash and the ready-to-review mockup.');
  assert.equal(submittedApp.deliveryUrl, 'https://example.com/review');
  assert.equal(submittedApp.deliveryAttachment, 'mockup.png');
});

test('marketplace: delivery review gates escrow release to the approved applicant', async (t) => {
  const tb = await testbed();
  const client = await tb.users.createUser({ username: 'client-review', walletMode: 'nimiqpay' });
  const applicant = await tb.users.createUser({ username: 'applicant-review', walletMode: 'nimiqpay' });
  await tb.rewards.credit(client.id, 5000000, 'reward', 'seed');
  await tb.skills.ensureUserSkill(applicant.id, 'ui-design');
  await tb.skills.applyProofResult(applicant.id, 'ui-design', { score: 80, passed: true });
  const task = await tb.market.postTask(tb.users.get(client.id), { title: 'Brand refresh', description: 'd', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 });
  const app = await tb.market.apply(task.id, tb.users.get(applicant.id), 'I can polish this');
  await tb.market.acceptApplication(task.id, app.id, tb.users.get(client.id));

  const delivery = await tb.market.submitDelivery(task.id, tb.users.get(applicant.id), {
    note: 'Delivered concept board', url: 'https://example.com/mock-board', attachment: 'board.pdf',
  });
  assert.equal(delivery.status, 'submitted');

  const before = tb.users.get(applicant.id).balanceLuna;
  const result = await tb.market.reviewDelivery(task.id, tb.users.get(client.id), {
    approved: true, feedback: 'Looks good — approved',
  });

  assert.equal(result.approved, true);
  assert.ok(tb.users.get(applicant.id).balanceLuna > before);
  assert.equal(tb.store.get('marketplace_tasks', task.id).status, 'completed');
});

test('marketplace: verified proofer can apply; demo client auto-accepts; delivery approval releases escrow', async (t) => {
  const tb = await testbed();
  const pro = await tb.users.createUser({});
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
  const delivery = await tb.market.submitDelivery(task.id, tb.users.get(pro.id), {
    note: 'Landing page ready', url: 'https://example.com/landing', attachment: 'landing.zip',
  });
  assert.equal(delivery.status, 'submitted');

  const pay = await tb.market.reviewDelivery(task.id, tb.users.get(task.clientId), { approved: true, feedback: 'Looks good' });
  assert.equal(pay.approved, true);
  assert.ok(tb.users.get(pro.id).balanceLuna > before);
  assert.ok(tb.users.get(pro.id).reputation > 50, 'reputation rises on approved work');
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

test('marketplace: task review updates separate client and applicant reputation', async (t) => {
  const tb = await testbed();
  const client = await tb.users.createUser({ username: 'client1', walletMode: 'nimiqpay' });
  const applicant = await tb.users.createUser({ username: 'applicant1', walletMode: 'nimiqpay' });
  await tb.rewards.credit(client.id, 5000000, 'reward', 'seed');
  const task = await tb.market.postTask(tb.users.get(client.id), { title: 'Logo', description: 'd', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 });
  await tb.skills.ensureUserSkill(applicant.id, 'ui-design');
  await tb.skills.applyProofResult(applicant.id, 'ui-design', { score: 80, passed: true });
  const app = await tb.market.apply(task.id, tb.users.get(applicant.id), 'I can do this');
  await tb.market.acceptApplication(task.id, app.id, tb.users.get(client.id));

  const clientRepBefore = tb.users.get(client.id).clientReputation;
  const applicantRepBefore = tb.users.get(applicant.id).applicantReputation;
  const review = await tb.market.reviewTask(task.id, tb.users.get(client.id), { rating: 5, feedback: 'Great delivery' });

  assert.equal(review.taskId, task.id);
  assert.ok(tb.users.get(applicant.id).applicantReputation > applicantRepBefore);
  assert.ok(tb.users.get(client.id).clientReputation >= clientRepBefore || tb.users.get(client.id).clientReputation === clientRepBefore);
});

test('marketplace: escrow payout grows client and applicant reputation with NIM rewarded after approval', async (t) => {
  const tb = await testbed();
  const client = await tb.users.createUser({ username: 'client-trust', walletMode: 'nimiqpay' });
  const applicant = await tb.users.createUser({ username: 'applicant-trust', walletMode: 'nimiqpay' });
  await tb.rewards.credit(client.id, 5000000, 'reward', 'seed');
  const task = await tb.market.postTask(tb.users.get(client.id), { title: 'Brand logo', description: 'd', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 });
  await tb.skills.ensureUserSkill(applicant.id, 'ui-design');
  await tb.skills.applyProofResult(applicant.id, 'ui-design', { score: 80, passed: true });
  const app = await tb.market.apply(task.id, tb.users.get(applicant.id), 'I can design this');
  await tb.market.acceptApplication(task.id, app.id, tb.users.get(client.id));

  const clientRepBefore = tb.users.get(client.id).clientReputation;
  const applicantRepBefore = tb.users.get(applicant.id).applicantReputation;
  await tb.market.submitDelivery(task.id, tb.users.get(applicant.id), { note: 'Brand assets ready' });
  await tb.market.reviewDelivery(task.id, tb.users.get(client.id), { approved: true, feedback: 'Approved' });

  assert.ok(tb.users.get(client.id).clientReputation > clientRepBefore, 'client trust rises after escrow payout');
  assert.ok(tb.users.get(applicant.id).applicantReputation > applicantRepBefore, 'applicant trust rises after reward payout');
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
  assert.equal(after - before, 491000, 'teacher receives 5 NIM − 2% fee and the notification micro payout');
  assert.equal(tb.users.get(student.id).balanceLuna, 500000);

  // review → reputation moves
  const repBefore = tb.users.get(teacher.id).reputation;
  await tb.teaching.review(session.id, tb.users.get(student.id), { rating: 5, text: 'brilliant' });
  assert.ok(tb.users.get(teacher.id).reputation > repBefore);
  await assert.rejects(() => tb.teaching.review(session.id, tb.users.get(student.id), { rating: 5 }), (e) => e.code === 'ALREADY_REVIEWED');
});

test('teaching: blank description and missing verified skill are rejected', async (t) => {
  const tb = await testbed();
  const teacher = await tb.users.createUser({});

  await assert.rejects(
    () => tb.teaching.createSession(tb.users.get(teacher.id), { title: 'X', description: '', durationMin: 20, priceNim: 5, maxStudents: 5, skillSlug: 'python' }),
    (e) => e.code === 'BAD_INPUT',
  );

  await tb.skills.applyProofResult(teacher.id, 'python', { score: 92, passed: true });
  await assert.rejects(
    () => tb.teaching.createSession(tb.users.get(teacher.id), { title: 'X', description: 'd', durationMin: 20, priceNim: 5, maxStudents: 5, skillSlug: 'writing' }),
    (e) => e.code === 'NOT_VERIFIED',
  );
});

test('notifications: each notification triggers a micro payout', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({ username: 'notifier', avatar: '🔔' });
  const before = tb.users.get(user.id).balanceLuna;

  await tb.notifications.push(user.id, {
    type: 'test_notice',
    title: 'Micro payout check',
    body: 'A small reward for reading this alert.',
    href: '#/profile',
    emoji: '💡',
  });

  const after = tb.users.get(user.id).balanceLuna;
  assert.ok(config.economy.notificationMicroPayoutNim >= 0.01, 'notification micro payout should be visible at a meaningful non-zero amount');
  assert.ok(after > before, 'recipient balance increases when a notification is sent');
  assert.equal(after - before, config.economy.notificationMicroPayoutNim * 100000, 'notification micro payout is configured amount in luna');
});

test('notifications: list supports pagination and page metadata', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({ username: 'pager', avatar: '📬' });

  for (let i = 0; i < 12; i++) {
    await tb.notifications.push(user.id, { type: `notice_${i}`, title: `Alert ${i}`, body: `Body ${i}`, href: '#/profile', emoji: '🔔' });
  }

  const page2 = await tb.notifications.list(user.id, { limit: 5, page: 2 });
  assert.equal(page2.items.length, 5, 'page two returns five notifications');
  assert.equal(page2.total, 12, 'pagination totals the whole dataset');
  assert.equal(page2.totalPages, 3, 'total pages is calculated from limit');
  assert.equal(page2.page, 2, 'current page is returned');
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
