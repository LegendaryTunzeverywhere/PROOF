import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { Reveal } from './Reveal';
import { pathsService } from '../services/paths.service';
import type { LearningPath } from '../types/api';

interface PathDetailViewProps {
  pathId: string;
}

export function PathDetailView({ pathId }: PathDetailViewProps) {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPath();
  }, [pathId]);

  const loadPath = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await pathsService.getPath(pathId);
      setPath(response.path);
    } catch (err: any) {
      console.error('Failed to load path:', err);
      setError(err.message || 'Failed to load path');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">Failed to load path</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <Link
          to="/learn"
          className="mt-4 inline-block rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Learning
        </Link>
      </div>
    );
  }

  const getDayIcon = (day: any) => {
    const allDone = day.items.every((i: any) => i.lessonDone || i.attempt);
    if (day.kind === 'final') return '🏆';
    if (day.kind !== 'study') return '🎯';
    if (allDone) return '✅';
    return ['📖', '📗', '📘'][day.index % 3];
  };

  const getItemIcon = (item: any) => {
    if (item.kind === 'study') return item.practiceDone ? '✏️' : '📖';
    if (item.kind === 'final') return '🏆';
    if (item.kind === 'project') return '🛠️';
    return '🎯';
  };

  const firstTopic = path.days.flatMap((day) => day.items).find((item) => item.topic)?.topic || '';
  const languageName = path.skillSlug === 'languages'
    ? ({ fr: 'French', es: 'Spanish', de: 'German', pt: 'Portuguese', zh: 'Mandarin' } as Record<string, string>)[firstTopic.split('-')[0]]
    : undefined;
  const pathTitle = languageName && path.title.startsWith('Languages')
    ? `${languageName} — ${path.level} Path`
    : path.title;

  const studySequence = path.days.flatMap((day: any) =>
    day.items
      .map((item: any, itemIndex: number) => ({ day, item, itemIndex }))
      .filter(({ item }: { item: any }) => item.kind === 'study')
  );
  const isLessonLocked = (dayIndex: number, itemIndex: number, item: any) => {
    if (item.practiceDone) return false;
    const currentIndex = studySequence.findIndex((entry) => entry.day.index === dayIndex && entry.itemIndex === itemIndex);
    return currentIndex > 0 && studySequence.slice(0, currentIndex).some((entry) => !entry.item.practiceDone);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Reveal>
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/learn"
            className="text-sm font-semibold text-muted transition-colors hover:text-brand"
          >
            ← Back to Learning
          </Link>
          <div className="rounded-full bg-gold/10 px-3 py-1 text-sm font-semibold text-gold">
            💰 {path.rewardNim?.toFixed(1) || 0} NIM in this path
          </div>
        </div>
      </Reveal>

      {/* Hero Card */}
      <Reveal delay={0.05}>
        <div
          className="rounded-2xl p-6 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, var(--brand), var(--brand-deep))',
          }}
        >
          <div className="text-4xl">{path.skillEmoji}</div>
          <h1 className="mt-3 text-3xl font-bold text-white">{pathTitle}</h1>
          <p className="mt-2 text-base leading-relaxed text-white/90">{path.description}</p>

          {/* Progress Bar */}
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white/90 transition-all duration-500"
                style={{ width: `${path.percent}%` }}
              />
            </div>
            <div className="text-sm font-bold text-white">{path.percent}%</div>
          </div>

          {/* Metadata */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {path.level}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {path.minutesPerDay} min/day
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
              {path.totalXp} XP total
            </span>
          </div>
        </div>
      </Reveal>

      {/* Days List */}
      <Reveal delay={0.1}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {path.days.length}-Day Skill Path
            </h2>
            <span className="text-sm text-muted">Tap to expand</span>
          </div>

          <div className="space-y-3">
            {path.days.map((day: any) => {
              const allDone = day.items.every((i: any) => i.lessonDone || i.attempt);
              const icon = getDayIcon(day);

              return (
                <details
                  key={day.index}
                  className={`group rounded-2xl border ${
                    allDone ? 'border-ok bg-ok-soft/30' : 'border-line bg-surface'
                  } shadow-sm transition-all`}
                  open={day.index === 1}
                >
                  <summary className="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-elevated">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                        day.kind !== 'study'
                          ? 'bg-gold/10'
                          : allDone
                          ? 'bg-ok-soft'
                          : 'bg-brand-soft'
                      }`}
                    >
                      {icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-ink">
                        Day {day.index} · {day.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span>{day.estMin} min</span>
                        <span>·</span>
                        <span>+{day.xp} XP</span>
                        {day.rewardNim && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-gold">+{day.rewardNim} NIM</span>
                          </>
                        )}
                      </div>
                    </div>
                    {allDone && (
                      <div className="shrink-0 rounded-full bg-ok px-3 py-1 text-xs font-semibold text-white">
                        ✓ Complete
                      </div>
                    )}
                  </summary>

                  {/* Day Items */}
                  <div className="border-t border-line p-4">
                    <div className="space-y-2">
                      {day.items.map((item: any, idx: number) => {
                        const lessonLocked = item.kind === 'study' && isLessonLocked(day.index, idx, item);
                        const status = item.attempt
                          ? item.attempt.status === 'passed'
                            ? 'passed'
                            : 'failed'
                          : item.practiceDone
                          ? 'done'
                          : 'pending';

                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-lg border border-line bg-elevated p-3 transition-all hover:border-brand"
                          >
                            <span className="text-xl">{getItemIcon(item)}</span>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-ink">{item.title}</h4>
                              <div className="mt-0.5 text-xs text-muted">
                                {item.kind === 'study'
                                  ? 'Lesson + practice'
                                  : `${
                                      item.kind === 'final'
                                        ? 'Final assessment'
                                        : item.kind === 'project'
                                        ? 'Project proof'
                                        : 'Proof checkpoint'
                                    } · ${item.estMin} min`}
                                {item.rewardNim && ` · ${item.rewardNim} NIM`}
                              </div>
                            </div>

                            {/* Status Badge */}
                            {status !== 'pending' && (
                              <div
                                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  status === 'passed'
                                    ? 'bg-ok-soft text-ok'
                                    : status === 'done'
                                    ? 'bg-brand-soft text-brand'
                                    : 'bg-bad-soft text-bad'
                                }`}
                              >
                                {status === 'passed'
                                  ? `✓ ${item.attempt.score}`
                                  : status === 'done'
                                  ? '✓'
                                  : '✗'}
                              </div>
                            )}

                            {/* Action Button */}
                            {item.kind === 'study' && lessonLocked ? (
                              <span
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-muted"
                                title="Finish the previous lesson's practice to unlock this lesson"
                              >
                                <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                                Locked
                              </span>
                            ) : item.kind === 'study' ? (
                              <Link
                                to={`/learn/lesson/${pathId}/${path.skillSlug}/${item.topic}?day=${day.index}`}
                                onClick={() => {
                                  const url = `/learn/lesson/${pathId}/${path.skillSlug}/${item.topic}?day=${day.index}`;
                                  console.log('[PathDetailView] Navigating to lesson:', url);
                                  console.log('[PathDetailView] PathId:', pathId, 'Skill:', path.skillSlug, 'Topic:', item.topic);
                                }}
                                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                  item.lessonDone
                                    ? 'bg-elevated text-ink hover:bg-surface-2'
                                    : 'bg-brand text-white hover:bg-brand-deep'
                                }`}
                              >
                                {item.lessonDone ? 'Review' : 'Learn'}
                              </Link>
                            ) : (
                              <Link
                                to={`/prove/challenge/${item.challengeId}?fromPath=${pathId}`}
                                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                                  item.attempt?.status === 'passed'
                                    ? 'bg-elevated text-ink hover:bg-surface-2'
                                    : 'bg-gold text-white hover:bg-gold/90'
                                }`}
                              >
                                {item.attempt
                                  ? item.attempt.status === 'passed'
                                    ? 'Review'
                                    : 'Retry'
                                  : 'Start proof'}
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
