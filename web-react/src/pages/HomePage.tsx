import { useState, useEffect } from 'react';
import { HeroBanner } from '../components/HeroBanner';
import { TodaysProof } from '../components/TodaysProof';
import { ContinueLearning } from '../components/ContinueLearning';
import { RecentAchievements } from '../components/RecentAchievements';
import { SkillsBuilding } from '../components/SkillsBuilding';
import { TrendingProofs } from '../components/TrendingProofs';
import { Recommended } from '../components/Recommended';
import { Sponsored } from '../components/Sponsored';
import { Reveal } from '../components/Reveal';
import { PanelHeader } from '../components/PanelHeader';
import { useAuth } from '../context/AuthContext';
import { homeService } from '../services/home.service';
import type { HomeResponse } from '../types/api';
import { xpProgress } from '../lib/progression';

export function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const [homeData, setHomeData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadHomeData();
  }, [user?.id, authLoading]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await homeService.getHome();
      setHomeData(data);
    } catch (err: any) {
      console.error('Failed to load home data:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-muted">Please log in to view your dashboard</p>
      </div>
    );
  }

  if (error || !homeData) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">Failed to load dashboard</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <button
          onClick={loadHomeData}
          className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const lifetimeXp = Number(homeData.user.totalXpEarned ?? homeData.user.xpEarned ?? homeData.user.xp ?? 0);
  const xp = homeData.user.xp || 0;
  const level = homeData.user.level || 1;
  const levelProgress = xpProgress(xp, level);
  const xpToNextLevel = Math.max(0, levelProgress.nextLevelXp - xp);

  return (
    <>
      <HeroBanner />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-[minmax(0,1.34fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          {homeData.continueLearning && (
            <Reveal>
              <ContinueLearning path={homeData.continueLearning} />
            </Reveal>
          )}
          
          {/* today's proof moves above the fold on small screens */}
          <Reveal delay={50} className="lg:hidden">
            <TodaysProof id="todays-proof-mobile" challenge={homeData.daily} />
          </Reveal>
          
          <Reveal delay={70}>
            <SkillsBuilding skills={homeData.mySkills} />
          </Reveal>
          
          {/* Your Progress Panel */}
          <Reveal delay={90}>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <PanelHeader title="Your Progress" action="Details" actionTo="/profile" />
              <div className="mt-4 flex items-center gap-4 sm:gap-5">
                {/* Progress Ring */}
                <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                  <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--line)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--brand)"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - levelProgress.percent / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-ink">{Math.round(levelProgress.percent)}%</span>
                  </div>
                </div>

                {/* Level Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="text-base font-semibold text-ink">Level {level}</div>
                    <div className="text-sm font-semibold tabular-nums text-ink">{lifetimeXp.toLocaleString()} <span className="font-normal text-muted">total XP</span></div>
                  </div>
                  <div className="mt-1.5 text-sm text-muted">
                    {xpToNextLevel.toLocaleString()} XP to Level {level + 1}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-500"
                      style={{ width: `${levelProgress.percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          
          <Reveal delay={110}>
            <Recommended skills={homeData.recommendedSkills} />
          </Reveal>
          
          <Reveal delay={150}>
            <TrendingProofs skills={homeData.trending} />
          </Reveal>
        </div>

        <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
          <Reveal delay={40} className="hidden lg:block">
            <TodaysProof challenge={homeData.daily} />
          </Reveal>
          
          <Reveal delay={80}>
            <RecentAchievements achievements={homeData.recentAchievements} />
          </Reveal>
          
          <Reveal delay={120}>
            <Sponsored challenges={homeData.sponsored} />
          </Reveal>

          {/* Community Discovery Panel */}
          <Reveal delay={140}>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <PanelHeader title="Alive on PROOF" action="Leaderboard" actionTo="/leaderboard" />
              
              <div className="mt-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Top Proofers
                </div>
                {homeData.discovery.topProofers.slice(0, 3).map((topUser, i) => (
                  <button
                    key={topUser.username}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-elevated"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                      {i + 1}
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-elevated text-lg">
                      {topUser.avatar}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="truncate text-sm font-medium text-ink">{topUser.username}</div>
                    </div>
                    <div className="text-sm font-semibold text-brand">{topUser.value}</div>
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </>
  );
}
