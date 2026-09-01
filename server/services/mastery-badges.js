/**
 * Mastery Badges Service
 * Tracks and awards achievement badges based on user progress and milestones.
 */

import { uid, now } from '../util.js';

let _store = null;
export const setStore = (s) => { _store = s; };
const store = () => {
  if (!_store) throw new Error('Store not initialized - call setStore() first');
  return _store;
};

// Badge definitions with unlock criteria
const BADGE_DEFINITIONS = {
  // Learning milestones
  first_lesson: { name: 'First Steps', emoji: '🎯', description: 'Complete your first lesson', category: 'learning' },
  lesson_streak_3: { name: '3-Day Scholar', emoji: '📚', description: 'Maintain a 3-day learning streak', category: 'streaks' },
  lesson_streak_7: { name: 'Week Warrior', emoji: '🔥', description: 'Maintain a 7-day learning streak', category: 'streaks' },
  lesson_streak_30: { name: 'Month Master', emoji: '⭐', description: 'Maintain a 30-day learning streak', category: 'streaks' },
  lesson_streak_100: { name: 'Century Club', emoji: '💯', description: 'Maintain a 100-day learning streak', category: 'streaks' },
  
  // Practice achievements
  first_practice: { name: 'Hands On', emoji: '✋', description: 'Complete your first practice', category: 'practice' },
  practice_10: { name: 'Practice Makes Progress', emoji: '💪', description: 'Complete 10 practices', category: 'practice' },
  practice_50: { name: 'Dedicated', emoji: '🎖️', description: 'Complete 50 practices', category: 'practice' },
  practice_100: { name: 'Centurion', emoji: '👑', description: 'Complete 100 practices', category: 'practice' },
  
  // Review mastery
  first_review: { name: 'Review Rookie', emoji: '🔄', description: 'Complete your first review', category: 'reviews' },
  review_streak_7: { name: 'Review Habit', emoji: '🌟', description: 'Review 7 days in a row', category: 'reviews' },
  review_50: { name: 'Memory Master', emoji: '🧠', description: 'Complete 50 reviews', category: 'reviews' },
  perfect_review_10: { name: 'Perfect Memory', emoji: '💎', description: 'Score perfect (5) on 10 reviews', category: 'reviews' },
  
  // Skill mastery
  skill_master_1: { name: 'First Mastery', emoji: '🎓', description: 'Master your first skill', category: 'mastery' },
  skill_master_5: { name: 'Expert', emoji: '🏆', description: 'Master 5 skills', category: 'mastery' },
  skill_master_10: { name: 'Polymath', emoji: '🧙', description: 'Master 10 skills', category: 'mastery' },
  
  // Challenge achievements
  first_challenge: { name: 'Challenger', emoji: '⚔️', description: 'Complete your first challenge', category: 'challenges' },
  challenge_streak_3: { name: 'Challenge Hunter', emoji: '🎯', description: 'Complete 3 challenges in a row', category: 'challenges' },
  
  // Goals
  first_goal: { name: 'Goal Setter', emoji: '🎯', description: 'Set your first learning goal', category: 'goals' },
  goal_complete_10: { name: 'Goal Crusher', emoji: '💥', description: 'Complete 10 learning goals', category: 'goals' },
  
  // Special achievements
  early_bird: { name: 'Early Bird', emoji: '🌅', description: 'Complete a lesson before 8 AM', category: 'special' },
  night_owl: { name: 'Night Owl', emoji: '🦉', description: 'Complete a lesson after 10 PM', category: 'special' },
  weekend_warrior: { name: 'Weekend Warrior', emoji: '⚡', description: 'Learn on both Saturday and Sunday', category: 'special' },
};

/**
 * Get all badges for a user
 */
export function getUserBadges(userId) {
  const badges = store().filter('mastery_badges', (b) => b.userId === userId)
    .sort((a, b) => b.earnedAt - a.earnedAt);
  
  return badges.map(b => ({
    ...b,
    definition: BADGE_DEFINITIONS[b.badgeId] || { name: b.badgeId, emoji: '🏅', description: '', category: 'other' }
  }));
}

/**
 * Get badge progress summary
 */
