import { useEffect, useMemo, useState } from 'react';
import { Reveal } from '../components/Reveal';
import { TrophyIcon } from '../components/Icons';
import { leaderboardService } from '../services/leaderboard.service';
import type { LeaderboardEntry } from '../types/api';

const PAGE_SIZE = 10;

export function LeaderboardPage() {
  const [category, setCategory] = useState('xp');
  const [page, setPage] = useState(1);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    leaderboardService.getLeaderboard(category, page, PAGE_SIZE)
      .then((data) => {
        if (!active) return;
        setEntries(data.entries ?? []);
        setTotalEntries(data.total ?? data.entries?.length ?? 0);
      })
      .catch(() => {
        if (!active) return;
        setEntries([]);
        setTotalEntries(0);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [category, page]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalEntries / PAGE_SIZE)), [totalEntries]);
  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    const start = Math.max(1, Math.min(page - 2, totalPages - maxVisible + 1));
    const end = Math.min(totalPages, start + maxVisible - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">Leaderboard</h1>
          <p className="mt-2 text-base text-muted">See the community’s top proofers</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TrophyIcon className="h-8 w-8 text-gold" />
              <h2 className="text-xl font-semibold text-ink">Top performers</h2>
            </div>

            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              <option value="xp">XP</option>
              <option value="streak">Streak</option>
              <option value="proofs">Proofs</option>
              <option value="score">Score</option>
              <option value="consistent">Consistency</option>
              <option value="earned">NIM earned</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
          ) : entries.length ? (
            <>
              <ol className="mt-4 divide-y divide-line">
                {entries.map((entry, index) => {
                  const unit = category === 'xp'
                    ? 'XP'
                    : category === 'streak'
                      ? (entry.value === 1 ? 'day' : 'days')
                      : category === 'earned'
                        ? 'NIM'
                        : '';

                  return (
                    <li key={`${entry.userId ?? entry.username}-${entry.rank ?? index}`} className="flex items-center gap-3 py-3">
                      <span className="w-7 text-center font-bold text-muted">{entry.rank || index + 1}</span>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-elevated text-lg">{entry.avatar}</span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-ink">{entry.username}</span>
                      <span className="shrink-0 font-bold text-brand">{entry.value.toLocaleString()} {unit}</span>
                    </li>
                  );
                })}
              </ol>

              {totalPages > 1 && (
                <nav className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-line pt-4">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Prev
                  </button>

                  {pageNumbers.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-sm font-medium ${page === pageNumber ? 'bg-brand text-white' : 'border border-line bg-surface text-ink'}`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted">No rankings are available yet.</p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
