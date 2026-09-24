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
    this.microPayoutNim = this.config?.economy?.notificationMicroPayoutNim ?? 0.005;
  }

  async push(userId, { type, title, body = '', href = null, emoji = '🔔', microPayout = true }) {
    const n = await this.store.insert('notifications', {
      id: uid('nt'), userId, type, title, body, href, emoji,
      read: false, createdAt: now(),
    });
    await this.store.save();

    if (microPayout && Number(this.microPayoutNim) > 0 && this.rewards && userId) {
      try {
        const user = await this.store.get('users', userId);
        if (user) {
          const amountNim = Number(this.microPayoutNim);
          const amountLuna = luna(amountNim);
          await this.rewards.credit(userId, amountLuna, 'notification', `Notification: ${title || 'new alert'}`, { notificationId: n.id, type });

          // Keep the ledger credit as a fallback, but send the micro-payment
          // on-chain when a real Nimiq Pay wallet and treasury are configured.
          if (
            this.rewards.treasury?.isConfigured?.() &&
            !user.isDemo &&
            user.walletMode !== 'demo' &&
            user.walletAddress
          ) {
            try {
              await this.rewards.requestPayout(userId, amountNim, {
                automatic: true,
                notificationId: n.id,
                note: `PROOF notification: ${title || 'new alert'}`,
              });
            } catch (error) {
              console.warn('[notifications] on-chain micro-payout failed; keeping ledger credit:', error?.message || error);
            }
          }
        }
      } catch (error) {
        console.warn('[notifications] micro-payout failed:', error?.message || error);
      }
    }

    return n;
  }

  async retryMicroPayouts(limit = 100) {
    if (!this.rewards?.treasury?.isConfigured?.()) return { attempted: 0, paid: 0 };
    const credits = await this.store.filter('wallet_txs', (tx) =>
      tx.kind === 'notification' && tx.direction === 'credit' && tx.status === 'confirmed' && tx.meta?.notificationId
    );
    let attempted = 0;
    let paid = 0;
    for (const credit of credits.slice(0, limit)) {
      const notificationId = credit.meta.notificationId;
      const existingPayout = await this.store.find('wallet_txs', (tx) =>
        tx.kind === 'payout' && tx.direction === 'debit' && tx.ref && tx.meta?.notificationId === notificationId
      );
      if (existingPayout) continue;
      const user = await this.store.get('users', credit.userId);
      if (!user || user.isDemo || user.walletMode === 'demo' || !user.walletAddress) continue;
      const amountNim = Number(credit.amountLuna) / 100_000;
      if ((Number(user.balanceLuna) || 0) < Number(credit.amountLuna)) continue;
      attempted++;
      try {
        await this.rewards.requestPayout(credit.userId, amountNim, {
          automatic: true,
          notificationId,
          ignorePendingPayouts: true,
          note: `PROOF notification retry: ${notificationId}`,
        });
        paid++;
      } catch (error) {
        console.warn(`[notifications] retry failed for ${notificationId}:`, error?.message || error);
      }
    }
    return { attempted, paid };
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
    const result = { items, total, totalPages, page: currentPage, limit: safeLimit };
    // Keep the paginated response backward-compatible with callers that only
    // need to search the current page.
    result.find = (...args) => items.find(...args);
    return result;
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
