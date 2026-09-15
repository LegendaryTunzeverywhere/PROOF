import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reviewsService } from '../services/reviews.service';
import type { Review } from '../types/api';

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [review, setReview] = useState<Review | null>(null);
  const [remainingCount, setRemainingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/reviews');
      return;
    }
    
    loadReview();
  }, [id, user, authLoading]);

  const loadReview = async () => {
    if (!id) {
      navigate('/reviews');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await reviewsService.getDueReviews();
      const currentReview = response.reviews.find((r: Review) => r.id === id);
      
      if (!currentReview) {
        setError('Review not found');
        return;
      }

      setReview(currentReview);
      setRemainingCount(response.reviews.length);
    } catch (err: any) {
      console.error('Failed to load review:', err);
      setError(err.message || 'Failed to load review');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealContent = () => {
    setShowContent(true);
  };

  const handleChoiceSelect = (index: number) => {
    if (answerSubmitted) return;
    setSelectedChoice(index);
    setAnswerSubmitted(true);
  };

  const handleQualityRating = async (quality: number) => {
    if (!review || submitting) return;

    try {
      setSubmitting(true);
      const response = await reviewsService.submitReview(review.id, quality);
      setResult(response);
      setCompleted(true);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
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
    return null;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-bad bg-bad-soft p-8 text-center">
          <div className="mb-4 text-4xl">❓</div>
          <h2 className="text-xl font-bold text-bad">Review not found</h2>
          <p className="mt-2 text-sm text-bad">{error}</p>
          <Link
            to="/reviews"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-bad px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to Reviews
          </Link>
        </div>
      </div>
    );
  }

  if (!review) {
    return null;
  }

  if (completed && result) {
    const nextReviewDays = result.review.interval;
    const nextDate = new Date(result.review.nextReviewAt).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    const quality = result.review.lastQuality;

    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl">
            {quality >= 4 ? '✨' : quality >= 2 ? '💪' : '📖'}
          </div>
          <h2 className="text-2xl font-bold text-ink">Review complete!</h2>
          <p className="mt-2 text-base text-muted">
            Next review: <span className="font-semibold text-ink">{nextDate}</span> ({nextReviewDays} day{nextReviewDays !== 1 ? 's' : ''})
          </p>
          
          <div className="mx-auto mt-6 max-w-xs rounded-xl bg-elevated p-4">
            <div className="text-3xl font-bold text-brand">{result.review.repetitions}</div>
            <div className="text-sm text-muted">Total reviews</div>
          </div>

          {remainingCount > 1 ? (
            <>
              <Link
                to="/reviews"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Continue reviews ({remainingCount - 1} left)
              </Link>
              <Link
                to="/learn"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-base font-semibold text-ink transition-colors hover:bg-elevated"
              >
                Back to learning
              </Link>
            </>
          ) : (
            <>
              <div className="mt-6 rounded-xl border border-ok bg-ok-soft p-4">
                <div className="font-semibold text-ok">All done! ✅</div>
                <div className="mt-1 text-sm text-ok">You've completed all reviews for today.</div>
              </div>
              <Link
                to="/learn"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
              >
                Back to learning
              </Link>
            </>
          )}
          <Link
            to="/reviews"
            className="mt-3 inline-block text-sm font-medium text-brand hover:text-brand-deep"
          >
            View all reviews
          </Link>
        </div>
      </div>
    );
  }

  const qualityOptions = [
    { value: 5, label: 'Perfect', desc: 'Instant recall, no hesitation', color: 'var(--ok-deep)' },
    { value: 4, label: 'Good', desc: 'Correct after some thought', color: 'var(--ok)' },
    { value: 3, label: 'Fair', desc: 'Difficult but eventually remembered', color: 'var(--brand)' },
    { value: 2, label: 'Hard', desc: 'Struggled significantly', color: 'var(--warn)' },
    { value: 1, label: 'Wrong', desc: 'Incorrect answer', color: 'var(--bad)' },
    { value: 0, label: 'Forgot', desc: 'Complete blackout', color: 'var(--bad-deep)' },
  ];

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/reviews"
          className="flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          ← Reviews
        </Link>
        <div className="rounded-full bg-elevated px-3 py-1 text-xs font-medium text-muted">
          {review.repetitions} reviews · EF {review.easeFactor.toFixed(1)}
        </div>
      </div>

      {/* Review Card */}
      <div className="rounded-2xl border border-line bg-surface p-8 text-center shadow-lg" style={{ minHeight: '300px' }}>
        <div className="mx-auto mb-4 w-fit rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
          {review.skillSlug.replace(/-/g, ' ')}
        </div>
        
        <h1 className="mb-4 text-2xl font-bold text-ink">{review.topicTitle}</h1>
        <p className="text-base text-muted">How well do you remember this topic?</p>
        
        {showContent && (
          <div className="mt-6 space-y-4 text-left">
            {/* Question Section */}
            {review.question && (
              <div className="rounded-xl border border-brand-soft bg-brand-soft/20 p-4">
                <div className="mb-2 font-semibold text-ink">Try to answer from memory first:</div>
                <div className="mb-3 text-sm text-ink-2">{review.question.q}</div>
                <div className="space-y-2">
                  {review.question.choices.map((choice, index) => {
                    const isCorrect = index === review.question!.answerIdx;
                    const isSelected = selectedChoice === index;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleChoiceSelect(index)}
                        disabled={answerSubmitted}
                        className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                          answerSubmitted
                            ? isCorrect
                              ? 'border-ok bg-ok-soft text-ok'
                              : isSelected
                              ? 'border-bad bg-bad-soft text-bad'
                              : 'border-line bg-elevated text-muted'
                            : 'border-line bg-elevated text-ink hover:border-brand hover:bg-brand-soft'
                        }`}
                      >
                        <span className="font-medium">{'ABCD'[index]}.</span> {choice}
                        {answerSubmitted && isCorrect && ' ✓'}
                        {answerSubmitted && isSelected && !isCorrect && ' ✗'}
                      </button>
                    );
                  })}
                </div>
                {answerSubmitted && review.question.why && (
                  <div className="mt-3 rounded-lg bg-elevated p-3 text-xs text-muted">
                    {review.question.why}
                  </div>
                )}
              </div>
            )}

            {/* Prompt Section */}
            {review.prompt && (
              <div className="rounded-xl border border-brand-soft bg-brand-soft/20 p-4">
                <div className="mb-2 font-semibold text-ink">Say it in your own words:</div>
                <div className="mb-3 text-sm text-ink-2">{review.prompt}</div>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type or say your answer before rating yourself…"
                  className="w-full rounded-lg border border-line bg-surface p-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
                  rows={3}
                />
              </div>
            )}

            <div className="text-xs text-muted">
              Recall first, <em>then</em> rate how well you remembered. The struggle is the point — it is how memories strengthen.
            </div>
          </div>
        )}

        {!showContent && (
          <button
            onClick={handleRevealContent}
            className="mx-auto mt-6 max-w-sm rounded-lg bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-deep"
          >
            Show answer
          </button>
        )}
      </div>

      {/* Quality Rating Section */}
      {showContent && (
        <div className="mt-6 space-y-3">
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Rate Your Recall</div>
          </div>
          <div className="space-y-2">
            {qualityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleQualityRating(option.value)}
                disabled={submitting}
                className="group w-full rounded-xl border border-line bg-surface p-4 text-left transition-all hover:border-brand hover:shadow-md disabled:opacity-50"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-bold text-white"
                    style={{ backgroundColor: option.color }}
                  >
                    {option.value}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-ink">{option.label}</div>
                    <div className="text-sm text-muted">{option.desc}</div>
                  </div>
                  <div className="text-xl transition-transform group-hover:translate-x-1" style={{ color: option.color }}>
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
