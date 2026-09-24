import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed, copyOnReadStore, goodHtml, weakHtml, typedMeta } from './helpers.js';

test('challenge: full pipeline — submit → score → skill → reward → xp', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'project', title: 'Build a responsive product landing page', timeMin: 40,
      brief: 'Build a landing page…', requirements: ['responsive', 'semantic'],
      passScore: 70, rewardNim: 3, xp: 150,
      evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
    },
  });
  const { attempt } = await tb.challenges.startAttempt(user.id, ch.id);
  const result = await tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });

  assert.equal(result.evaluation.pass, true);
  assert.ok(result.reward.granted, 'passing a rewarded challenge must grant NIM');
  assert.equal(result.reward.amountNim, 3);
  assert.equal(result.skill.score, result.evaluation.score, 'first proof sets the skill score');
  assert.equal(result.skill.verified, true);
  const me = tb.users.get(user.id);
  assert.ok(me.xp >= 150);
  const rewardTxs = await tb.rewards.txHistory(user.id);
  assert.deepEqual(
    rewardTxs.filter((tx) => tx.kind === 'reward').map((tx) => tx.amountLuna),
    [300000],
    'exactly 3 NIM must be credited as the challenge reward',
  );
});

test('challenge: first verified proof pushes a real skill_verified notification', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'project', title: 'Build a responsive product landing page', timeMin: 40,
      brief: 'Build a landing page…', requirements: ['responsive', 'semantic'],
      passScore: 70, rewardNim: 3, xp: 150,
      evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
    },
  });
  const { attempt } = await tb.challenges.startAttempt(user.id, ch.id);
  await tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });

  const notifs = await tb.notifications.list(user.id);
  const verifiedNotif = notifs.find((n) => n.type === 'skill_verified');
  assert.ok(verifiedNotif, 'a real skill_verified notification must be pushed on first verification');
  assert.match(verifiedNotif.body, /Score \d+\/100/);
});

test('anti-cheat: client cannot inject score/status into the pipeline', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: { type: 'html', kind: 'proof', title: 'T', brief: 'B', passScore: 70, rewardNim: 2, xp: 100, evaluator: { type: 'html', config: { required: ['h1'] } } },
  });
  const { attempt } = await tb.challenges.startAttempt(user.id, ch.id);
  // malicious payload tries to claim a perfect score
  const result = await tb.challenges.submitAttempt(user.id, attempt.id, { code: '<h1>hi</h1>', score: 100, status: 'passed', rewardNim: 999, meta: typedMeta('<h1>hi</h1>') });
  assert.notEqual(result.evaluation.score, 100, 'client-provided score must be ignored');
  assert.ok(result.evaluation.score < 70);
  assert.equal(result.attempt.status, 'failed');
  assert.equal(result.reward.granted, false);
  assert.equal(
    (await tb.rewards.txHistory(user.id)).filter((tx) => tx.kind === 'reward').length,
    0,
    'a client-injected reward must never create a reward transaction',
  );
});

/**
 * Regression: submitAttempt() mutated the in-memory `attempt` row fetched
 * via getAttempt() → store.get('attempts', ...) and relied on store.save()
 * to persist status/score/evaluationId/typed/duplicate/rewardClaimed. That
 * only works on the embedded store by accident (shared object reference).
 * On SupabaseStore (save() is a no-op, get() fetches a fresh row each
 * time), none of that would reach the database. Swapping the service's
 * store for one that returns fresh copies of 'attempts' rows (mimicking
 * Supabase) reproduces the bug even without a real Supabase connection.
 */
test('submitAttempt persists status/score/evaluationId via store.update()', async (t) => {
  const tb = await testbed();
  tb.challenges.store = copyOnReadStore(tb.store, ['attempts']);
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'project', title: 'Build a responsive product landing page', timeMin: 40,
      brief: 'Build a landing page…', requirements: ['responsive', 'semantic'],
      passScore: 70, rewardNim: 3, xp: 150,
      evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
    },
  });
  const { attempt } = await tb.challenges.startAttempt(user.id, ch.id);
  const result = await tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });

  const stored = tb.store.get('attempts', attempt.id);
  assert.equal(stored.status, 'passed', 'status must persist through store.update()');
  assert.equal(stored.score, result.evaluation.score, 'score must persist through store.update()');
  assert.equal(stored.evaluationId, result.evaluation.id, 'evaluationId must persist through store.update()');
  assert.equal(stored.rewardClaimed, true, 'rewardClaimed must persist through store.update()');
});

test('anti-cheat: rate limit blocks instant resubmission', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: { type: 'html', kind: 'proof', title: 'T', brief: 'B', passScore: 70, rewardNim: 2, xp: 100, evaluator: { type: 'html', config: { required: ['h1'] } } },
  });
  const a1 = await tb.challenges.startAttempt(user.id, ch.id);
  await tb.challenges.submitAttempt(user.id, a1.attempt.id, { code: '<h1>one</h1>', meta: typedMeta('<h1>one</h1>') });
  await assert.rejects(() => tb.challenges.startAttempt(user.id, ch.id), (e) => e.code === 'RATE_LIMITED');
});

