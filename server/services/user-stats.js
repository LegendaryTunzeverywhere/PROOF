/**
 * User Stats Service
 * Handles streaks, learning time tracking, and user statistics
 */

import { uid, now } from '../util.js';

let _store = null;
export const setStore = (s) => { _store = s; };
const store = () => {
  if (!_store) throw new Error('Store not initialized - call setStore() first');
  return _store;
};

/**
 * Get user stats (creates if doesn't exist)
 */
export async function getUserStats(userId) {
  let stats = store().get('user_stats', userId);
  
  if (!stats) {
    stats = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      totalLearningMinutes: 0,
      totalReviewsDone: 0,
      totalLessonsCompleted: 0,
      totalPracticesCompleted: 0,
      updatedAt: now()
    };
    
    store().insert('user_stats', stats);
    store().save();
  }
  
  return stats;
}

/**
 * Update streak based on activity
 * Call this whenever a user completes a learning activity
 */
export async function updateStreak(userId) {
  const stats = await getUserStats(userId);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // If already logged activity today, don't update streak
  if (stats.lastActivityDate === today) {
    return stats;
  }
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  // Check if last activity was yesterday (continuing streak)
  if (stats.lastActivityDate === yesterday) {
    stats.currentStreak += 1;
  } 
  // Check if streak was broken (more than 1 day gap)
  else if (stats.lastActivityDate && stats.lastActivityDate !== today) {
    stats.currentStreak = 1; // Reset to 1 (today)
  }
  // First activity ever
  else if (!stats.lastActivityDate) {
    stats.currentStreak = 1;
  }
  
  // Update longest streak if current is higher
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }
  
  stats.lastActivityDate = today;
  stats.updatedAt = now();
  
  store().update('user_stats', userId, {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastActivityDate: stats.lastActivityDate,
    updatedAt: stats.updatedAt
  });
  
  store().save();
  
  // Check for streak achievements
  await checkStreakAchievements(userId, stats.currentStreak);
  
  return stats;
}

/**
 * Add learning time to user stats
 */
export async function addLearningTime(userId, minutes) {
  const stats = await getUserStats(userId);
  
  store().update('user_stats', userId, {
    totalLearningMinutes: stats.totalLearningMinutes + minutes,
    updatedAt: now()
  });
  
  store().save();
  
  return { ...stats, totalLearningMinutes: stats.totalLearningMinutes + minutes };
}

/**
 * Increment lesson completion counter
 */
export async function incrementLessons(userId) {
  await updateStreak(userId); // Update streak on any learning activity
  
  const stats = await getUserStats(userId);
  store().update('user_stats', userId, {
    totalLessonsCompleted: stats.totalLessonsCompleted + 1,
    updatedAt: now()
  });
  
  store().save();
}

/**
 * Increment practice completion counter
 */
export async function incrementPractices(userId) {
  await updateStreak(userId);
  
  const stats = await getUserStats(userId);
  store().update('user_stats', userId, {
    totalPracticesCompleted: stats.totalPracticesCompleted + 1,
    updatedAt: now()
  });
  
  store().save();
}

/**
 * Increment review completion counter
 */
export async function incrementReviews(userId) {
  await updateStreak(userId);
  
  const stats = await getUserStats(userId);
  store().update('user_stats', userId, {
    totalReviewsDone: stats.totalReviewsDone + 1,
    updatedAt: now()
  });
  
  store().save();
}

/**
 * Record a learning session
 */
export async function recordSession(userId, { topicSlug, skillSlug, sessionType, depth = 0, durationSeconds, notes }) {
  const sessionId = uid('sess');
  const nowTs = now();
  
  store().insert('learning_sessions', {
    id: sessionId,
    userId,
    topicSlug,
    skillSlug,
    sessionType,
    depth,
    durationSeconds,
    notes,
    completedAt: nowTs,
    createdAt: nowTs
  });
  
  store().save();
  
  // Update streak
  await updateStreak(userId);
  
  // Add time if provided
  if (durationSeconds) {
    await addLearningTime(userId, Math.round(durationSeconds / 60));
  }
  
  return sessionId;
}

/**
 * Get recent learning sessions
 */
export async function getRecentSessions(userId, limit = 10) {
  const sessions = store().filter('learning_sessions', (s) => s.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  
  return sessions;
}

/**
 * Get learning activity calendar data (for heatmap)
 */
export async function getActivityCalendar(userId, days = 365) {
  const cutoff = now() - (days * 86400000);
  
  const sessions = store().filter('learning_sessions', (s) => s.userId === userId && s.createdAt >= cutoff);
  
  // Group by date
  const byDate = {};
  sessions.forEach((s) => {
    const date = new Date(s.createdAt).toISOString().split('T')[0];
    if (!byDate[date]) {
      byDate[date] = { date, count: 0, totalSeconds: 0 };
    }
    byDate[date].count++;
    byDate[date].totalSeconds += s.durationSeconds || 0;
  });
  
  return Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Check and award streak-based achievements
 */
async function checkStreakAchievements(userId, currentStreak) {
  const milestones = [
    { streak: 3, badge: '3_day_streak', emoji: '🔥', name: '3-Day Fire' },
    { streak: 7, badge: '7_day_streak', emoji: '⚡', name: 'Week Warrior' },
    { streak: 14, badge: '14_day_streak', emoji: '💪', name: 'Two-Week Hero' },
    { streak: 30, badge: '30_day_streak', emoji: '🏆', name: 'Month Master' },
    { streak: 100, badge: '100_day_streak', emoji: '👑', name: 'Century Legend' },
  ];
  
  for (const milestone of milestones) {
    if (currentStreak === milestone.streak) {
      // Award achievement via notification
      const notifId = uid('notif');
      store().insert('notifications', {
        id: notifId,
        userId,
        type: 'achievement',
        emoji: milestone.emoji,
        title: `${milestone.name} Achievement!`,
        body: `You've maintained a ${currentStreak}-day learning streak! Keep it going! 🎉`,
        href: '#/profile',
        read: false,
        createdAt: now()
      });
      store().save();
    }
  }
}

/**
 * Get streak status (for dashboard widgets)
 */
export async function getStreakStatus(userId) {
  const stats = await getUserStats(userId);
  const today = new Date().toISOString().split('T')[0];
  
  // Check if streak is at risk (no activity today)
  const atRisk = stats.lastActivityDate !== today;
  
  return {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastActivityDate: stats.lastActivityDate,
    atRisk,
    emoji: stats.currentStreak >= 30 ? '👑' : stats.currentStreak >= 7 ? '⚡' : stats.currentStreak >= 3 ? '🔥' : '📚'
  };
}

/**
 * Get comprehensive user learning stats
 */
export async function getComprehensiveStats(userId) {
  const stats = await getUserStats(userId);
  const streakStatus = await getStreakStatus(userId);
  const recentSessions = await getRecentSessions(userId, 5);
  
  return {
    ...stats,
    streakStatus,
    recentSessions,
    averageSessionMinutes: stats.totalLessonsCompleted > 0 
      ? Math.round(stats.totalLearningMinutes / stats.totalLessonsCompleted) 
      : 0
  };
}
