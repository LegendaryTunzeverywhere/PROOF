import { Chess } from 'chess.js';
import * as stockfish from './ai/services/stockfish.js';

export function normalizeUserMoves(fen, solution = []) {
  if (!fen || !Array.isArray(solution) || solution.length === 0) return Array.isArray(solution) ? [...solution] : [];

  const chess = new Chess(fen);
  const expectedTurn = chess.turn();
  const userMoves = [];

  for (const moveText of solution) {
    if (typeof moveText !== 'string' || !moveText.trim()) continue;

    const turnBeforeMove = chess.turn();
    const played = chess.move(moveText);
    if (!played) continue;
    if (turnBeforeMove === expectedTurn) userMoves.push(played.san);
  }

  return userMoves.length > 0 ? userMoves : [...solution];
}

export async function buildPuzzleHint(puzzle, level = 1, positionFen = null) {
  const clues = Array.isArray(puzzle?.hints) ? puzzle.hints : [];
  const fallbackIndex = Math.min(Math.max((Number(level) || 1) - 1, 0), Math.max(clues.length - 1, 0));
  const fallbackHint = clues[fallbackIndex] || 'Look for checks, captures, and threats.';

  const fen = positionFen || puzzle?.position?.fen || null;
  let bestMove = null;

  if (fen) {
    try {
      const evaluation = await stockfish.evaluatePosition(fen, { depth: 12 });
      bestMove = evaluation?.bestMove || null;
    } catch (error) {
      console.warn('[chess-hints] evaluatePosition failed:', error.message);
    }
  }

  const normalizedSolution = normalizeUserMoves(fen, puzzle?.solution ?? []);
  if (!bestMove && normalizedSolution.length > 0) {
    const firstSolutionMove = normalizedSolution[0];
    if (typeof firstSolutionMove === 'string' && firstSolutionMove.length > 0) {
      bestMove = firstSolutionMove;
    }
  }

  if (!bestMove) {
    return {
      hint: fallbackHint,
      hasMore: (Number(level) || 1) < clues.length,
      bestMove: null,
    };
  }

  const engineHint = `Best move: ${bestMove}.`;
  const hint = clues.length > 0 ? `${engineHint} ${fallbackHint}` : engineHint;

  return {
    hint,
    hasMore: (Number(level) || 1) < clues.length || Boolean(bestMove),
    bestMove,
  };
}
