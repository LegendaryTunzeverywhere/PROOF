import { useState, useEffect } from 'react';
import { ArrowRightIcon } from './Icons';
import { badgesService } from '@/services/badges.service';
import type { Badge } from '@/types/api';

export function Achievements() {
  const [achievements, setAchievements] = useState<Badge[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const response = await badgesService.getAchievements();
      // Filter to only show unlocked achievements
      const unlockedAchievements = response.achievements.filter(a => a.unlocked);
      setAchievements(unlockedAchievements);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-brand border-t-transparent" />
        </div>
      </div>
    );
  }

  if (achievements.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-[17px] font-bold text-ink">Recent Achievements</h2>
        </div>
        <div className="rounded-xl border border-line bg-elevated p-8 text-center">
          <div className="mb-2 text-4xl">🏆</div>
          <p className="text-sm text-muted">Complete challenges to earn achievements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-6 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-[17px] font-bold text-ink">Recent Achievements</h2>
        <button
          type="button"
          onClick={() => setShowAll((visible) => !visible)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-brand transition-colors hover:text-brand-hover"
        >
          {showAll ? 'View less' : 'View all'}
          {!showAll && <ArrowRightIcon className="h-3.5 w-3.5" />}
        </button>
      </div>

      <ul className="space-y-3">
        {achievements.slice(0, showAll ? undefined : 5).map((achievement) => (
          <li key={achievement.id}>
            <div className="flex items-start gap-4 rounded-xl border border-line bg-elevated p-4 transition-all duration-200 hover:border-brand-soft">
              {/* Icon */}
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-2xl">
                {achievement.emoji}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 text-[14px] font-bold text-ink">{achievement.name}</h3>
                <p className="text-[12.5px] leading-relaxed text-ink-2">{achievement.description}</p>
                {achievement.progress !== undefined && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-brand">
                      {achievement.progress}% complete
                    </span>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

