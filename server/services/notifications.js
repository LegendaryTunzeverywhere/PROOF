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

  list(userId, limit = 40) {
    return this.store.filter('notifications', (n) => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  unreadCount(userId) {
    return this.store.count('notifications', (n) => n.userId === userId && !n.read);
  }

  markAllRead(userId) {
    for (const n of this.store.filter('notifications', (x) => x.userId === userId && !x.read))
      this.store.update('notifications', n.id, { read: true });
    this.store.save();
  }
}
