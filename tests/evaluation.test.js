import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed, goodHtml, weakHtml } from './helpers.js';

const htmlChallenge = {
  id: 'ch_test', skillSlug: 'web-development', kind: 'project', type: 'html',
  title: 'Build a responsive product landing page',
  brief: 'Build a complete one-file landing page…',
  passScore: 70, rewardNim: 3, xp: 150,
  evaluator: { type: 'html', config: { required: ['nav', 'article', 'footer', 'h1', 'img'], needViewport: true, needLang: true, needAlt: true, minNavLinks: 3, minMediaQueries: 1, wantFluidUnits: true, minCards: 3, minCssProps: 12 } },
};

test('evaluation: strong submission passes with a high score', async () => {
  const tb = await testbed();
  const { evaluation } = await tb.challenges.evaluations.evaluate({ userId: 'u_test', challenge: htmlChallenge, payload: { code: goodHtml } });
  assert.ok(evaluation.score >= 75, `expected ≥75, got ${evaluation.score}`);
  assert.equal(evaluation.pass, true);
  const sum = evaluation.criteria.reduce((a, c) => a + c.max, 0);
  assert.equal(sum, 100, 'rubric must total 100');
});

test('evaluation: weak submission fails honestly', async () => {
  const tb = await testbed();
  const { evaluation } = await tb.challenges.evaluations.evaluate({ userId: 'u_test', challenge: htmlChallenge, payload: { code: weakHtml } });
  assert.ok(evaluation.score < 70, `expected <70, got ${evaluation.score}`);
  assert.equal(evaluation.pass, false);
  assert.ok(evaluation.improvements.length >= 2, 'must name concrete improvements');
  assert.ok(evaluation.nextStep && evaluation.nextStep.length > 10);
});

test('evaluation: empty submission scores ~0 and fails safely', async () => {
  const tb = await testbed();
  const { evaluation } = await tb.challenges.evaluations.evaluate({ userId: 'u_test', challenge: htmlChallenge, payload: { code: '   ' } });
  assert.equal(evaluation.pass, false);
  assert.ok(evaluation.score <= 5);
});

test('evaluation: identical submissions produce identical scores (deterministic)', async () => {
  const tb = await testbed();
  const a = await tb.challenges.evaluations.evaluate({ userId: 'u_x', challenge: htmlChallenge, payload: { code: goodHtml } });
  const b = await tb.challenges.evaluations.evaluate({ userId: 'u_y', challenge: htmlChallenge, payload: { code: goodHtml } });
  assert.equal(a.evaluation.score, b.evaluation.score);
  assert.equal(a.evaluation.contentHash, b.evaluation.contentHash);
});

test('evaluation: text rubric rewards coverage and punishes fog', async () => {
  const tb = await testbed();
  const challenge = {
    id: 'ch_txt', type: 'text', title: 'Design an API integration', passScore: 70,
    brief: 'Describe how you would add live weather: endpoint, fetch with async/await, error fallback. 250+ words.',
    evaluator: { type: 'text', config: { minWords: 200, targetWords: 280, keyConcepts: ['fetch', 'await', 'catch', 'ok', 'render', 'error', 'json'], keyConceptRatio: 0.5 } },
  };
  const good = await tb.challenges.evaluations.evaluate({
    userId: 'u_t',
    challenge,
    payload: { text: 'I would start by defining the data contract: the weather endpoint returns JSON with a location, a current temperature and an icon code. My page calls fetch on that endpoint inside an async function and awaits the response. The critical detail is that fetch does not throw on HTTP errors, so I check response.ok explicitly and throw on 404 or 500 responses. The parsing step awaits response.json() and I validate the fields before I render anything, because API data is user-facing but never trusted. If the request fails or the JSON is malformed, the catch block renders a friendly fallback card with cached data instead of an empty section. While the request is in flight I render a skeleton state so the page feels responsive. Finally I render the temperature and icon into a styled card, refresh the data every ten minutes, and log failures to the console for debugging.' },
  });
  assert.ok(good.evaluation.score >= 70, `got ${good.evaluation.score}`);
  const junk = await tb.challenges.evaluations.evaluate({ userId: 'u_t', challenge, payload: { text: 'idk maybe fetch stuff and hope it works lol' } });
  assert.ok(junk.evaluation.score < 50, `got ${junk.evaluation.score}`);
});

test('evaluation: verbatim brief copying is penalized', async () => {
  const tb = await testbed();
  const challenge = {
    id: 'ch_cp', type: 'text', title: 'Explain APIs', passScore: 70,
    brief: 'Describe endpoint usage and json rendering in your own words with error fallback patterns.',
    evaluator: { type: 'text', config: { minWords: 20, targetWords: 40, keyConcepts: [], keyConceptRatio: 0 } },
  };
  const r = await tb.challenges.evaluations.evaluate({ userId: 'u_c', challenge, payload: { text: 'Describe endpoint usage and json rendering in your own words with error fallback patterns. Describe endpoint usage and json rendering in your own words with error fallback patterns.' } });
  assert.equal(r.evaluation.pass, false, 'copying the brief must not pass');
});
