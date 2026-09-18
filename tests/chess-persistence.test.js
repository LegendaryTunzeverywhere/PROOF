import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../server/store.js';
import { buildPuzzleFromFen, convertPuzzle, getPlayerMovesForTurn } from '../scripts/import-lichess-puzzles.js';
import { buildPuzzleHint, normalizeUserMoves, resolvePuzzleTurn } from '../server/chess-hints.js';

test('lichess import: the stored puzzle FEN stays at the actual starting position', () => {
  const row = {
    id: 'sample-1',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'e7e5'],
    rating: 1500,
    themes: ['backRankMate'],
  };

  const converted = convertPuzzle(row);
  assert.ok(converted);
  assert.equal(converted.position.fen, row.fen);
  assert.deepEqual(converted.puzzle.solution, ['e4']);
});

test('lichess import: only the starting side is treated as the solver for a multi-move line', () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const solverMoves = getPlayerMovesForTurn(fen, ['e2e4', 'e7e5', 'g1f3']);
  assert.deepEqual(solverMoves, ['e4', 'Nf3']);
});

test('custom puzzle builder: derive the solver side directly from the FEN and keep one-sided move flow', () => {
  const puzzle = buildPuzzleFromFen({
    id: 'custom-1',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    rating: 1700,
    themes: ['fork'],
    moves: ['e4', 'e5', 'Nf3', 'Nc6'],
    title: 'openings fork ideas',
  });

  assert.ok(puzzle);
  assert.equal(puzzle.position.sideToMove, 'white');
  assert.deepEqual(puzzle.puzzle.solution, ['e4', 'Nf3']);
});

test('lichess import: solver side is taken from the starting FEN, not the final move line', () => {
  const row = {
    id: 'sidecheck-1',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1',
    moves: ['e7e5', 'e2e4', 'd7d6'],
    rating: 1600,
    themes: ['fork'],
  };

  const converted = convertPuzzle(row);
  assert.ok(converted);
  assert.equal(converted.position.sideToMove, 'black');
});

test('fen turn must override stale stored metadata when deciding who is to move', () => {
  const fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5';
  const solution = ['Bxf7+', 'Kxf7', 'Nxe5+'];

  const normalized = normalizeUserMoves(fen, solution);
  assert.deepEqual(normalized, ['Bxf7+', 'Nxe5+']);
  assert.ok(normalized.length > 0);
});

test('puzzle validation: mixed side-to-move lines are reduced to the solver sequence only', () => {
  const fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5';
  const solution = ['Bxf7+', 'Kxf7', 'Nxe5+'];

  assert.deepEqual(normalizeUserMoves(fen, solution), ['Bxf7+', 'Nxe5+']);
});

