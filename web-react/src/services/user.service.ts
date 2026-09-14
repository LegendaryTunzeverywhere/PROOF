/**
 * User Service
 * Handles user profile and account management
 */

import { api } from '../lib/api';
import type { User, MeResponse, Skill } from '../types/api';

export interface UpdateUserRequest {
  username?: string;
  avatar?: string;
  prefs?: Partial<User['prefs']>;
}

export const userService = {
  /**
   * Get current user with skills and stats
   */
  async getMe(): Promise<MeResponse> {
    return api.get<MeResponse>('/api/me');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateUserRequest): Promise<{ user: User }> {
    return api.patch<{ user: User }>('/api/me', data);
  },

  /**
   * Get user's skills
   */
  async getSkills(): Promise<{ skills: Skill[] }> {
    const response = await this.getMe();
    return { skills: response.skills };
  },
};
