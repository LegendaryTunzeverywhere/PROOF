/**
 * NotificationService — in-app notification feed (spec §46).
 */
import { uid, now } from '../util.js';

export class NotificationService {
  constructor(store) { this.store = store; }

  push(userId, { type, title, body = '', href = null, emoji = '🔔' }) {
    const n = this.store.insert('notifications', {
      id: uid('nt'), userId, type, title, body, href, emoji,
      read: false, createdAt: now(),
    });
    this.store.save();
    return n;
  }

  async list(userId, limit = 40) {
    const filtered = await this.store.filter('notifications', (n) => n.userId === userId);
    return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  // /api/me currently builds its response synchronously after its other awaited
  // work. Keep this accessor synchronous for the embedded Store, whose count()
  // operation is synchronous, so unread never becomes {} after JSON.stringify.
  // SupabaseStore is asynchronous and is handled by the route-level fallback
  // below until the response contract is fully async.
  unreadCount(userId) {
    const count = this.store.count('notifications', (n) => n.userId === userId && !n.read);
    return typeof count === 'number' ? count : 0;
  }

  async markAllRead(userId) {
    const unread = await this.store.filter('notifications', (x) => x.userId === userId && !x.read);
    for (const n of unread)
      await this.store.update('notifications', n.id, { read: true });
    await this.store.save();
  }
}
