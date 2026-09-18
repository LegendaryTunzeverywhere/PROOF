import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../server/store.js';

test('chess persistence: random puzzles filter by difficulty and theme', async () => {
  const store = new Store({ dataDir: './data/test-chess-' + Math.random().toString(36).slice(2, 8) });
  await store.open();
  store.insert('ChessPuzzle', { id: 'p1', difficulty: 'beginner', themes: ['fork'] });
  store.insert('ChessPuzzle', { id: 'p2', difficulty: 'advanced', themes: ['pin'] });

  const puzzles = await store.randomChessPuzzles({ difficulty: 'beginner', theme: 'fork', limit: 5 });
  assert.deepEqual(puzzles.map((puzzle) => puzzle.id), ['p1']);
});

test('chess persistence: sparse filters fall back and repeats remain allowed', async () => {
  const store = new Store({ dataDir: './data/test-chess-' + Math.random().toString(36).slice(2, 8) });
  await store.open();
  store.insert('ChessPuzzle', { id: 'p1', difficulty: 'beginner', themes: ['fork'] });

  const first = await store.randomChessPuzzles({ difficulty: 'advanced', theme: 'pin', limit: 1 });
  const second = await store.randomChessPuzzles({ difficulty: 'advanced', theme: 'pin', limit: 1 });
  assert.equal(first[0].id, 'p1');
  assert.equal(second[0].id, 'p1');
});

test('chess persistence: rare motifs use related tactical patterns before broad fallback', async () => {
  const store = new Store({ dataDir: './data/test-chess-' + Math.random().toString(36).slice(2, 8) });
  await store.open();
  store.insert('ChessPuzzle', { id: 'p-discovery', difficulty: 'advanced', themes: ['discovery'] });

  const puzzles = await store.randomChessPuzzles({ difficulty: 'advanced', theme: 'windmill', limit: 1 });
  assert.equal(puzzles[0].id, 'p-discovery');
});

test('chess persistence: puzzle progress is saved through the store API', async () => {
  const store = new Store({ dataDir: './data/test-chess-' + Math.random().toString(36).slice(2, 8) });
  await store.open();

  await store.recordChessProgress({ userId: 'user-1', correct: true, score: 100 });
  await store.recordChessProgress({ userId: 'user-1', correct: false, score: 0 });

  const progress = store.find('ChessUserProgress', (row) => row.userId === 'user-1');
  assert.equal(progress.puzzlesAttempted, 2);
  assert.equal(progress.puzzlesSolved, 1);
  assert.equal(progress.averageAccuracy, 50);
});

test('chess persistence: create and delete aliases use the standard store contract', async () => {
  const store = new Store({ dataDir: './data/test-chess-' + Math.random().toString(36).slice(2, 8) });
  await store.open();

  const opening = store.create('ChessOpeningRepertoire', { id: 'opening-1', userId: 'user-1', name: 'Sicilian' });
  assert.equal(store.get('ChessOpeningRepertoire', opening.id).name, 'Sicilian');
  assert.equal(store.delete('ChessOpeningRepertoire', opening.id), true);
  assert.equal(store.get('ChessOpeningRepertoire', opening.id), null);
});

test('chess rewards: a correct puzzle receives a secure tenth-NIM increment', async () => {
  const { testbed } = await import('./helpers.js');
  const tb = await testbed();
  const user = await tb.users.createUser({ walletMode: 'nimiqpay', walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY' });
  const result = await tb.rewards.rewardForChessPuzzle({
    userId: user.id,
    puzzle: { id: 'p-reward', title: 'Reward puzzle' },
    attempt: { id: 'attempt-reward' },
  });

  assert.equal(result.granted, true);
  assert.ok(result.amountNim >= 0.1 && result.amountNim <= 1);
  assert.equal(Math.round(result.amountNim * 10), result.amountNim * 10);
  assert.equal(tb.store.get('users', user.id).balanceLuna, Math.round(result.amountNim * 100000));
});

test('chess activity: practice updates XP and streak data', async () => {
  const { testbed } = await import('./helpers.js');
  const tb = await testbed();
  const user = await tb.users.createUser({ walletMode: 'nimiqpay', walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY' });

  const xp = await tb.users.addXp(user.id, 25, 'Chess puzzle solved', 'chess:p1:attempt-1');
  const streak = await tb.users.touchStreak(user.id);
  const stored = tb.store.get('users', user.id);

  assert.equal(xp.user.xp, 25);
  assert.equal(streak.current, 1);
  assert.equal(stored.xpLedger[0].eventKey, 'chess:p1:attempt-1');
  assert.equal(stored.streak.current, 1);
});
