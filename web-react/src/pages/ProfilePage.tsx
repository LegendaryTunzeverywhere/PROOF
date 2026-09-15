import { useState, useEffect } from 'react';
import { PanelHeader } from '../components/PanelHeader';
import { Reveal } from '../components/Reveal';
import { Achievements } from '../components/Achievements';
import { TrophyIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { xpProgress } from '../lib/progression';
import { userService } from '../services/user.service';
import { badgesService } from '../services/badges.service';
import type { Skill, Badge } from '../types/api';

export function ProfilePage() {
  const { user: authUser, loading: authLoading, updateUser } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [nextBadges, setNextBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setLoading(false);
      return;
    }
    
    loadProfileData();
  }, [authUser, authLoading]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileResult, badgesResult] = await Promise.allSettled([
        userService.getMe(),
        badgesService.getBadges(),
      ]);
      if (profileResult.status === 'rejected') throw profileResult.reason;

      const response = profileResult.value;
      if (response.user) updateUser(response.user);
      setSkills(Array.isArray(response.skills) ? response.skills : []);
      // The API stores badge display fields in `definition`; flatten them for rendering.
      const normalizeBadge = (badge: any, unlocked: boolean): Badge => ({
        ...badge,
        ...(badge.definition || {}),
        id: badge.id || badge.badgeId,
        unlocked,
      });
      if (badgesResult.status === 'fulfilled') {
        const badgesResponse = badgesResult.value;
        const allBadges = (badgesResponse.badges || []).map((badge: any) => normalizeBadge(badge, true));
        setBadges(allBadges);
        setNextBadges((badgesResponse.next || []).map((badge: any) => normalizeBadge(badge, false)));
      } else {
        // Badges are supplementary profile data. Keep the user's progress and
        // account usable if that endpoint or its backing table is unavailable.
        console.warn('Failed to load badges:', badgesResult.reason);
        setBadges([]);
        setNextBadges([]);
      }
    } catch (err: any) {
      console.error('Failed to load profile data:', err);
      setError(err.message || 'Failed to load profile');
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

  if (!authUser) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-muted">Please log in to view your profile</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">Failed to load profile</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <button
          onClick={loadProfileData}
          className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const user = authUser;
  const verifiedSkills = skills.filter((s) => s.verified);
  const inProgressSkills = skills.filter((s) => !s.verified);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const upcomingBadges = nextBadges.slice(0, 3);
  const streak = user.streak || { current: 0, longest: 0, emoji: '', atRisk: false };
  const levelProgress = xpProgress(user.xp || 0, user.level || 1);
  const formatNim = (amount?: number) => Number.isFinite(Number(amount)) ? Number(amount).toFixed(1) : '0.0';
  const skillName = (skill: Skill) => skill.name || skill.skillSlug?.replace(/[-_]/g, ' ') || 'Untitled skill';

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Reveal>
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--brand), var(--brand-deep))',
          }}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl backdrop-blur-sm">
              {user.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/90">
                <span>Level {user.level || 1}</span>
                <span>·</span>
                <span>{(user.xp || 0).toLocaleString()} XP</span>
                <span>·</span>
                <span>{user.reputation || 0} reputation</span>
              </div>

              {/* XP Progress */}
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white/90 transition-all duration-500"
                  style={{ width: `${levelProgress.percent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="text-xl font-bold text-white">{formatNim(user.balanceNim)}</div>
              <div className="text-xs text-white/80">NIM Balance</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="text-xl font-bold text-white">{formatNim(user.earnedNim)}</div>
              <div className="text-xs text-white/80">NIM Earned</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="text-xl font-bold text-white">{verifiedSkills.length}</div>
              <div className="text-xs text-white/80">Skills Verified</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Streak Card */}
      {streak.current > 0 && (
        <Reveal delay={0.05}>
          <div
            className="rounded-2xl border p-5 shadow-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, #FFF 100%)',
              borderColor: 'rgba(34, 197, 94, 0.35)',
            }}
          >
            <div className="flex items-center gap-4">
              {streak.emoji && <div className="text-4xl">{streak.emoji}</div>}
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-bold text-ink">{streak.current}-day streak</h3>
                  {streak.atRisk && (
                    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-bold text-warn">
                      AT RISK
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {streak.atRisk
                    ? 'Complete a lesson today to keep your streak alive!'
                    : `Keep it up! Longest streak: ${streak.longest} days`}
                </p>
              </div>
              <div
                className="text-center"
                style={{
                  minWidth: '60px',
                }}
              >
                <div
                  className="text-3xl font-bold"
                  style={{ color: streak.atRisk ? 'var(--warn)' : 'var(--ok)' }}
                >
                  {streak.current}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Days
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Mastery Badges */}
      <Reveal delay={0.1}>
        <div className="space-y-4">
          <PanelHeader title="Mastery Badges" subtitle={`${unlockedBadges.length} badges earned`} />

          {unlockedBadges.length > 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="grid grid-cols-6 gap-3 sm:grid-cols-8">
                {unlockedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="group relative flex aspect-square items-center justify-center rounded-xl bg-elevated text-3xl transition-all hover:scale-110"
                    title={badge.name}
                  >
                    {badge.emoji}
                  </div>
                ))}
              </div>

              {upcomingBadges.length > 0 && (
                <div className="mt-5 border-t border-line pt-5">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    Next to Unlock
                  </div>
                  <div className="space-y-3">
                    {upcomingBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xl opacity-50">
                          {badge.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-ink">{badge.name}</div>
                          <div className="text-xs text-muted">{badge.description}</div>
                          {badge.progress !== undefined && badge.progress > 0 && (
                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-elevated">
                              <div
                                className="h-full bg-brand transition-all duration-500"
                                style={{ width: `${(badge.progress / 10) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
              <TrophyIcon className="mx-auto mb-3 h-10 w-10 text-gold" />
              <h3 className="text-base font-semibold text-ink">Earn your first badge</h3>
              <p className="mt-1 text-sm text-muted">
                Complete challenges and milestones to unlock badges
              </p>
            </div>
          )}
        </div>
      </Reveal>

      {/* Verified Skills */}
      {verifiedSkills.length > 0 && (
        <Reveal delay={0.15}>
          <div className="space-y-4">
            <PanelHeader 
              title="Verified Skills" 
              subtitle={`${verifiedSkills.length} skill${verifiedSkills.length !== 1 ? 's' : ''} verified`}
            />

            <div className="space-y-3">
              {verifiedSkills.map((skill) => (
                <div
                  key={skill.skillSlug}
                  className="rounded-2xl border border-ok/30 bg-ok/5 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ok-soft text-ok">
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-ink">
                            {skillName(skill)}
                          </h3>
                          <div className="mt-1 text-sm text-muted">
                            {skill.tier} · {skill.proofCount} proofs passed
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-ok">{skill.score}%</div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-ok">
                            Verified
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ok-soft">
                        <div
                          className="h-full bg-ok transition-all duration-500"
                          style={{ width: `${skill.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* In Progress Skills */}
      {inProgressSkills.length > 0 && (
        <Reveal delay={0.2}>
          <div className="space-y-4">
            <PanelHeader 
              title="Skills in Progress" 
              subtitle={`${inProgressSkills.length} skill${inProgressSkills.length !== 1 ? 's' : ''} learning`}
            />

            <div className="space-y-3">
              {inProgressSkills.map((skill) => (
                <div
                  key={skill.skillSlug}
                  className="rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-brand hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-ink">
                        {skillName(skill)}
                      </h3>
                      <div className="mt-1 text-sm text-muted">
                        {skill.tier} · {skill.proofCount} proofs passed
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-brand">{skill.score}%</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full bg-gradient-to-r from-brand to-brand-deep transition-all duration-500"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Recent Achievements */}
      <Reveal delay={0.25}>
        <Achievements />
      </Reveal>
    </div>
  );
}
