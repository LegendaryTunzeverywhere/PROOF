import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed, goodHtml, typedMeta } from './helpers.js';

test('marketplace: qualification gate blocks unqualified applicants', async (t) => {
  const tb = await testbed();
  const pro = await tb.users.createUser({});
  const task = tb.market.seedTask({ title: 'Build a landing page', description: 'x', budgetNim: 50, skillSlug: 'web-development', minScore: 70, clientName: 'KickLayer' });
  tb.store.save();
  assert.throws(() => tb.market.apply(task.id, pro, 'pick me'), (e) => e.code === 'QUALIFICATION_NOT_MET');
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
  const { attempt } = tb.challenges.startAttempt(pro.id, ch.id);
  const res = await tb.challenges.submitAttempt(pro.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });
  assert.ok(res.skill.verified);

  const task = tb.market.seedTask({ title: 'Build a landing page', description: 'x', budgetNim: 50, skillSlug: 'web-development', minScore: 70, clientName: 'KickLayer' });
  tb.store.save();
  const app2 = tb.market.apply(task.id, pro, 'I just proved this at ' + res.evaluation.score);
  assert.equal(app2.status, 'accepted', 'demo client auto-accepts');
  const before = tb.users.get(pro.id).balanceLuna;
  const pay = await tb.market.completeTask(task.id, tb.users.get(pro.id));
  assert.ok(pay.netLuna > 4800000);
  assert.ok(tb.users.get(pro.id).balanceLuna > before);
  assert.ok(tb.users.get(pro.id).reputation > 50, 'reputation rises on completed work');
});

test('marketplace: double-apply and own-task are rejected', async (t) => {
  const tb = await testbed();
  const owner = await tb.users.createUser({});
  const pro = await tb.users.createUser({});
  await tb.rewards.credit(owner.id, 5000000, 'reward', 'seed');
  const t1 = await tb.market.postTask(tb.users.get(owner.id), { title: 'Logo', description: 'd', budgetNim: 20, skillSlug: 'ui-design', minScore: 60 });
  assert.throws(() => tb.market.apply(t1.id, tb.users.get(owner.id), ''), (e) => e.code === 'OWN_TASK');
  // qualify pro minimally
  tb.skills.ensureUserSkill(pro.id, 'ui-design');
  tb.skills.applyProofResult(pro.id, 'ui-design', { score: 80, passed: true });
  tb.market.apply(t1.id, tb.users.get(pro.id), 'hi');
  assert.throws(() => tb.market.apply(t1.id, tb.users.get(pro.id), 'again'), (e) => e.code === 'ALREADY_APPLIED');
});

test('teaching: only verified skills 70+ can teach; booking pays the teacher', async (t) => {
  const tb = await testbed();
  const teacher = await tb.users.createUser({});
  const student = await tb.users.createUser({});
  await tb.rewards.credit(student.id, 1000000, 'reward', 'seed');

  assert.throws(
    () => tb.teaching.createSession(tb.users.get(teacher.id), { title: 'X', description: 'd', durationMin: 20, priceNim: 5, maxStudents: 5, skillSlug: 'python' }),
    (e) => e.code === 'NOT_VERIFIED',
  );

  tb.skills.applyProofResult(teacher.id, 'python', { score: 92, passed: true });
  const session = tb.teaching.createSession(tb.users.get(teacher.id), { title: 'Python for Beginners — 20 minutes', description: 'd', durationMin: 20, priceNim: 5, maxStudents: 5, skillSlug: 'python' });
  const before = tb.users.get(teacher.id).balanceLuna;
  await tb.teaching.book(session.id, tb.users.get(student.id));
  const after = tb.users.get(teacher.id).balanceLuna;
  assert.equal(after - before, 490000, 'teacher receives 5 NIM − 2% fee');
  assert.equal(tb.users.get(student.id).balanceLuna, 500000);

  // review → reputation moves
  const repBefore = tb.users.get(teacher.id).reputation;
  tb.teaching.review(session.id, tb.users.get(student.id), { rating: 5, text: 'brilliant' });
  assert.ok(tb.users.get(teacher.id).reputation > repBefore);
  assert.throws(() => tb.teaching.review(session.id, tb.users.get(student.id), { rating: 5 }), (e) => e.code === 'ALREADY_REVIEWED');
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
  const { attempt } = tb.challenges.startAttempt(u.id, ch.id);
  const res = await tb.challenges.submitAttempt(u.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });
  const ids = res.newAchievements.map((a) => a.id);
  assert.ok(ids.includes('first_proof'), 'first proof achievement');
  assert.ok(ids.includes('nim_earner'), 'nim earner achievement');
  assert.ok(tb.users.get(u.id).streak.current >= 1, 'streak touched');
});
