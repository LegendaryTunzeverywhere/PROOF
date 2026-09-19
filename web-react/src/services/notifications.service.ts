/**
 * Notifications Service
 * Handles user notifications and activity feed
 */

import { api } from '../lib/api';
import type { Notification } from '../types/api';

export const notificationsService = {
  /**
   * Get all notifications for current user
   */
  async getNotifications(page = 1, limit = 10): Promise<{ notifications: Notification[]; unread: number; page: number; limit: number; total: number; totalPages: number }> {
    return api.get(`/api/notifications?page=${page}&limit=${limit}`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ ok: boolean }> {
    return api.post<{ ok: boolean }>('/api/notifications/read');
  },
};
