import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed, asyncStore } from './helpers.js';
import { UserService } from '../server/services/users.js';

/**
 * Regression: leaderboard()'s scoring formulas for 'teacher', 'helpful',
 * and 'tasks' called store.count() without awaiting it, and 'score'
 * (avgScore) called store.filter() without awaiting it. That's harmless
 * on the embedded store (synchronous methods, a non-awaited call just
 * returns the real value immediately) but on SupabaseStore these methods
 * are genuinely async — an un-awaited Promise used in arithmetic
 * (`somePromise * 8`) produces NaN, which JSON.stringify serializes as
 * `null`. That's exactly the "null" values seen on the leaderboard in
 * production. asyncStore() forces count()/filter() to return real
 * Promises even on the embedded store, reproducing the bug without a
 * real Supabase connection.
 */
for (const cat of ['teacher', 'helpful', 'tasks', 'score', 'xp', 'streak']) {
  test(`leaderboard category '${cat}' produces a real number, not NaN/null, against an async store`, async (t) => {
    const tb = await testbed();
    const user = await tb.users.createUser({});
    const isolatingStore = asyncStore(tb.store, ['count', 'filter']);
    const users = new UserService(isolatingStore, tb.config);

    const entries = await users.leaderboard(cat, 12);
    assert.ok(entries.length > 0, 'leaderboard should return entries');
    for (const e of entries) {
      assert.equal(typeof e.value, 'number', `entry for ${e.username} must have a numeric value, not ${e.value}`);
      assert.equal(Number.isNaN(e.value), false, `entry for ${e.username} must not be NaN`);
    }
  });
}

test('leaderboard pagination keeps ranks consistent across offset pages', async () => {
  const tb = await testbed();
  const users = new UserService(tb.store, tb.config);

  const pageOne = await users.leaderboard('xp', 10, 0);
  const pageTwo = await users.leaderboard('xp', 10, 10);

  assert.ok(pageOne.length > 0, 'first page should have entries');
  assert.ok(pageTwo.length >= 0, 'second page should be requestable');
  if (pageTwo.length > 0) {
    assert.equal(pageTwo[0].rank, 11, 'second page should start at rank 11');
  }
});
