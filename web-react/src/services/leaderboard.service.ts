/**
 * Leaderboard Service
 * Handles leaderboard rankings
 */

import { api } from '../lib/api';
import type { LeaderboardEntry } from '../types/api';

export const leaderboardService = {
  /**
   * Get leaderboard by category
   */
  async getLeaderboard(category = 'proofs', page = 1, pageSize = 10): Promise<{ entries: LeaderboardEntry[]; category: string; total?: number }> {
    const offset = (page - 1) * pageSize;
    return api.get(`/api/leaderboard?cat=${encodeURIComponent(category)}&limit=${pageSize}&offset=${offset}`);
  },

  /**
   * Get user's rank
   */
};
