import { CARD, PANEL_PAD, cn } from "@/lib/utils";
import { PanelHeader } from "./PanelHeader";
import { TrophyIcon } from "./Icons";
import { RecentAchievement } from "@/types/api";

export function RecentAchievements({ achievements = [] }: { achievements?: RecentAchievement[] }) {
  if (achievements.length === 0) {
    return (
      <section aria-labelledby="recent-achievements" className={`${CARD} ${PANEL_PAD}`}>
        <PanelHeader id="recent-achievements" title="Recent achievements" action="View all" actionTo="/profile" />
        <div className="rounded-xl border border-line bg-surface p-4 text-center">
          <p className="text-sm text-muted">Complete proofs to see your achievements here</p>
        </div>
      </section>
    );
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <section aria-labelledby="recent-achievements" className={`${CARD} ${PANEL_PAD}`}>
      <PanelHeader id="recent-achievements" title="Recent achievements" action="View all" actionTo="/profile" />

      <ul className="divide-y divide-line/70">
        {achievements.map((item) => (
          <li key={item.id} className="-mx-2 rounded-lg px-2 transition-colors duration-200 hover:bg-elevated">
            <div className="flex items-center gap-3 py-[11px]">
              <span
                className={cn(
                  "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.045)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)]",
                  "bg-gold-soft"
                )}
              >
                <TrophyIcon className="h-[17px] w-[17px] text-gold" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 truncate text-[12.5px] text-muted">{item.detail || 'Achievement unlocked'}</p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[12.5px] font-bold text-gold">
                  +{item.xp} XP
                </p>
                <p className="mt-0.5 text-[11.5px] text-faint">{formatTimeAgo(item.completedAt)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
