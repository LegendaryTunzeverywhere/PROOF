/**
 * Teaching Service
 * Handles teaching sessions and bookings
 */

import { api } from '../lib/api';
import type { TeachingSession } from '../types/api';

export const teachingService = {
  /**
   * List available teaching sessions
   */
  async getSessions(): Promise<{ sessions: TeachingSession[] }> {
    return api.get<{ sessions: TeachingSession[] }>('/api/teach/sessions');
  },

  /**
   * Get details of a specific session
   */
  async getSession(id: string): Promise<{ session: TeachingSession }> {
    return api.get<{ session: TeachingSession }>(`/api/teach/sessions/${id}`);
  },

  /**
   * Book a teaching session
   */
  async bookSession(sessionId: string): Promise<{ booking: any }> {
    return api.post(`/api/teach/sessions/${sessionId}/book`);
  },

  /**
   * Create a teaching session (for teachers)
   */
  async createSession(data: {
    title: string;
    skillSlug: string;
    description: string;
    priceNim: number;
    durationMin: string | number;
    maxStudents: number;
  }): Promise<{ session: TeachingSession }> {
    return api.post('/api/teach/sessions', data);
  },

  /**
   * Get user's teaching sessions
   */
  async getMySessions(): Promise<{ sessions: TeachingSession[] }> {
    return api.get('/api/teach/mine');
  },
};
