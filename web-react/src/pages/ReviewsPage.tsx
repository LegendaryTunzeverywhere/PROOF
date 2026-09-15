import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PanelHeader } from '../components/PanelHeader';
import { Reveal } from '../components/Reveal';
import { useAuth } from '../context/AuthContext';
import { reviewsService } from '../services/reviews.service';
import type { Review } from '../types/api';

export function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    
    loadReviews();
  }, [user?.id, authLoading]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reviewsService.getDueReviews();
      setReviews(response.reviews);
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
      setError(err.message || 'Failed to load reviews');
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
        <p className="text-muted">Please log in to view your reviews</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
        <p className="font-semibold text-bad">Failed to load reviews</p>
        <p className="mt-2 text-sm text-bad">{error}</p>
        <button
          onClick={loadReviews}
          className="mt-4 rounded-lg bg-bad px-4 py-2 text-sm font-semibold text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const now = Date.now();
  const dueToday = reviews.filter((r) => r.nextReviewAt <= now);

  const masteredCount = reviews.filter(r => r.repetitions >= 5).length;
  const learningCount = reviews.filter(r => r.repetitions > 0 && r.repetitions < 5).length;
  const strugglingCount = reviews.filter(r => r.easeFactor < 2.0).length;

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <h1 className="text-3xl font-bold text-ink">Reviews</h1>
          <p className="mt-2 text-base text-muted">
            Reinforce your knowledge with spaced repetition
          </p>
        </div>
      </Reveal>

      {/* Stats Card */}
      <Reveal delay={0.05}>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-2xl">
              📚
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-ink">Your Review Queue</h2>
              <p className="mt-1 text-sm text-muted">
                {dueToday.length} due today · {reviews.length} total reviews
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-ok-soft p-3 text-center">
                  <div className="text-xl font-bold text-ok">{masteredCount}</div>
                  <div className="text-xs text-ok">Mastered</div>
                </div>
                <div className="rounded-lg bg-brand-soft p-3 text-center">
                  <div className="text-xl font-bold text-brand">{learningCount}</div>
                  <div className="text-xs text-brand">Learning</div>
                </div>
                <div className="rounded-lg bg-warn-soft p-3 text-center">
                  <div className="text-xl font-bold text-warn">{strugglingCount}</div>
                  <div className="text-xs text-warn">Struggling</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Due Today Section */}
      {dueToday.length > 0 ? (
        <Reveal delay={0.1}>
          <div className="space-y-4">
            <PanelHeader title="Due Today" subtitle={`${dueToday.length} review${dueToday.length !== 1 ? 's' : ''} waiting`} />

            <div className="space-y-3">
              {dueToday.map((review) => {
                const daysOverdue = Math.floor((now - review.nextReviewAt) / 86400000);
                const isOverdue = daysOverdue > 0;
                
                return (
                  <Link
                    key={review.id}
                    to={`/reviews/${review.id}`}
                    className="block rounded-2xl border border-line bg-surface p-4 shadow-sm transition-all hover:border-brand hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-xl">
                        📝
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-ink">{review.topicTitle}</h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                            {review.skillSlug.replace(/-/g, ' ')}
                          </span>
                          <span>·</span>
                          <span>{review.repetitions} repetitions</span>
                          <span>·</span>
                          <span>Ease: {review.easeFactor.toFixed(1)}</span>
                        </div>
                        {isOverdue && (
                          <div className="mt-2 text-sm font-medium text-warn">⚠️ {daysOverdue}d overdue</div>
                        )}
                      </div>
                      <div className="shrink-0 text-sm font-medium text-brand">Review →</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
            <div className="mb-3 text-4xl">✨</div>
            <h3 className="text-lg font-semibold text-ink">All caught up!</h3>
            <p className="mt-2 text-sm text-muted">
              No reviews due today. Keep learning to add more topics to your review queue.
            </p>
            <Link
              to="/learn"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-deep"
            >
              Continue Learning
            </Link>
          </div>
        </Reveal>
      )}
    </div>
  );
}
