import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed, goodHtml, weakHtml, typedMeta } from './helpers.js';

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
  const { attempt } = tb.challenges.startAttempt(user.id, ch.id);
  const result = await tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });

  assert.equal(result.evaluation.pass, true);
  assert.ok(result.reward.granted, 'passing a rewarded challenge must grant NIM');
  assert.equal(result.reward.amountNim, 3);
  assert.equal(result.skill.score, result.evaluation.score, 'first proof sets the skill score');
  assert.equal(result.skill.verified, true);
  const me = tb.users.get(user.id);
  assert.ok(me.xp >= 150);
  assert.equal(me.balanceLuna, 300000, '3 NIM = 300k luna credited');
});

test('anti-cheat: client cannot inject score/status into the pipeline', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: { type: 'html', kind: 'proof', title: 'T', brief: 'B', passScore: 70, rewardNim: 2, xp: 100, evaluator: { type: 'html', config: { required: ['h1'] } } },
  });
  const { attempt } = tb.challenges.startAttempt(user.id, ch.id);
  // malicious payload tries to claim a perfect score
  const result = await tb.challenges.submitAttempt(user.id, attempt.id, { code: '<h1>hi</h1>', score: 100, status: 'passed', rewardNim: 999, meta: typedMeta('<h1>hi</h1>') });
  assert.notEqual(result.evaluation.score, 100, 'client-provided score must be ignored');
  assert.ok(result.evaluation.score < 70);
  assert.equal(result.attempt.status, 'failed');
  assert.equal(result.reward.granted, false);
  assert.equal(tb.users.get(user.id).balanceLuna, 0);
});

test('anti-cheat: rate limit blocks instant resubmission', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: { type: 'html', kind: 'proof', title: 'T', brief: 'B', passScore: 70, rewardNim: 2, xp: 100, evaluator: { type: 'html', config: { required: ['h1'] } } },
  });
  const a1 = tb.challenges.startAttempt(user.id, ch.id);
  await tb.challenges.submitAttempt(user.id, a1.attempt.id, { code: '<h1>one</h1>', meta: typedMeta('<h1>one</h1>') });
  assert.throws(() => tb.challenges.startAttempt(user.id, ch.id), (e) => e.code === 'RATE_LIMITED');
});

test('anti-cheat: same challenge cannot be rewarded twice', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({
    skillSlug: 'web-development',
    template: {
      type: 'html', kind: 'proof', title: 'T', brief: 'B', passScore: 70, rewardNim: 2, xp: 100,
      evaluator: { type: 'html', config: { required: ['h1'], needViewport: false, needLang: false } },
    },
  });
  const a1 = tb.challenges.startAttempt(user.id, ch.id);
  const r1 = await tb.challenges.submitAttempt(user.id, a1.attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });
  assert.equal(r1.reward.granted, true);

  // force-allow a second attempt (bypass interval like time travel would)
  tb.store.update('attempts', a1.attempt.id, { submittedAt: Date.now() - 999999 });
  const a2 = tb.challenges.startAttempt(user.id, ch.id);
  const r2 = await tb.challenges.submitAttempt(user.id, a2.attempt.id, { code: goodHtml + '<!-- v2 -->', meta: typedMeta(goodHtml) });
  assert.equal(r2.reward.granted, false, 'reward must be one-time per challenge');
  assert.equal(r2.reward.reason, 'ALREADY_REWARDED');
  assert.equal(tb.users.get(user.id).balanceLuna, 200000, 'balance must not double');
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
  const a1 = tb.challenges.startAttempt(user.id, ch.id);
  await tb.challenges.submitAttempt(user.id, a1.attempt.id, { code: '<h1>dup</h1> <!-- a -->', meta: typedMeta('<h1>dup</h1>') });
  tb.store.update('attempts', a1.attempt.id, { submittedAt: Date.now() - 999999 });
  
  // Second attempt with identical content should be rejected immediately
  const a2 = tb.challenges.startAttempt(user.id, ch.id);
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

test('daily challenge: one reward per day per user', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const daily = await tb.challenges.todayDaily();
  const a1 = tb.challenges.startAttempt(user.id, daily.id);
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
