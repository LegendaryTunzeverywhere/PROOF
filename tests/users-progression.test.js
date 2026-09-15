import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed, copyOnReadStore } from './helpers.js';
import { UserService } from '../server/services/users.js';

/**
 * Regression: addXp(), touchStreak(), and addReputation() used to mutate
 * the in-memory `user` object fetched from store.get() and rely on
 * store.save() to persist it — which only "works" on the embedded Store
 * because its get() returns the same object reference every time.
 * SupabaseStore's save() is a documented no-op and its get() fetches a
 * fresh row each time, so xp/level/streak/reputation would silently never
 * reach the database. copyOnReadStore reproduces that behavior so the bug
 * shows up even without a real Supabase connection.
 */
test('user progression: xp/level persist via store.update(), not in-memory mutation', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const isolatingStore = copyOnReadStore(tb.store, ['users']);
  const users = new UserService(isolatingStore, tb.config);

  const { leveledUp } = await users.addXp(user.id, 500, 'test');
  const stored = tb.store.get('users', user.id);
  assert.equal(stored.xp, 500, 'xp must persist through store.update()');
  if (leveledUp) assert.ok(stored.level > 1, 'level must persist through store.update()');
});

test('user progression: streaks persist via store.update(), not in-memory mutation', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const isolatingStore = copyOnReadStore(tb.store, ['users']);
  const users = new UserService(isolatingStore, tb.config);

  const streak = await users.touchStreak(user.id);
  assert.equal(streak.current, 1);
  assert.equal(streak.emoji, '📚', 'streak should surface a UI-friendly emoji without relying on a caller-side defaults');
  assert.equal(streak.atRisk, false, 'streak should surface an at-risk boolean instead of returning the bare stored shape');
  const stored = tb.store.get('users', user.id);
  assert.equal(stored.streak?.current, 1, 'streak must persist through store.update()');
});

test('user progression: total xp earned is derived from the backend ledger and stays deduplicated', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const isolatingStore = copyOnReadStore(tb.store, ['users']);
  const users = new UserService(isolatingStore, tb.config);

  await users.addXp(user.id, 150, 'lesson', 'path:abc:lesson');
  await users.addXp(user.id, 275, 'proof', 'proof:xyz');
  await users.addXp(user.id, 275, 'proof', 'proof:xyz');

  const stored = tb.store.get('users', user.id);
  const totalXpEarned = Array.isArray(stored.xpLedger)
    ? stored.xpLedger.reduce((sum, entry) => {
        if (typeof entry === 'object') return sum + Number(entry.amount || 0);
        return sum + Number(entry || 0);
      }, 0)
    : 0;

  assert.equal(stored.xp, 425, 'cumulative xp should reflect all valid awards');
  assert.equal(totalXpEarned, 425, 'lifetime earned xp should match the ledger totals');
  assert.equal(stored.xpLedger.filter((entry) => typeof entry === 'object' && entry.eventKey === 'proof:xyz').length, 1, 'duplicate evidence should only be stored once');
});

test('user progression: reputation persists via store.update(), not in-memory mutation', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({});
  const before = tb.store.get('users', user.id).reputation;
  const isolatingStore = copyOnReadStore(tb.store, ['users']);
  const users = new UserService(isolatingStore, tb.config);

  await users.addReputation(user.id, 10);
  const stored = tb.store.get('users', user.id);
  assert.equal(stored.reputation, before + 10, 'reputation must persist through store.update()');
});

test('user progression: touchStreak on a missing user returns undefined instead of throwing', async (t) => {
  const tb = await testbed();
  const streak = await tb.users.touchStreak('no-such-user');
  assert.equal(streak, undefined);
});
