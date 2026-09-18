import { Chess } from 'chess.js';
import * as stockfish from './ai/services/stockfish.js';

export function normalizeSideToMove(side) {
  if (side === 'w' || side === 'white') return 'white';
  if (side === 'b' || side === 'black') return 'black';
  return 'white';
}

export function resolvePuzzleTurn(fen, fallbackSide = null) {
  if (!fen) return normalizeSideToMove(fallbackSide);

  try {
    const chess = new Chess(fen);
    return normalizeSideToMove(chess.turn());
  } catch (error) {
    return normalizeSideToMove(fallbackSide);
  }
}

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

export function resolveLegalMoveForFen(fen, moveText) {
  if (!fen || typeof moveText !== 'string' || !moveText.trim()) return null;

  const trimmed = moveText.trim();

  try {
    const chess = new Chess(fen);
    const parsed = chess.move(trimmed);
    if (parsed) return parsed.san;
  } catch (error) {
    // ignore; fall through to UCI parsing
  }

  const uci = trimmed.toLowerCase();
  const uciMatch = uci.match(/^([a-h])(\d)([a-h])(\d)([qrbn])?$/i);
  if (!uciMatch) return null;

  try {
    const chess = new Chess(fen);
    const move = chess.move({
      from: `${uciMatch[1]}${uciMatch[2]}`,
      to: `${uciMatch[3]}${uciMatch[4]}`,
      promotion: uciMatch[5] || 'q',
    });
    return move ? move.san : null;
  } catch (error) {
    return null;
  }
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
      bestMove = resolveLegalMoveForFen(fen, evaluation?.bestMove || null) || null;
    } catch (error) {
      console.warn('[chess-hints] evaluatePosition failed:', error.message);
    }
  }

  const normalizedSolution = normalizeUserMoves(fen, puzzle?.solution ?? []);
  if (!bestMove && normalizedSolution.length > 0) {
    const firstSolutionMove = normalizedSolution[0];
    const resolvedSolutionMove = resolveLegalMoveForFen(fen, firstSolutionMove);
    if (resolvedSolutionMove) {
      bestMove = resolvedSolutionMove;
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
