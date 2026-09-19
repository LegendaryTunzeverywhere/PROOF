/**
 * NotificationService — in-app notification feed (spec §46).
 * Each delivered notification can optionally trigger a tiny reward payout so
 * users are compensated for attention without turning the feed into spam.
 */
import { uid, now, luna } from '../util.js';

export class NotificationService {
  constructor(store, { rewards = null, config = null } = {}) {
    this.store = store;
    this.rewards = rewards;
    this.config = config;
    this.microPayoutNim = this.config?.economy?.notificationMicroPayoutNim ?? 0.01;
  }

  async push(userId, { type, title, body = '', href = null, emoji = '🔔' }) {
    const n = this.store.insert('notifications', {
      id: uid('nt'), userId, type, title, body, href, emoji,
      read: false, createdAt: now(),
    });
    this.store.save();

    if (Number(this.microPayoutNim) > 0 && this.rewards && userId) {
      try {
        const user = await this.store.get('users', userId);
        if (user) {
          await this.rewards.credit(userId, luna(Number(this.microPayoutNim)), 'notification', `Notification: ${title || 'new alert'}`, { notificationId: n.id, type });
        }
      } catch (error) {
        console.warn('[notifications] micro-payout failed:', error?.message || error);
      }
    }

    return n;
  }

  async list(userId, options = {}) {
    const limit = Number(options.limit ?? 40);
    const page = Math.max(1, Number(options.page ?? 1));
    const filtered = await this.store.filter('notifications', (n) => n.userId === userId);
    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 40;
    const total = sorted.length;
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * safeLimit;
    const items = sorted.slice(startIndex, startIndex + safeLimit);
    return { items, total, totalPages, page: currentPage, limit: safeLimit };
  }

  async unreadCount(userId) {
    const rows = await this.store.filter('notifications', (n) => n.userId === userId && !n.read);
    return rows.length;
  }

  async markAllRead(userId) {
    const unread = await this.store.filter('notifications', (x) => x.userId === userId && !x.read);
    for (const n of unread)
      await this.store.update('notifications', n.id, { read: true });
    await this.store.save();
  }
}
