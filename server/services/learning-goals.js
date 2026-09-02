/**
 * Learning Goals Service
 * Handles weekly/monthly learning targets and progress tracking
 */

import { uid, now } from '../util.js';

let _store = null;
export const setStore = (s) => { _store = s; };
const store = () => {
  if (!_store) throw new Error('Store not initialized - call setStore() first');
  return _store;
};

/**
 * Create a new learning goal
 */
export async function createGoal(userId, { goalType, targetValue, period = 'weekly' }) {
  const nowTs = now();
  
  // Calculate start and end dates based on period
  let startsAt, endsAt;
  const today = new Date();
  
  if (period === 'daily') {
    startsAt = new Date(today.setHours(0, 0, 0, 0)).getTime();
    endsAt = new Date(today.setHours(23, 59, 59, 999)).getTime();
  } else if (period === 'weekly') {
    // Start from Monday of current week
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startsAt = new Date(today.setDate(today.getDate() - daysToMonday)).setHours(0, 0, 0, 0);
    endsAt = new Date(startsAt + 7 * 86400000 - 1).getTime();
  } else if (period === 'monthly') {
    startsAt = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0).getTime();
    endsAt = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  }
  
  const goalId = uid('goal');
  
  const goal = {
    id: goalId,
    userId,
    goalType,
    targetValue,
    currentValue: 0,
    period,
    startsAt,
    endsAt,
    completed: false,
    completedAt: null,
    createdAt: nowTs
  };
  
  store().insert('learning_goals', goal);
  store().save();
  
  return goal;
}

/**
 * Get user's active goals
 */
export async function getActiveGoals(userId) {
  const nowTs = now();
  
  const filtered = await store().filter('learning_goals', (g) => 
    g.userId === userId && 
    g.endsAt >= nowTs &&
    !g.completed
  );
  
  return filtered.sort((a, b) => a.endsAt - b.endsAt);
}

/**
 * Get all goals (active + completed)
 */
export async function getAllGoals(userId, limit = 20) {
  const filtered = await store().filter('learning_goals', (g) => g.userId === userId);
  const goals = filtered
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
  
  return goals;
}

/**
 * Update goal progress
 */
export async function updateGoalProgress(userId, goalType, increment = 1) {
  const activeGoals = await getActiveGoals(userId);
  
  for (const goal of activeGoals) {
    if (goal.goalType === goalType) {
      const newValue = goal.currentValue + increment;
      
      store().update('learning_goals', goal.id, {
        currentValue: newValue,
        completed: newValue >= goal.targetValue,
        completedAt: newValue >= goal.targetValue ? now() : null
      });
      
      // Send notification if goal completed
      if (newValue >= goal.targetValue && !goal.completed) {
        const notifId = uid('notif');
        store().insert('notifications', {
          id: notifId,
          userId,
          type: 'goal_complete',
          emoji: '🎯',
          title: 'Goal completed!',
          body: `You've completed your ${periodToLabel(goal.period)} goal: ${goalTypeToLabel(goalType)} (${goal.targetValue})`,
          href: '#/profile',
          read: false,
          createdAt: now()
        });
      }
    }
  }
  
  store().save();
}

/**
 * Delete a goal
 */
export async function deleteGoal(userId, goalId) {
  const goal = store().get('learning_goals', goalId);
  
  if (!goal || goal.userId !== userId) {
    throw new Error('Goal not found');
  }
  
  store().remove('learning_goals', goalId);
  store().save();
  
  return true;
}

/**
 * Get goal progress summary
 */
export async function getGoalSummary(userId) {
  const activeGoals = await getActiveGoals(userId);
  const allGoals = await getAllGoals(userId);
  
  const completed = allGoals.filter(g => g.completed).length;
  const total = allGoals.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Calculate streaks (consecutive periods with completed goals)
  let currentGoalStreak = 0;
  let longestGoalStreak = 0;
  let tempStreak = 0;
  
  const weeklyGoals = allGoals
    .filter(g => g.period === 'weekly')
    .sort((a, b) => b.endsAt - a.endsAt);
  
  for (let i = 0; i < weeklyGoals.length; i++) {
    if (weeklyGoals[i].completed) {
      tempStreak++;
      if (i === 0) currentGoalStreak = tempStreak;
      if (tempStreak > longestGoalStreak) longestGoalStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }
  
  return {
    activeGoals: activeGoals.length,
    completedGoals: completed,
    totalGoals: total,
    completionRate,
    currentGoalStreak,
    longestGoalStreak,
    goals: activeGoals
  };
}

/**
 * Create default weekly goals for new users
 */
export async function createDefaultGoals(userId) {
  // Create 3 default weekly goals
  await createGoal(userId, {
    goalType: 'weekly_lessons',
    targetValue: 5,
    period: 'weekly'
  });
  
  await createGoal(userId, {
    goalType: 'weekly_practices',
    targetValue: 3,
    period: 'weekly'
  });
  
  await createGoal(userId, {
    goalType: 'daily_minutes',
    targetValue: 30,
    period: 'daily'
  });
  
  return await getActiveGoals(userId);
}

/**
 * Check and create goals for new period if needed
 */
export async function checkAndRenewGoals(userId) {
  const allGoals = await getAllGoals(userId, 100);
  const activeGoals = await getActiveGoals(userId);
  
  // If user has no active goals but had goals before, recreate them
  if (activeGoals.length === 0 && allGoals.length > 0) {
    const lastWeeklyGoals = allGoals.filter(g => g.period === 'weekly').slice(0, 3);
    
    for (const oldGoal of lastWeeklyGoals) {
      await createGoal(userId, {
        goalType: oldGoal.goalType,
        targetValue: oldGoal.targetValue,
        period: oldGoal.period
      });
    }
  }
  
  return await getActiveGoals(userId);
}

/**
 * Helper: Convert goal type to readable label
 */
function goalTypeToLabel(type) {
  const labels = {
    'weekly_lessons': 'Complete lessons',
    'weekly_reviews': 'Review sessions',
    'weekly_practices': 'Practice exercises',
    'daily_minutes': 'Learning minutes',
    'skill_mastery': 'Skill mastery',
    'challenges_passed': 'Challenges passed'
  };
  return labels[type] || type;
}

/**
 * Helper: Convert period to readable label
 */
function periodToLabel(period) {
  const labels = {
    'daily': 'daily',
    'weekly': 'weekly',
    'monthly': 'monthly'
  };
  return labels[period] || period;
}

/**
 * Get goal type from activity type
 */
export function getGoalTypeFromActivity(activityType) {
  const mapping = {
    'lesson': 'weekly_lessons',
    'practice': 'weekly_practices',
    'review': 'weekly_reviews',
    'challenge': 'challenges_passed'
  };
  return mapping[activityType] || null;
}
