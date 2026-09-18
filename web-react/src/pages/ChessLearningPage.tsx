import { useEffect, useState } from 'react';
import { PuzzleSolver } from '@/components/chess/PuzzleSolver';
import { ProgressDashboard } from '@/components/chess/ProgressDashboard';
import { RepertoireManager } from '@/components/chess/RepertoireManager';
import { PositionAnalyzer } from '@/components/chess/PositionAnalyzer';
import { puzzleApi } from '@/services/chess';
import type { ChessDifficulty, ChessPuzzle, ChessTheme } from '@/types/chess';

const DIFFICULTIES: Array<{ value: ChessDifficulty | ''; label: string }> = [
  { value: '', label: 'Any level' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const THEMES: Array<{ value: ChessTheme | ''; label: string }> = [
  { value: '', label: 'Any theme' },
  { value: 'fork', label: 'Forks' },
  { value: 'pin', label: 'Pins' },
  { value: 'skewer', label: 'Skewers' },
  { value: 'discovery', label: 'Discovered attacks' },
  { value: 'back-rank', label: 'Back rank' },
  { value: 'double-attack', label: 'Double attacks' },
];

type View = 'practice' | 'coach' | 'progress' | 'repertoire';

export function ChessLearningPage() {
  const [view, setView] = useState<View>('practice');
  const [difficulty, setDifficulty] = useState<ChessDifficulty | ''>('');
  const [theme, setTheme] = useState<ChessTheme | ''>('');
  const [puzzles, setPuzzles] = useState<ChessPuzzle[]>([]);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPuzzles = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await puzzleApi.getRandom({
        difficulty: difficulty || undefined,
        theme: theme || undefined,
        limit: 8,
      });
      setPuzzles(next);
      setPuzzleIndex(0);
      if (next.length === 0) setError('The chess catalog is empty. Add the puzzle seed or import a puzzle corpus to begin.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load puzzles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPuzzles();
  }, [difficulty, theme]);

  const puzzle = puzzles[puzzleIndex];

  return (
    <div className="mx-auto w-full max-w-[1180px] pb-10">
      <header className="mb-6 rounded-[22px] border border-line bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand">Learn by doing</p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Chess practice room</h1>
            <p className="mt-3 text-[15px] leading-7 text-ink-soft">
              Solve one position, understand the idea, then carry it into your next proof. Your progress is saved as you practice.
            </p>
          </div>
          <div className="rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand">
            <div className="font-bold">A focused session</div>
            <div className="mt-1 text-brand/75">{puzzles.length || 0} positions in this set</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-4" role="tablist" aria-label="Chess learning views">
          {[
            ['practice', 'Puzzle practice'],
            ['coach', 'Ask the coach'],
            ['progress', 'My progress'],
            ['repertoire', 'Opening notebook'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value as View)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${view === value ? 'bg-brand text-white' : 'bg-elevated text-ink-soft hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {view === 'practice' && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0 rounded-[22px] border border-line bg-surface p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-ink">Today&apos;s positions</h2>
                <p className="mt-1 text-sm text-muted">Find the strongest move. The board will answer with the opponent&apos;s reply.</p>
              </div>
              <button type="button" onClick={() => void loadPuzzles()} className="rounded-xl border border-line px-3 py-2 text-sm font-bold text-ink-soft hover:bg-elevated hover:text-ink">
                New set
              </button>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted">
                Level
                <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as ChessDifficulty | '')} className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-ink">
                  {DIFFICULTIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold uppercase tracking-wide text-muted">
                Motif
                <select value={theme} onChange={(event) => setTheme(event.target.value as ChessTheme | '')} className="mt-1.5 w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-ink">
                  {THEMES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            {loading && <div className="grid min-h-[420px] place-items-center rounded-2xl bg-elevated text-sm font-semibold text-muted">Loading a fresh position...</div>}
            {!loading && error && <div className="rounded-2xl bg-bad-soft p-5 text-sm font-semibold text-bad">{error}</div>}
            {!loading && !error && puzzle && (
              <>
                <PuzzleSolver key={puzzle.id} puzzle={puzzle} onComplete={() => undefined} />
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm text-muted">
                  <span>Position {puzzleIndex + 1} of {puzzles.length}</span>
                  <button type="button" disabled={puzzleIndex >= puzzles.length - 1} onClick={() => setPuzzleIndex((index) => index + 1)} className="rounded-xl bg-ink px-4 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                    Next position
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="h-fit rounded-[22px] border border-line bg-surface p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-gold">Coach&apos;s note</p>
            <h2 className="mt-2 text-lg font-extrabold text-ink">Look for forcing moves first</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Checks, captures, and threats narrow the board quickly. After each puzzle, name the idea before moving on.</p>
            <div className="mt-5 border-t border-line pt-4 text-sm text-muted">Hints are available when you need a nudge. Your solved positions appear in My progress.</div>
          </aside>
        </div>
      )}

      {view === 'progress' && <ProgressDashboard />}
      {view === 'coach' && (
        <section className="rounded-[22px] border border-line bg-surface p-4 shadow-sm sm:p-6">
          <div className="mb-5 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Learn from the position</p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink">Play a move, then ask the coach</h2>
            <p className="mt-2 text-sm leading-6 text-ink-soft">Experiment on the board and let the engine explain the tactical story. Use this after a puzzle to understand why the solution works.</p>
          </div>
          <PositionAnalyzer initialFen={puzzle?.position?.fen} />
        </section>
      )}
      {view === 'repertoire' && <RepertoireManager />}
    </div>
  );
}

export default ChessLearningPage;
