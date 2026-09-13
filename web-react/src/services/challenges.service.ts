/**
 * Challenges Service
 * Handles proof challenges, attempts, and daily challenges
 */

import { api } from '../lib/api';
import type { Attempt, Challenge, DailyChallenge, RewardResult, SponsoredChallenge } from '../types/api';

export const challengesService = {
  /**
   * Get a specific challenge by ID
   */
  async getChallenge(id: string): Promise<{ challenge: Challenge }> {
    return api.get<{ challenge: Challenge }>(`/api/challenges/${id}`);
  },

  /**
   * Submit an attempt for a challenge
   */
  async startAttempt(challengeId: string): Promise<{ attemptId: string; resumed: boolean }> {
    return api.post(`/api/challenges/${challengeId}/start`);
  },

  async submitAttempt(attemptId: string, payload: Record<string, unknown>): Promise<{ attempt: Attempt; reward?: RewardResult; xpAwarded?: number; nimAwarded?: number; levelUp?: boolean }> {
    return api.post(`/api/attempts/${attemptId}/submit`, payload);
  },

  /**
   * Get today's daily challenge
   */
  async getTodayDaily(): Promise<{ challenge: DailyChallenge; done: boolean; passed: boolean; attemptId: string | null }> {
    return api.get('/api/daily');
  },

  /**
   * Get user's attempts for a challenge
   */
  async getAttempts() {
    return api.get('/api/me/attempts');
  },

  /**
   * List sponsored challenges
   */
  async getSponsoredChallenges(): Promise<{ sponsored: SponsoredChallenge[] }> {
    return api.get('/api/sponsored');
  },

  async joinSponsoredChallenge(id: string): Promise<{ sponsored: SponsoredChallenge }> {
    return api.post(`/api/sponsored/${id}/join`);
  },
};
