import { Chess } from 'chess.js';
import * as stockfish from './ai/services/stockfish.js';

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

  if (!bestMove && Array.isArray(puzzle?.solution) && puzzle.solution.length > 0) {
    const firstSolutionMove = puzzle.solution[0];
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
