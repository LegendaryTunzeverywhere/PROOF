/**
 * Spaced Repetition System (SM-2 Algorithm)
 * 
 * Implements the SuperMemo 2 algorithm for optimal review scheduling.
 * Tracks user mastery and schedules reviews based on performance.
 */

import { uid, now } from '../util.js';

let _store = null;
export const setStore = (s) => { _store = s; };
const store = () => {
  if (!_store) throw new Error('Store not initialized - call setStore() first');
  return _store;
};

/**
 * Calculate next review schedule using SM-2 algorithm
 * @param {number} quality - User rating 0-5 (0=total blackout, 5=perfect recall)
 * @param {number} repetitions - Number of successful reviews
 * @param {number} easeFactor - Ease factor (minimum 1.3)
 * @param {number} interval - Days until next review
 */
export function calculateNextReview(quality, repetitions, easeFactor, interval) {
  // Quality < 3 means failed recall - reset
  if (quality < 3) {
    return {
      repetitions: 0,
      interval: 1,
      easeFactor: Math.max(1.3, easeFactor - 0.2)
    };
  }

  // First successful review
  if (repetitions === 0) {
    interval = 1;
  }
  // Second successful review
  else if (repetitions === 1) {
    interval = 6;
  }
  // Subsequent reviews
  else {
    interval = Math.round(interval * easeFactor);
  }

  // Update ease factor based on quality
  const newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  return {
    repetitions: repetitions + 1,
    interval,
    easeFactor: Math.max(1.3, newEaseFactor),
    nextReview: now() + interval * 86400000 // Convert days to milliseconds
  };
}

/**
 * Schedule a new topic for spaced repetition
 */
export async function scheduleReview(userId, { topicSlug, topicTitle, skillSlug }) {
  // Check if already exists
  const existing = store().find('review_schedule', (r) => 
    r.userId === userId && r.topicSlug === topicSlug
  );
  
  if (existing) {
    return existing;
  }

  const reviewId = uid('rev');
  const review = {
    id: reviewId,
    userId,
    topicSlug,
    topicTitle,
    skillSlug,
    repetitions: 0,
    easeFactor: 2.5, // Default starting ease
    interval: 1, // Start with 1 day
    nextReviewAt: now() + 86400000, // Tomorrow
    lastQuality: null,
    lastReviewedAt: null,
    suspended: false,
    suspendedAt: null,
    createdAt: now(),
    updatedAt: now()
  };

  store().insert('review_schedule', review);
  store().save();
  
  return review;
}

/**
 * Record a review completion and calculate next review date
 */
export async function recordReview(userId, reviewId, quality) {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  const review = store().get('review_schedule', reviewId);
  if (!review || review.userId !== userId) {
    throw new Error('Review not found');
  }

  const next = calculateNextReview(
    quality,
    review.repetitions,
    review.easeFactor,
    review.interval
  );

  store().update('review_schedule', reviewId, {
    repetitions: next.repetitions,
    easeFactor: next.easeFactor,
    interval: next.interval,
    nextReviewAt: next.nextReview,
    lastQuality: quality,
    lastReviewedAt: now(),
    updatedAt: now()
  });

  store().save();

  return store().get('review_schedule', reviewId);
}

/**
 * Get all reviews due for a user
 */
export async function getDueReviews(userId, limit = 20) {
  const currentTime = now();
  return store().filter('review_schedule', (r) => 
    r.userId === userId && 
    r.nextReviewAt <= currentTime &&
    !r.suspended
  )
  .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
  .slice(0, limit);
}

/**
 * Get upcoming reviews for a user
 */
export async function getUpcomingReviews(userId, daysAhead = 7) {
  const currentTime = now();
  const futureTime = currentTime + daysAhead * 86400000;
  
  return store().filter('review_schedule', (r) => 
    r.userId === userId && 
    r.nextReviewAt > currentTime && 
    r.nextReviewAt <= futureTime &&
    !r.suspended
  )
  .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
}

/**
 * Get user's review statistics
 */
export async function getReviewStats(userId) {
  const allReviews = store().filter('review_schedule', (r) => r.userId === userId && !r.suspended);
  const dueReviews = await getDueReviews(userId);
  const upcomingReviews = await getUpcomingReviews(userId);

  const masteredTopics = allReviews.filter(r => r.repetitions >= 5 && r.easeFactor >= 2.5).length;
  const strugglingTopics = allReviews.filter(r => r.easeFactor < 2.0).length;

  return {
    totalTopics: allReviews.length,
    dueToday: dueReviews.length,
    upcoming7Days: upcomingReviews.length,
    masteredTopics,
    strugglingTopics,
    averageEaseFactor: allReviews.length > 0 
      ? allReviews.reduce((sum, r) => sum + r.easeFactor, 0) / allReviews.length 
      : 0,
    totalReviews: allReviews.reduce((sum, r) => sum + r.repetitions, 0)
  };
}

/**
 * Get mastery level for a topic (0-100)
 */
export function getMasteryScore(review) {
  if (!review) return 0;

  // Base score from repetitions (0-50)
  const repetitionScore = Math.min(50, review.repetitions * 10);

  // Ease factor contribution (0-30)
  const easeScore = Math.min(30, (review.easeFactor - 1.3) * 15);

  // Recent performance (0-20)
  const qualityScore = review.lastQuality !== null ? review.lastQuality * 4 : 0;

  return Math.min(100, Math.round(repetitionScore + easeScore + qualityScore));
}

/**
 * Get weak areas - topics with low mastery or failed reviews
 */
export async function getWeakAreas(userId, limit = 5) {
  const allReviews = store().filter('review_schedule', (r) => r.userId === userId && !r.suspended);
  
  const withMastery = allReviews.map(r => ({
    ...r,
    masteryScore: getMasteryScore(r)
  }));

  return withMastery
    .filter(r => r.masteryScore < 70 || r.easeFactor < 2.0)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, limit);
}

/**
 * Suspend a review (temporarily remove from schedule)
 */
export async function suspendReview(userId, reviewId) {
  const review = store().get('review_schedule', reviewId);
  if (!review || review.userId !== userId) throw new Error('Review not found');

  store().update('review_schedule', reviewId, {
    suspended: true,
    suspendedAt: now(),
    updatedAt: now()
  });
  
  store().save();
  return store().get('review_schedule', reviewId);
}

/**
 * Resume a suspended review
 */
export async function resumeReview(userId, reviewId) {
  const review = store().get('review_schedule', reviewId);
  if (!review || review.userId !== userId) throw new Error('Review not found');

  store().update('review_schedule', reviewId, {
    suspended: false,
    nextReviewAt: now() + 86400000, // Review tomorrow
    updatedAt: now()
  });
  
  store().save();
  return store().get('review_schedule', reviewId);
}

/**
 * Delete a review schedule
 */
export async function deleteReview(userId, reviewId) {
  const review = store().get('review_schedule', reviewId);
  if (!review || review.userId !== userId) throw new Error('Review not found');
  
  store().remove('review_schedule', reviewId);
  store().save();
}

/**
 * Reset a review schedule (start from beginning)
 */
export async function resetReview(userId, reviewId) {
  const review = store().get('review_schedule', reviewId);
  if (!review || review.userId !== userId) throw new Error('Review not found');

  store().update('review_schedule', reviewId, {
    repetitions: 0,
    easeFactor: 2.5,
    interval: 1,
    nextReviewAt: now() + 86400000,
    lastQuality: null,
    updatedAt: now()
  });
  
  store().save();
  return store().get('review_schedule', reviewId);
}
