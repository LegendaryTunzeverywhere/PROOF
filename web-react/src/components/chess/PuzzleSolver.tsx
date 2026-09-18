/**
 * PuzzleSolver Component
 * 
 * Interactive chess puzzle solver with hints, scoring, and feedback.
 * Tracks user moves and compares against the solution.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { puzzleApi } from '../../services/chess';
import type { PuzzleSolverProps, ChessStatus } from '../../types/chess';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, THEME_LABELS } from '../../types/chess';

export const PuzzleSolver: React.FC<PuzzleSolverProps> = ({
  puzzle,
  onComplete,
  onGiveUp,
}) => {
  const [game, setGame] = useState<Chess>(() => new Chess(puzzle.position?.fen || puzzle.positionId));
  const [moves, setMoves] = useState<string[]>([]);
  const [hints, setHints] = useState<string[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [status, setStatus] = useState<ChessStatus>('solving');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);
  const playerColor = puzzle.position?.sideToMove || (new Chess(puzzle.position?.fen || puzzle.positionId).turn() === 'w' ? 'white' : 'black');

  const resetBoard = useCallback(() => {
    const nextGame = new Chess(puzzle.position?.fen || puzzle.positionId);
    setGame(nextGame);
    setMoves([]);
    setBoardVersion((version) => version + 1);
    setStatus('solving');
    setFeedback('');
  }, [puzzle.id, puzzle.position?.fen, puzzle.positionId]);

  // Reset when puzzle changes
  useEffect(() => {
    resetBoard();
    setHints([]);
    setHintsUsed(0);
  }, [puzzle.id, resetBoard]);

  // Handle move
  const handleMove = useCallback(
    async (move: any, newFen: string) => {
      if (status !== 'solving') return;

      const nextMoves = [...moves, move.san];
      const expectedMove = puzzle.solution[moves.length];

      if (expectedMove !== move.san) {
        setStatus('incorrect');
        setFeedback('That move misses the tactic. Your puzzle rating dropped by 25. Reset the board and try the actual idea.');
        setGame(new Chess(newFen));
        setMoves(nextMoves);
        return;
      }

      const newGame = new Chess(newFen);
      setGame(newGame);
      setMoves(nextMoves);

      // Check if puzzle is complete
      if (nextMoves.length === puzzle.solution.length) {
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
            setStatus('incorrect');
            setFeedback(`Puzzle failed. Your puzzle rating dropped by 25. Score: ${result.score}/100.`);
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
    [moves, puzzle, startTime, hintsUsed, onComplete, status]
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
  const movesRemaining = puzzle.solution.length - moves.length;
  const progress = (moves.length / puzzle.solution.length) * 100;

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
          <span className="puzzle-turn">♟ {playerColor === 'white' ? 'White to move' : 'Black to move'}</span>
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
          key={`${game.fen()}-${boardVersion}`}
          initialFen={game.fen()}
          onMove={handleMove}
          disabled={status !== 'solving'}
          orientation={playerColor}
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
        <button
          className="btn btn-reset"
          onClick={resetPuzzle}
          disabled={status !== 'solving'}
        >
          🔄 Reset
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

      {/* Feedback */}
      {feedback && (
        <div className={`puzzle-feedback ${status}`}>
          {status === 'correct' && <span className="feedback-icon">✅</span>}
          {status === 'incorrect' && <span className="feedback-icon">❌</span>}
          <span className="feedback-text">{feedback}</span>
        </div>
      )}

      {/* Solution explanation (shown after completion) */}
      {status === 'correct' && (
        <div className="puzzle-explanation">
          <h4>Explanation</h4>
          <p>{puzzle.solutionExplanation}</p>
          <div className="solution-moves">
            <strong>Solution:</strong> {puzzle.solution.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default PuzzleSolver;