test('anti-cheat: passed challenge cannot be started or rewarded again', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'proof', title: 'T', brief: 'B', passScore: 70, rewardNim: 2, xp: 100,
      evaluator: { type: 'html', config: { required: ['h1'], needViewport: false, needLang: false } },
    },
  });
  const a1 = await tb.challenges.startAttempt(user.id, ch.id);
  const r1 = await tb.challenges.submitAttempt(user.id, a1.attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });
  assert.equal(r1.reward.granted, true);

  await assert.rejects(
    () => tb.challenges.startAttempt(user.id, ch.id),
    (error) => error.code === 'ALREADY_PASSED',
    'a passed challenge must not create another attempt'
  );
  assert.deepEqual(
    (await tb.rewards.txHistory(user.id)).filter((tx) => tx.kind === 'reward').map((tx) => tx.amountLuna),
    [200000],
    'a passed challenge must create exactly one reward transaction',
  );
});

test('anti-cheat: duplicate submission hash is flagged and unrewarded', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'proof', title: 'T2', brief: 'B', passScore: 70, rewardNim: 2, xp: 100,
      evaluator: { type: 'html', config: { required: ['h1'], needViewport: false, needLang: false } },
    },
  });
  const a1 = await tb.challenges.startAttempt(user.id, ch.id);
  await tb.challenges.submitAttempt(user.id, a1.attempt.id, { code: '<h1>dup</h1> <!-- a -->', meta: typedMeta('<h1>dup</h1>') });
  tb.store.update('attempts', a1.attempt.id, { submittedAt: Date.now() - 999999 });
  
  // Second attempt with identical content should be rejected immediately
  const a2 = await tb.challenges.startAttempt(user.id, ch.id);
  try {
    await tb.challenges.submitAttempt(user.id, a2.attempt.id, { code: '<h1>dup</h1> <!-- a -->', meta: typedMeta('<h1>dup</h1>') });
    assert.fail('Duplicate submission should have been rejected');
  } catch (err) {
    assert.equal(err.code, 'DUPLICATE_SUBMISSION', 'duplicate must be rejected with proper error code');
  }
  
  // Verify attempt was marked as duplicate
  const attempt2 = tb.store.get('attempts', a2.attempt.id);
  assert.equal(attempt2.duplicate, true, 'identical content must be flagged');
});

test('daily challenge: no SkillProof row is written when the daily challenge has no skillSlug', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const daily = await tb.challenges.todayDaily();
  assert.equal(daily.skillSlug, null, 'daily challenge records legitimately carry a null skillSlug');

  const a = await tb.challenges.startAttempt(user.id, daily.id);
  const text = 'Yesterday semantic HTML finally clicked for me. Tags are not about how things look, they describe what things mean: a nav element tells the browser and screen readers this is navigation, an article wraps a self-contained piece of content, and a footer closes the page. When I rebuilt my practice page using semantic elements instead of div soup, the structure became obvious at a glance and my heading order stopped skipping levels. Meaning first, styling second, that is the lesson I am keeping.';
  const result = await tb.challenges.submitAttempt(user.id, a.attempt.id, { text, meta: typedMeta(text) });

  assert.equal(result.proof, null, 'daily challenge proof records must be skipped when skillSlug is null');
  assert.equal(tb.store.filter('skill_proofs', (p) => p.challengeId === daily.id).length, 0, 'no skill proof should be inserted for a null-skill daily challenge');
});

test('daily challenge: one reward per day per user', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const daily = await tb.challenges.todayDaily();
  const a1 = await tb.challenges.startAttempt(user.id, daily.id);
  const r1 = await tb.challenges.submitAttempt(user.id, a1.attempt.id, { text: 'Yesterday semantic HTML finally clicked for me. Tags are not about how things look, they describe what things mean: a nav element tells the browser and screen readers this is navigation, an article wraps a self-contained piece of content, and a footer closes the page. When I rebuilt my practice page using semantic elements instead of div soup, the structure became obvious at a glance and my heading order stopped skipping levels. Meaning first, styling second, that is the lesson I am keeping.', meta: typedMeta('Yesterday semantic HTML finally clicked for me. Tags are not about how things look, they describe what things mean: a nav element tells the browser and screen readers this is navigation, an article wraps a self-contained piece of content, and a footer closes the page. When I rebuilt my practice page using semantic elements instead of div soup, the structure became obvious at a glance and my heading order stopped skipping levels. Meaning first, styling second, that is the lesson I am keeping.') });
  assert.equal(r1.reward.granted, true);
  assert.equal(r1.reward.reward.sourceKind, 'daily');

  // second daily attempt same day (new challenge instance per day → same reward key)
  const daily2 = await tb.challenges.todayDaily();
  assert.equal(daily2.id, daily.id, 'daily challenge is deterministic per day');
  const key = `${user.id}:daily:${daily.dailyKey}`;
  assert.ok((await tb.rewards.dailyRewardTotals(user.id)).amountLuna > 0);
  assert.throws(() => tb.store.insert('rewards', { id: 'x', key, userId: user.id, amountLuna: 1 }), /UNIQUE_VIOLATION/, 'reward key must be unique');
});
