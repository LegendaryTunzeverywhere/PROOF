import { useEffect, useState } from 'react';
import { Reveal } from '../components/Reveal';
import { TrophyIcon } from '../components/Icons';
import { leaderboardService } from '../services/leaderboard.service';
import type { LeaderboardEntry } from '../types/api';

export function LeaderboardPage() {
  const [category, setCategory] = useState('proofs');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; setLoading(true); leaderboardService.getLeaderboard(category).then((data) => active && setEntries(data.entries)).catch(() => active && setEntries([])).finally(() => active && setLoading(false)); return () => { active = false; }; }, [category]);
  return (
    <div className="space-y-6">
      <Reveal>
        <div><h1 className="text-3xl font-bold text-ink">Leaderboard</h1><p className="mt-2 text-base text-muted">See the community’s top proofers</p></div>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><TrophyIcon className="h-8 w-8 text-gold" /><h2 className="text-xl font-semibold text-ink">Top performers</h2></div><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"><option value="proofs">Proofs</option><option value="score">Score</option><option value="xp">XP</option><option value="consistent">Consistency</option><option value="earned">NIM earned</option></select></div>
          {loading ? <div className="flex justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" /></div> : entries.length ? <ol className="mt-4 divide-y divide-line">{entries.map((entry, index) => <li key={entry.username} className="flex items-center gap-3 py-3"><span className="w-7 text-center font-bold text-muted">{entry.rank || index + 1}</span><span className="grid h-9 w-9 place-items-center rounded-full bg-elevated text-lg">{entry.avatar}</span><span className="min-w-0 flex-1 truncate font-semibold text-ink">{entry.username}</span><span className="shrink-0 font-bold text-brand">{entry.value.toLocaleString()}</span></li>)}</ol> : <p className="py-8 text-center text-sm text-muted">No rankings are available yet.</p>}
        </div>
      </Reveal>
    </div>
  );
}
