/**
 * PuzzleSolver Component
 * 
 * Interactive chess puzzle solver with hints, scoring, and feedback.
 * Tracks user moves and compares against the solution.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { analysisApi, puzzleApi } from '../../services/chess';
import type { PuzzleSolverProps, ChessStatus } from '../../types/chess';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, THEME_LABELS } from '../../types/chess';

const normalizeSideToMove = (side?: string | null): 'white' | 'black' => {
  if (side === 'w' || side === 'white') return 'white';
  if (side === 'b' || side === 'black') return 'black';
  return 'white';
};

const determineTurnOrder = (fen?: string | null, humanColor?: 'white' | 'black' | null) => {
  const startingTurn = getFenTurn(fen);
  const actualHumanColor = normalizeSideToMove(humanColor ?? startingTurn);
  const authoritativeHumanColor = getFenTurn(fen);
  const humanMovesFirst = startingTurn === authoritativeHumanColor;

  return {
    startingTurn,
    humanColor: authoritativeHumanColor,
    botColor: authoritativeHumanColor === 'white' ? 'black' : 'white',
    humanMovesFirst,
  };
};

const getFenTurn = (fen?: string | null): 'white' | 'black' => {
  if (!fen) return 'white';

  try {
    const rawTurn = new Chess(fen).turn();
    return normalizeSideToMove(rawTurn);
  } catch (error) {
    console.warn('[puzzle] invalid FEN for turn detection:', fen, error);
    return 'white';
  }
};

const normalizeUserMovesForPuzzle = (fen?: string | null, solution: string[] = []) => {
  if (!fen || !Array.isArray(solution) || solution.length === 0) return [...solution];

  try {
    const chess = new Chess(fen);
    const expectedTurn = chess.turn();
    const userMoves: string[] = [];

    for (const moveText of solution) {
      const turnBeforeMove = chess.turn();
      const move = chess.move(moveText);
      if (!move) continue;
      if (turnBeforeMove === expectedTurn) userMoves.push(move.san);
    }

    return userMoves.length > 0 ? userMoves : [...solution];
  } catch (error) {
    console.warn('[puzzle] failed to normalize move list:', error);
    return [...solution];
  }
};

export const PuzzleSolver: React.FC<PuzzleSolverProps> = ({
  puzzle,
  onComplete,
  onGiveUp,
  onRetry,
  onNext,
}) => {
  const [moves, setMoves] = useState<string[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [status, setStatus] = useState<ChessStatus>('solving');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);
  const [showTurnPrompt, setShowTurnPrompt] = useState(false);
  const startingFen = puzzle.position?.fen || '8/8/8/8/8/8/8/8 w - - 0 1';
  const [currentFen, setCurrentFen] = useState(startingFen);
  const humanColor = getFenTurn(startingFen) as 'white' | 'black';
  const turnOrder = determineTurnOrder(startingFen, humanColor);
  const solverColor = turnOrder.humanColor as 'white' | 'black';
  const normalizedSolution = normalizeUserMovesForPuzzle(
    startingFen,
    Array.isArray(puzzle.solution) ? puzzle.solution : []
  );

  const resetBoard = useCallback(() => {
    const nextGame = new Chess(startingFen);
    setCurrentFen(nextGame.fen());
    setMoves([]);
    setBoardVersion((version) => version + 1);
    setStatus('solving');
    setFeedback('');
    setShowTurnPrompt(false);
  }, [startingFen, puzzle.id]);

  const playAutoReply = useCallback(async (fen: string) => {
    if (!fen || status !== 'solving') return;

    try {
      const analysis = await analysisApi.analyzePosition({ fen, depth: 12 });
      const bestMove = analysis?.evaluation?.bestMove;
      if (!bestMove) return;

      const replyGame = new Chess(fen);
      const played = (() => {
        try {
          return replyGame.move(bestMove);
        } catch (error) {
          return null;
        }
      })();

      if (!played) return;

      setCurrentFen(replyGame.fen());
      setBoardVersion((version) => version + 1);
      setShowTurnPrompt(true);
    } catch (error) {
      console.warn('[puzzle] engine auto-reply unavailable:', error);
    }
  }, [status]);

  // Reset when puzzle changes
  useEffect(() => {
    resetBoard();
    setHints([]);
    setHintsUsed(0);
  }, [puzzle.id, resetBoard]);

  useEffect(() => {
    if (status !== 'solving' || turnOrder.humanMovesFirst || !startingFen) return;
    void playAutoReply(startingFen);
  }, [status, startingFen, turnOrder.humanMovesFirst, playAutoReply]);

  useEffect(() => {
    if (!showTurnPrompt) return;
    const timer = window.setTimeout(() => setShowTurnPrompt(false), 1400);
    return () => window.clearTimeout(timer);
  }, [showTurnPrompt]);

  // Handle move
  const handleMove = useCallback(
    async (move: any, newFen: string) => {
      if (status !== 'solving') return;

      const nextMoves = [...moves, move.san];
      const expectedMove = normalizedSolution[moves.length];
      const expectedMover = new Chess(currentFen).turn();

      if (move.color !== expectedMover) {
        setStatus('incorrect');
        setFeedback(`That move is for the wrong side. The position says ${expectedMover === 'w' ? 'White' : 'Black'} to move.`);
        setCurrentFen(newFen);
        setMoves(nextMoves);
        return;
      }

      if (expectedMove !== move.san) {
        const ratingLoss = 25;
        setStatus('incorrect');
        setFeedback(`That move misses the tactic. Your puzzle rating dropped by ${ratingLoss}. Retry the position or move to the next one.`);
        setCurrentFen(newFen);
        setMoves(nextMoves);
        return;
      }

      const newGame = new Chess(newFen);
      setCurrentFen(newGame.fen());
      setMoves(nextMoves);

      if (nextMoves.length < normalizedSolution.length) {
        await playAutoReply(newFen);
      }

      // Check if puzzle is complete
      if (nextMoves.length === normalizedSolution.length) {
        const timeSpent = Date.now() - startTime;
        setStatus('correct');
        setFeedback('Correct! Well done!');

        try {
          const result = await puzzleApi.submitAttempt(puzzle.id, {
            moves: nextMoves,
            timeSpentMs: timeSpent,
            hintsUsed,
          });

          if (!result.correct) {
            const ratingDelta = Number(result.ratingDelta ?? -25);
            const absoluteDelta = Math.abs(ratingDelta);
            setStatus('incorrect');
            setFeedback(`Puzzle failed. Your puzzle rating dropped by ${absoluteDelta}. New rating: ${result.newRating ?? 'unavailable'}.`);
            onComplete?.(result);
            return;
          }

          const rewardText = result.reward?.amountNim
            ? ` +${result.reward.amountNim.toFixed(1)} NIM earned.`
            : '';
          const xpText = result.xpGained ? ` +${result.xpGained} XP.` : '';
          setFeedback(`Correct! Score: ${result.score}/100.${rewardText}${xpText}`);
          onComplete?.(result);
        } catch (error) {
          console.error('Failed to submit puzzle:', error);
        }
        return;
      }
    },
    [moves, puzzle, startTime, hintsUsed, onComplete, status, currentFen, normalizedSolution]
  );

  // Request hint
  const requestHint = useCallback(async () => {
    if (status !== 'solving') return;
    
    setLoading(true);
    try {
      const response = await puzzleApi.getHint(puzzle.id, hintsUsed + 1);
      setHints([...hints, response.hint]);
      setHintsUsed(hintsUsed + 1);
    } catch (error) {
      console.error('Failed to get hint:', error);
      setFeedback('Failed to load hint. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [puzzle.id, hints, hintsUsed, status]);

  // Reset puzzle
  const resetPuzzle = useCallback(() => {
    resetBoard();
  }, [resetBoard]);

  // Calculate moves remaining
  const movesRemaining = normalizedSolution.length - moves.length;
  const progress = normalizedSolution.length > 0 ? (moves.length / normalizedSolution.length) * 100 : 0;

  return (
    <div className="puzzle-solver">
      {/* Header */}
      <div className="puzzle-header">
        <h3 className="puzzle-title">{puzzle.title}</h3>
        <div className="puzzle-meta">
          <span
            className="puzzle-difficulty"
            style={{ backgroundColor: DIFFICULTY_COLORS[puzzle.difficulty] }}
          >
            {DIFFICULTY_LABELS[puzzle.difficulty]}
          </span>
          <span className="puzzle-turn">♟ {turnOrder.startingTurn === 'white' ? 'White to move' : 'Black to move'}</span>
          <span className="puzzle-rating">⭐ {puzzle.rating}</span>
        </div>
        <div className="puzzle-themes">
          {puzzle.themes.map((theme) => (
            <span key={theme} className="puzzle-theme">
              {THEME_LABELS[theme]}
            </span>
          ))}
        </div>
      </div>

      {/* Feedback banner shown early while the user is still focused on the position */}
      {feedback && (
        <div className={`puzzle-feedback ${status}`} role="alert" aria-live="polite">
          {status === 'correct' && <span className="feedback-icon">✅</span>}
          {status === 'incorrect' && <span className="feedback-icon">❌</span>}
          <span className="feedback-text">{feedback}</span>
        </div>
      )}

      {/* Progress bar */}
      {status === 'solving' && movesRemaining > 0 && (
        <div className="puzzle-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            {movesRemaining} move{movesRemaining !== 1 ? 's' : ''} remaining
          </div>
        </div>
      )}

      {/* Chessboard */}
      <div className="puzzle-board">
        <ChessBoard
          key={`${currentFen}-${boardVersion}`}
          initialFen={currentFen}
          onMove={handleMove}
          disabled={status !== 'solving'}
          orientation={solverColor}
          playerColor={solverColor}
          showTurnPrompt={showTurnPrompt}
        />
      </div>

      {/* Controls */}
      <div className="puzzle-controls">
        <button
          className="btn btn-hint"
          onClick={requestHint}
          disabled={status !== 'solving' || loading || hintsUsed >= puzzle.hints.length}
        >
          💡 Hint {hintsUsed > 0 && `(${hintsUsed})`}
        </button>
        {onGiveUp && (
          <button
            className="btn btn-give-up"
            onClick={onGiveUp}
            disabled={status !== 'solving'}
          >
            Show Solution
          </button>
        )}
      </div>

      {/* Hints panel */}
      {hints.length > 0 && (
        <div className="puzzle-hints">
          {hints.map((hint, i) => (
            <div key={i} className="hint-item">
              <span className="hint-icon">💡</span>
              <span className="hint-text">{hint}</span>
            </div>
          ))}
        </div>
      )}

      {status === 'incorrect' && (
        <div className="puzzle-controls">
          <button
            className="btn btn-reset"
            onClick={() => {
              resetPuzzle();
              onRetry?.();
            }}
          >
            Retry
          </button>
          {onNext && (
            <button className="btn btn-primary" onClick={onNext}>
              Next
            </button>
          )}
        </div>
      )}

      {status === 'correct' && (
        <div className="puzzle-controls">
          {onNext && (
            <button className="btn btn-primary" onClick={onNext}>
              Next
            </button>
          )}
        </div>
      )}

      {/* Solution explanation (shown after completion) */}
      {status === 'correct' && (
        <div className="puzzle-explanation">
          <h4>Explanation</h4>
          <p>{puzzle.solutionExplanation}</p>
          <div className="solution-moves">
            <strong>Solution:</strong> {normalizedSolution.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleSolver;