test('stored turn metadata must never override the actual FEN side to move', () => {
  const fen = 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R b KQkq - 0 5';

  assert.equal(resolvePuzzleTurn(fen, 'white'), 'black');
  assert.equal(resolvePuzzleTurn(fen, 'black'), 'black');
  assert.equal(resolvePuzzleTurn('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'black'), 'white');
});

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

test('chess persistence: failed attempts reduce the stored puzzle rating', async () => {
  const store = new Store({ dataDir: './data/test-chess-' + Math.random().toString(36).slice(2, 8) });
  await store.open();

  await store.recordChessProgress({ userId: 'user-rating', correct: false, score: 0 });

  const progress = store.find('ChessUserProgress', (row) => row.userId === 'user-rating');
  assert.equal(progress.puzzleRating, 1175);
  assert.equal(progress.puzzlesAttempted, 1);
});

test('supabase progress: successful solves and failed attempts update puzzle rating and attempt totals', async () => {
  const { SupabaseStore } = await import('../server/supabase-store.js');
  const store = new SupabaseStore();
  const calls = [];
  let progress = {
    id: 'progress-1',
    userId: 'user-supabase',
    puzzleRating: 1200,
    puzzlesSolved: 2,
    puzzlesAttempted: 4,
    averageAccuracy: 50,
    updatedAt: Date.now(),
  };

  store.find = async () => ({ ...progress });

  store.client = {
    from: (table) => ({
      update: (payload) => ({
        eq: async (field, value) => {
          calls.push({ table, action: 'update', field, value, payload });
          progress = { ...progress, ...payload, id: progress.id };
          return { error: null };
        },
      }),
      insert: async (payload) => {
        calls.push({ table, action: 'insert', payload });
        progress = { ...progress, ...payload };
        return { error: null };
      },
    }),
  };

  await store.recordChessProgress({ userId: 'user-supabase', correct: true, score: 100 });
  await store.recordChessProgress({ userId: 'user-supabase', correct: false, score: 0 });

  assert.equal(calls[0].payload.puzzleRating, 1225);
  assert.equal(calls[0].payload.puzzlesSolved, 3);
  assert.equal(calls[1].payload.puzzleRating, 1200);
  assert.equal(calls[1].payload.puzzlesAttempted, 6);
});

test('chess persistence: create and delete aliases use the standard store contract', async () => {
  const store = new Store({ dataDir: './data/test-chess-' + Math.random().toString(36).slice(2, 8) });
  await store.open();

  const opening = store.create('ChessOpeningRepertoire', { id: 'opening-1', userId: 'user-1', name: 'Sicilian' });
  assert.equal(store.get('ChessOpeningRepertoire', opening.id).name, 'Sicilian');
  assert.equal(store.delete('ChessOpeningRepertoire', opening.id), true);
  assert.equal(store.get('ChessOpeningRepertoire', opening.id), null);
});

test('chess rewards: missing difficulty falls back to the puzzle rating tier', async () => {
  const { testbed } = await import('./helpers.js');
  const tb = await testbed();
  const user = await tb.users.createUser({ walletMode: 'nimiqpay', walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY' });

  const result = await tb.rewards.rewardForChessPuzzle({
    userId: user.id,
    puzzle: { id: 'p-rating-tier', title: 'High-level reward fallback', rating: 2100 },
    attempt: { id: 'attempt-rating-tier' },
  });

  assert.equal(result.granted, true);
  assert.ok(result.amountNim >= 3 && result.amountNim <= 10);
});

test('user achievements: missing achievement rows are created before linking them to a user', async () => {
  const { testbed } = await import('./helpers.js');
  const tb = await testbed();
  const user = await tb.users.createUser({ walletMode: 'nimiqpay', walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY' });

  tb.store.tables.achievements = {};
  tb.store.tables.user_achievements = {};
  tb.store.update('users', user.id, { proofsPassed: 1 });

  await tb.users.checkAchievements(user.id);

  const achievement = tb.store.find('achievements', (entry) => entry.key === 'first_proof');
  assert.ok(achievement);
  assert.ok(tb.store.find('user_achievements', (entry) => entry.userId === user.id && entry.achievementId === achievement.id));
});

test('chess rewards: a correct puzzle receives the correct range for its difficulty', async () => {
  const { testbed } = await import('./helpers.js');
  const tb = await testbed();

  const beginnerUser = await tb.users.createUser({ walletMode: 'nimiqpay', walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY' });
  const intermediateUser = await tb.users.createUser({ walletMode: 'nimiqpay', walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVZ' });
  const advancedUser = await tb.users.createUser({ walletMode: 'nimiqpay', walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVWW' });

  const beginnerResult = await tb.rewards.rewardForChessPuzzle({
    userId: beginnerUser.id,
    puzzle: { id: 'p-beginner', title: 'Beginner reward', difficulty: 'beginner' },
    attempt: { id: 'attempt-beginner' },
  });
  const intermediateResult = await tb.rewards.rewardForChessPuzzle({
    userId: intermediateUser.id,
    puzzle: { id: 'p-intermediate', title: 'Intermediate reward', difficulty: 'intermediate' },
    attempt: { id: 'attempt-intermediate' },
  });
  const advancedResult = await tb.rewards.rewardForChessPuzzle({
    userId: advancedUser.id,
    puzzle: { id: 'p-advanced', title: 'Advanced reward', difficulty: 'advanced' },
    attempt: { id: 'attempt-advanced' },
  });

  assert.equal(beginnerResult.granted, true);
  assert.ok(beginnerResult.amountNim >= 0.1 && beginnerResult.amountNim <= 0.9);
  assert.equal(Math.round(beginnerResult.amountNim * 10), beginnerResult.amountNim * 10);

  assert.equal(intermediateResult.granted, true);
  assert.ok(intermediateResult.amountNim >= 1 && intermediateResult.amountNim <= 3);
  assert.equal(Math.round(intermediateResult.amountNim * 10), intermediateResult.amountNim * 10);

  assert.equal(advancedResult.granted, true);
  assert.ok(advancedResult.amountNim >= 3 && advancedResult.amountNim <= 10);
  assert.equal(Math.round(advancedResult.amountNim * 10), advancedResult.amountNim * 10);
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

test('engine hints: the hint system exposes a concrete best move', async () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  const puzzle = {
    id: 'hint-test',
    positionId: 'pos-hint-test',
    hints: ['Look for checks, captures, and threats.'],
    solution: ['e4'],
  };

  const result = await buildPuzzleHint(puzzle, 1, fen);
  assert.match(result.hint, /Best move:/i);
  assert.ok(result.bestMove);
  assert.ok(result.hasMore !== undefined);
});
