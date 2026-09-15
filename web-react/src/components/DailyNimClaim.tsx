import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { HexCoinIcon } from './Icons';

type DailyClaim = {
  claimed: boolean;
  eligible: boolean;
  amountNim: number;
  streak: number;
  activity: string | null;
};

function activityLabel(activity: string | null) {
  if (activity === 'proof') return 'a proof';
  if (activity === 'quiz') return 'a quiz';
  if (activity === 'practice') return 'practice';
  return 'a lesson';
}

export function DailyNimClaim() {
  const [claim, setClaim] = useState<DailyClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClaim = async () => {
    try {
      setLoading(true);
      const data = await api.get<DailyClaim>('/api/rewards/daily');
      setClaim(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Daily claim unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaim();
  }, []);

  const handleClaim = async () => {
    try {
      setClaiming(true);
      setError(null);
      const result = await api.post<DailyClaim>('/api/rewards/daily/claim', {});
      setClaim({ ...result, claimed: true, eligible: false });
    } catch (err: any) {
      setError(err.message || 'Unable to claim today');
      await loadClaim();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gold/30 bg-gold-soft/40 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
          <HexCoinIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Daily NIM</h2>
              <p className="mt-1 text-sm text-muted">
                {loading
                  ? 'Checking today\'s learning activity...'
                  : claim?.claimed
                  ? `Claimed ${claim.amountNim.toFixed(1)} NIM today`
                  : claim?.eligible
                  ? `Day ${claim.streak} reward ready`
                  : `Complete ${activityLabel(claim?.activity || null)} to unlock today\'s claim`}
              </p>
            </div>
            <span className="shrink-0 text-lg font-bold text-gold">
              {claim ? `${claim.amountNim.toFixed(1)} NIM` : '0.1 NIM'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
            <span>Builds by 0.1 NIM each active day</span>
            {!loading && claim?.claimed && <span className="font-semibold text-ok">Claimed</span>}
          </div>

          {!loading && !claim?.claimed && (
            <button
              type="button"
              onClick={handleClaim}
              disabled={!claim?.eligible || claiming}
              className="mt-4 w-full rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {claiming ? 'Claiming...' : `Claim ${claim?.amountNim.toFixed(1) || '0.1'} NIM`}
            </button>
          )}

          {error && <p className="mt-3 text-xs font-medium text-bad">{error}</p>}
        </div>
      </div>
    </section>
  );
}
