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
