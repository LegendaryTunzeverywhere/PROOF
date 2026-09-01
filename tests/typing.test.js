import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed, goodHtml, typedMeta } from './helpers.js';

const challenge = () => ({
  type: 'html', kind: 'proof', title: 'Landing', brief: 'B', passScore: 70, rewardNim: 3, xp: 100,
  evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
});

function setup(tb) {
  const user = tb.users.createUser({});
  const ch = tb.challenges.createFromTemplate({ skillSlug: 'web-development', template: challenge() });
  const { attempt } = tb.challenges.startAttempt(user.id, ch.id);
  return { user, ch, attempt };
}

test('typing verification: submissions without telemetry are rejected', async (t) => {
  const tb = await testbed();
  const { user, attempt } = setup(tb);
  await assert.rejects(
    () => tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml }),
    (e) => e.code === 'TYPING_REQUIRED',
  );
  // attempt stays open so the user can resubmit through the app
  assert.equal(tb.store.get('attempts', attempt.id).status, 'in_progress');
});

test('typing verification: pasted submissions are rejected outright', async (t) => {
  const tb = await testbed();
  const { user, attempt } = setup(tb);
  await assert.rejects(
    () => tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: { effort: 999, pastes: 2, ms: 300000 } }),
    (e) => e.code === 'PASTE_DETECTED',
  );
  assert.equal(tb.users.get(user.id).balanceLuna, 0, 'no money moves on paste');
});

test('typing verification: implausible typing (too fast, too few edits) cannot pass or earn', async (t) => {
  const tb = await testbed();
  const { user, attempt } = setup(tb);
  // high-quality content, but "typed" instantly with 2 keystrokes → machine-written
  // Now throws immediately instead of allowing evaluation
  try {
    await tb.challenges.submitAttempt(user.id, attempt.id, {
      code: goodHtml, meta: { effort: 2, pastes: 0, ms: 40 },
    });
    assert.fail('Implausible typing should be rejected immediately');
  } catch (err) {
    assert.equal(err.code, 'TYPING_IMPLAUSIBLE', 'implausible typing must be rejected');
    assert.match(err.message, /Hand-typing verification failed/);
  }
  
  // Verify user did not earn anything
  assert.equal(tb.users.get(user.id).balanceLuna, 0);
});

test('typing verification: genuine hand-typed work is unaffected', async (t) => {
  const tb = await testbed();
  const { user, attempt } = setup(tb);
  const r = await tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: typedMeta(goodHtml) });
  assert.equal(r.evaluation.pass, true);
  assert.equal(r.attempt.typed, true);
  assert.equal(r.reward.granted, true);
});

test('typing verification: fabricated telemetry is still bounded by plausibility floors', async (t) => {
  const tb = await testbed();
  const { user, attempt } = setup(tb);
  // a cheating client claims big effort/ms but the ratio vs content still must hold —
  // here it does, so it passes (documented limitation: fully custom clients can fake telemetry)
  const r = await tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: { effort: 10 ** 6, pastes: 0, ms: 10 ** 9 } });
  assert.equal(r.attempt.typed, true);
});

test('typing verification: malformed telemetry is treated as missing', async (t) => {
  const tb = await testbed();
  const { user, attempt } = setup(tb);
  await assert.rejects(
    () => tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml, meta: { effort: 'lots', pastes: -3, ms: {} } }),
    (e) => e.code === 'TYPING_REQUIRED',
  );
});

test('typing verification: can be disabled via config (load testing)', async (t) => {
  const tb = await testbed();
  const prev = tb.config.economy.typingVerification;
  tb.config.economy.typingVerification = false;
  try {
    const { user, attempt } = setup(tb);
    const r = await tb.challenges.submitAttempt(user.id, attempt.id, { code: goodHtml });
    assert.equal(r.evaluation.pass, true);
    assert.equal(r.reward.granted, true, 'rewards flow again when verification is off');
  } finally {
    tb.config.economy.typingVerification = prev;
  }
});