export function getBadgeProgress(userId) {
  const allBadges = store().filter('mastery_badges', (b) => b.userId === userId);
  const earned = allBadges.length;
  const total = Object.keys(BADGE_DEFINITIONS).length;
  
  const byCategory = {};
  const earnedBadges = getUserBadges(userId);
  
  for (const badge of earnedBadges) {
    const cat = badge.definition.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  
  return {
    earned,
    total,
    percentage: Math.round((earned / total) * 100),
    byCategory,
    recentBadges: earnedBadges.slice(0, 5)
  };
}

/**
 * Award a badge to a user
 */
export function awardBadge(userId, badgeId) {
  // Check if already earned
  const existing = store().find('mastery_badges', (b) => b.userId === userId && b.badgeId === badgeId);
  if (existing) return null;
  
  const definition = BADGE_DEFINITIONS[badgeId];
  if (!definition) return null;
  
  const badge = {
    id: uid('badge'),
    userId,
    badgeId,
    earnedAt: now()
  };
  
  store().insert('mastery_badges', badge);
  store().save();
  
  return {
    ...badge,
    definition
  };
}

/**
 * Check and award badges based on user activity
 * This is called after various user actions to see if they've unlocked new badges
 */
export function checkAndAwardBadges(userId) {
  const awarded = [];
  
  // Get user stats
  const stats = store().get('user_stats', userId);
  if (!stats) return awarded;
  
  // Lesson milestones
  if (stats.totalLessonsCompleted >= 1) {
    const badge = awardBadge(userId, 'first_lesson');
    if (badge) awarded.push(badge);
  }
  
  // Practice milestones
  if (stats.totalPracticesCompleted >= 1) {
    const badge = awardBadge(userId, 'first_practice');
    if (badge) awarded.push(badge);
  }
  if (stats.totalPracticesCompleted >= 10) {
    const badge = awardBadge(userId, 'practice_10');
    if (badge) awarded.push(badge);
  }
  if (stats.totalPracticesCompleted >= 50) {
    const badge = awardBadge(userId, 'practice_50');
    if (badge) awarded.push(badge);
  }
  if (stats.totalPracticesCompleted >= 100) {
    const badge = awardBadge(userId, 'practice_100');
    if (badge) awarded.push(badge);
  }
  
  // Review milestones
  if (stats.totalReviewsDone >= 1) {
    const badge = awardBadge(userId, 'first_review');
    if (badge) awarded.push(badge);
  }
  if (stats.totalReviewsDone >= 50) {
    const badge = awardBadge(userId, 'review_50');
    if (badge) awarded.push(badge);
  }
  
  // Streak badges
  if (stats.currentStreak >= 3) {
    const badge = awardBadge(userId, 'lesson_streak_3');
    if (badge) awarded.push(badge);
  }
  if (stats.currentStreak >= 7) {
    const badge = awardBadge(userId, 'lesson_streak_7');
    if (badge) awarded.push(badge);
  }
  if (stats.currentStreak >= 30) {
    const badge = awardBadge(userId, 'lesson_streak_30');
    if (badge) awarded.push(badge);
  }
  if (stats.currentStreak >= 100) {
    const badge = awardBadge(userId, 'lesson_streak_100');
    if (badge) awarded.push(badge);
  }
  
  // Perfect reviews
  const perfectReviews = store().filter('review_schedule', (r) => r.userId === userId && r.lastQuality === 5).length;
  
  if (perfectReviews >= 10) {
    const badge = awardBadge(userId, 'perfect_review_10');
    if (badge) awarded.push(badge);
  }
  
  // Skill mastery count
  const masteredSkills = store().filter('user_mastery', (m) => m.userId === userId && m.masteryLevel >= 0.8).length;
  
  if (masteredSkills >= 1) {
    const badge = awardBadge(userId, 'skill_master_1');
    if (badge) awarded.push(badge);
  }
  if (masteredSkills >= 5) {
    const badge = awardBadge(userId, 'skill_master_5');
    if (badge) awarded.push(badge);
  }
  if (masteredSkills >= 10) {
    const badge = awardBadge(userId, 'skill_master_10');
    if (badge) awarded.push(badge);
  }
  
  // Challenge achievements
  const challenges = store().filter('submissions', (s) => s.userId === userId && s.score >= 70).length;
  if (challenges >= 1) {
    const badge = awardBadge(userId, 'first_challenge');
    if (badge) awarded.push(badge);
  }
  
  // Goals
  const goals = store().filter('learning_goals', (g) => g.userId === userId).length;
  if (goals >= 1) {
    const badge = awardBadge(userId, 'first_goal');
    if (badge) awarded.push(badge);
  }
  
  const completedGoals = store().filter('learning_goals', (g) => g.userId === userId && g.completed === true).length;
  if (completedGoals >= 10) {
    const badge = awardBadge(userId, 'goal_complete_10');
    if (badge) awarded.push(badge);
  }
  
  return awarded;
}

/**
 * Check time-based special badges
 */
export function checkSpecialBadges(userId, timestamp = Date.now()) {
  const awarded = [];
  const date = new Date(timestamp);
  const hour = date.getHours();
  const day = date.getDay();
  
  // Early bird (before 8 AM)
  if (hour < 8) {
    const badge = awardBadge(userId, 'early_bird');
    if (badge) awarded.push(badge);
  }
  
  // Night owl (after 10 PM)
  if (hour >= 22) {
    const badge = awardBadge(userId, 'night_owl');
    if (badge) awarded.push(badge);
  }
  
  // Weekend warrior (check if they learned on both Sat and Sun)
  if (day === 0 || day === 6) { // Saturday or Sunday
    const thisWeekStart = new Date(date);
    thisWeekStart.setDate(date.getDate() - date.getDay()); // Go to Sunday
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const sessions = store().filter('learning_sessions', (s) => s.userId === userId && s.createdAt >= thisWeekStart.getTime());
    
    const hasSaturday = sessions.some(s => new Date(s.createdAt).getDay() === 6);
    const hasSunday = sessions.some(s => new Date(s.createdAt).getDay() === 0);
    
    if (hasSaturday && hasSunday) {
      const badge = awardBadge(userId, 'weekend_warrior');
      if (badge) awarded.push(badge);
    }
  }
  
  return awarded;
}

/**
 * Get available badge definitions
 */
export function getBadgeDefinitions() {
  return BADGE_DEFINITIONS;
}

/**
 * Get next badges user can earn (closest to unlocking)
 */
export function getNextBadges(userId, limit = 5) {
  const stats = store().get('user_stats', userId);
  if (!stats) return [];
  
  const earned = getUserBadges(userId).map(b => b.badgeId);
  const next = [];
  
  // Calculate progress towards unearned badges
  const addIfNotEarned = (badgeId, progress, target) => {
    if (!earned.includes(badgeId)) {
      next.push({
        ...BADGE_DEFINITIONS[badgeId],
        badgeId,
        progress,
        target,
        percentage: Math.min(100, Math.round((progress / target) * 100))
      });
    }
  };
  
  // Lesson milestones
  addIfNotEarned('first_lesson', stats.totalLessonsCompleted || 0, 1);
  
  // Practice milestones
  addIfNotEarned('first_practice', stats.totalPracticesCompleted || 0, 1);
  addIfNotEarned('practice_10', stats.totalPracticesCompleted || 0, 10);
  addIfNotEarned('practice_50', stats.totalPracticesCompleted || 0, 50);
  addIfNotEarned('practice_100', stats.totalPracticesCompleted || 0, 100);
  
  // Review milestones
  addIfNotEarned('first_review', stats.totalReviewsDone || 0, 1);
  addIfNotEarned('review_50', stats.totalReviewsDone || 0, 50);
  
  // Streak badges
  addIfNotEarned('lesson_streak_3', stats.currentStreak || 0, 3);
  addIfNotEarned('lesson_streak_7', stats.currentStreak || 0, 7);
  addIfNotEarned('lesson_streak_30', stats.currentStreak || 0, 30);
  addIfNotEarned('lesson_streak_100', stats.currentStreak || 0, 100);
  
  // Sort by percentage (closest to unlock first)
  next.sort((a, b) => b.percentage - a.percentage);
  
  return next.slice(0, limit);
}
