/**
 * RewardService — the NIM economy. Server-authoritative, duplicate-proof.
 *
 * Rules enforced here (never in the client):
 *  - rewards exist only for PASSING evaluations produced server-side
 *  - one reward per user per source (unique key) — no double-claiming
 *  - daily reward cap + daily rewarded-attempt cap (anti-farming)
 *  - every money movement is a wallet_tx with pending/confirmed/failed/cancelled
 *  - in demo mode, txs settle to the in-app ledger and are labeled as such;
 *    with a configured treasury, reward payouts record on-chain refs.
 */
import { uid, now, luna, toNim, looksLikeNimiqAddress, normalizeNimiqAddress } from '../util.js';
import { NimiqTreasury } from './nimiq-treasury.js';
import crypto from 'node:crypto';

export class EconomyError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = code === 'PAYOUT_FAILED' ? 503 : 400;
  }
}

export class RewardService {
  constructor(store, config, { treasury = new NimiqTreasury(config) } = {}) {
    this.store = store;
    this.config = config;
    this.treasury = treasury;
    this.notifications = null;
    store.declareUniques('rewards', ['key']);   // ← duplicate-claim prevention
    store.declareUniques('wallet_txs', []);
  }

  setNotifications(service) { this.notifications = service; }

  async #user(userId) {
    const u = await this.store.get('users', userId);
    if (!u) throw new EconomyError('USER_NOT_FOUND', 'User not found.');
    return u;
  }

  /* ── ledger primitives ─────────────────────────────────────────── */
  async #tx({ userId, kind, direction, amountLuna, note, ref = null, meta = {} }) {
    const tx = await this.store.insert('wallet_txs', {
      id: uid('tx'), userId, kind, direction, amountLuna,
      status: 'pending', ref, note, meta,
      network: this.config.nimiq.rpcUrl ? 'nimiq' : 'demo-ledger',
      createdAt: now(), confirmedAt: null,
    });
    return tx;
  }

  async credit(userId, amountLuna, kind, note, meta = {}) {
    const user = await this.#user(userId);
    if (!(amountLuna > 0)) throw new EconomyError('BAD_AMOUNT', 'Amount must be positive.');
    const tx = await this.#tx({ userId, kind, direction: 'credit', amountLuna, note, meta });
    // Persist via store.update() (not just mutating `user` in place) — on
    // SupabaseStore, save() is a documented no-op, so an in-place mutation
    // alone would silently never reach the database.
    const currentBalanceLuna = Number(user.balanceLuna) || 0;
    const currentEarnedLuna = Number(user.earnedLuna) || 0;
    const balanceLuna = currentBalanceLuna + amountLuna;
    const earnedLuna = currentEarnedLuna + (kind === 'payout' ? 0 : amountLuna); // payouts are not "earning"
    await this.store.update('users', userId, { balanceLuna, earnedLuna, updatedAt: now() });
    await this.#settle(tx);
    await this.store.save();
    return tx;
  }

  async debit(userId, amountLuna, kind, note, meta = {}) {
    const user = await this.#user(userId);
    if (!(amountLuna > 0)) throw new EconomyError('BAD_AMOUNT', 'Amount must be positive.');
    const currentBalanceLuna = Number(user.balanceLuna) || 0;
    if (currentBalanceLuna < amountLuna)
      throw new EconomyError('INSUFFICIENT_NIM', `Not enough NIM — you need ${toNim(amountLuna)} NIM.`);
    const tx = await this.#tx({ userId, kind, direction: 'debit', amountLuna, note, meta });
    const balanceLuna = currentBalanceLuna - amountLuna;
    await this.store.update('users', userId, { balanceLuna, updatedAt: now() });
    await this.#settle(tx);
    await this.store.save();
    return tx;
  }

  /** Transaction state machine: pending → confirmed | failed | cancelled. */
  async #settle(tx) {
    // Demo ledger settles instantly. On-chain mode would record the tx hash
    // in `ref` at send time and flip to confirmed after RPC receipt checks.
    tx.status = 'confirmed';
    tx.confirmedAt = now();
    await this.store.update('wallet_txs', tx.id, { status: tx.status, confirmedAt: tx.confirmedAt });
  }

  async txHistory(userId, limit = 30) {
    const ownerId = String(userId);
    const filtered = await this.store.filter('wallet_txs', (t) => String(t.userId) === ownerId);
    return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  /* ── challenge rewards ─────────────────────────────────────────── */
  todayKey() { return new Date().toISOString().slice(0, 10); }

  async dailyRewardTotals(userId) {
    const t0 = new Date(this.todayKey() + 'T00:00:00.000Z').getTime();
    const txs = await this.store.filter('wallet_txs', (t) => t.userId === userId && t.kind === 'reward' && t.createdAt >= t0 && t.status === 'confirmed');
    return { count: txs.length, amountLuna: txs.reduce((a, x) => a + x.amountLuna, 0) };
  }

  async claimDaily({ userId, challengeId, streak }) {
    const user = await this.#user(userId);
    const activeStreak = Math.max(1, Number(streak) || 1);
    const key = `${userId}:daily:${this.todayKey()}`;
    if (await this.store.find('rewards', (reward) => reward.userId === userId && reward.key === key)) {
      return { granted: false, reason: 'ALREADY_CLAIMED', amountNim: 0, streak: activeStreak };
    }

    const amountNim = Math.round(activeStreak * 0.1 * 10) / 10;
    const today = await this.dailyRewardTotals(userId);
    if (today.amountLuna + luna(amountNim) > luna(this.config.economy.dailyRewardCapNim)) {
      return { granted: false, reason: 'DAILY_REWARD_CAP', amountNim: 0, streak: activeStreak };
    }

    const reward = await this.store.insert('rewards', {
      id: uid('rw'),
      key,
      userId,
      challengeId,
      sourceKind: 'daily_claim',
      amountLuna: luna(amountNim),
      currency: 'NIM',
      status: 'credited',
      transactionId: null,
      createdAt: now(),
    });
    const tx = await this.credit(userId, reward.amountLuna, 'reward',
      `Daily learning claim: ${amountNim} NIM`, { rewardId: reward.id, streak: activeStreak });
    await this.store.update('rewards', reward.id, { transactionId: tx.id });
    await this.store.save();
    let payout = null;
    if (this.treasury.isConfigured() && !user.isDemo && user.walletMode !== 'demo') {
      try {
        payout = await this.requestPayout(userId, amountNim, { automatic: true, rewardId: reward.id });
        await this.store.update('rewards', reward.id, { status: 'paid' });
      } catch (error) {
        await this.store.update('rewards', reward.id, { status: 'pending_payout' });
        console.error('[rewards] automatic daily treasury payout failed:', error.message);
      }
    }
    return { granted: true, amountNim, streak: activeStreak, reward, tx, payout };
  }

  /**
   * Try to grant a reward for a passing attempt. Returns reward | null.
   * All caps/limits are config-driven and enforced server-side.
   */
  async rewardForAttempt({ userId, challenge, attempt, evaluation, sourceKind = 'challenge', sourceKey = null }) {
    const eco = this.config.economy;
    const user = await this.#user(userId);
    if (user.isDemo || user.walletMode === 'demo') {
      return { granted: false, reason: 'DEMO_WALLET_REQUIRED' };
    }

    const rewardNim = challenge.rewardNim || 0;
    if (!(rewardNim > 0)) return { granted: false, reason: 'NO_REWARD' };
    if (!evaluation.pass) return { granted: false, reason: 'NOT_PASSED' };
    if (attempt.duplicate) return { granted: false, reason: 'DUPLICATE_SUBMISSION' };
    if (await this.store.find('rewards', (r) => r.userId === userId && r.key === sourceKey))
      return { granted: false, reason: 'ALREADY_REWARDED' };

    // Daily caps are the anti-farming core — dailyRewardTotals is async on
    // both backends, so this MUST be awaited or the caps silently vanish.
    const today = await this.dailyRewardTotals(userId);
    if (today.count >= eco.dailyRewardedAttemptsCap)
      return { granted: false, reason: 'DAILY_ATTEMPT_CAP' };
    if (today.amountLuna + luna(rewardNim) > luna(eco.dailyRewardCapNim))
      return { granted: false, reason: 'DAILY_REWARD_CAP' };

    const reward = await this.store.insert('rewards', {
      id: uid('rw'), 
      key: sourceKey,                       // unique → impossible to claim twice
      userId, 
      challengeId: challenge.id,
      sourceKind,
      amountLuna: luna(rewardNim),
      currency: 'NIM',
      status: 'credited',
      transactionId: null,
      createdAt: now(),
    });
    const tx = await this.credit(userId, reward.amountLuna, 'reward',
      `Reward: ${challenge.title}`, { rewardId: reward.id, challengeId: challenge.id });
    await this.store.update('rewards', reward.id, { transactionId: tx.id });
    await this.store.save();
    let payout = null;
    if (this.treasury.isConfigured()) {
      try {
        payout = await this.requestPayout(userId, rewardNim, { automatic: true, rewardId: reward.id });
        await this.store.update('rewards', reward.id, { status: 'paid' });
      } catch (error) {
        await this.store.update('rewards', reward.id, { status: 'pending_payout' });
        console.error('[rewards] automatic treasury payout failed:', error.message);
      }
    }
    return { granted: true, reward: { ...reward, transactionId: tx.id }, amountNim: rewardNim, payout };
  }

  async rewardForChessPuzzle({ userId, puzzle, attempt }) {
    const normalizedDifficulty = (() => {
      const difficulty = String(puzzle?.difficulty || '').toLowerCase();
      if (['beginner', 'intermediate', 'advanced'].includes(difficulty)) return difficulty;
      const rating = Number(puzzle?.rating ?? 0);
      if (rating >= 1800) return 'advanced';
      if (rating >= 1400) return 'intermediate';
      return 'beginner';
    })();

    const range = (() => {
      switch (normalizedDifficulty) {
        case 'advanced':
          return { min: 3, max: 10 };
        case 'intermediate':
          return { min: 1, max: 3 };
        case 'beginner':
        default:
          return { min: 0.1, max: 0.9 };
      }
    })();

    const amountNim = Number((crypto.randomInt(Math.round(range.min * 10), Math.round(range.max * 10) + 1) / 10).toFixed(1));

    return this.rewardForAttempt({
      userId,
      challenge: {
        id: `chess-puzzle:${puzzle.id}`,
        title: puzzle.title || 'Chess puzzle',
        rewardNim: amountNim,
      },
      attempt,
      evaluation: { pass: true },
      sourceKind: 'chess_puzzle',
      sourceKey: `chess-puzzle:${userId}:${puzzle.id}:${attempt.id}`,
    });
  }

  /**
  * Request a payout of the in-app balance. Configured treasury mode broadcasts
  * first and debits the balance only after the network accepts the transfer.
   */
  async requestPayout(userId, amountNim, { automatic = false, rewardId = null, notificationId = null, note = null, ignorePendingPayouts = false } = {}) {
    const amount = luna(amountNim);
    const user = await this.#user(userId);
    if (user.isDemo || user.walletMode === 'demo') {
      throw new EconomyError('DEMO_WALLET_REQUIRED', 'Demo wallets cannot receive or withdraw real NIM. Connect Nimiq Pay to continue.');
    }
    if (!automatic && amount < luna(1)) throw new EconomyError('MIN_PAYOUT', 'Minimum payout is 1 NIM.');
    const currentBalanceLuna = Number(user.balanceLuna) || 0;
    if (currentBalanceLuna < amount) throw new EconomyError('INSUFFICIENT_NIM', 'Not enough NIM in the user ledger for that payout.');
    if (this.treasury.isConfigured() && !rewardId && !ignorePendingPayouts && (await this.pendingPayoutsForUser(userId)).length) {
      throw new EconomyError('PENDING_PAYOUT', 'A previous reward is waiting for treasury funds. It will be retried automatically.');
    }
    let ref = null;
    if (this.treasury.isConfigured()) {
      if (!user.walletAddress) throw new EconomyError('NO_WALLET', 'Connect a Nimiq wallet before receiving a payout.');
      const recipient = normalizeNimiqAddress(user.walletAddress);
      if (!looksLikeNimiqAddress(recipient)) {
        throw new EconomyError('INVALID_WALLET', 'Stored wallet address is malformed. Connect a valid Nimiq wallet before receiving a payout.');
      }
      if (recipient !== user.walletAddress) {
        await this.store.update('users', userId, { walletAddress: recipient, updatedAt: now() });
        await this.store.save();
      }
      try {
        const transactionData = note ? String(note).slice(0, 64) : '';
        ({ hash: ref } = await this.treasury.send({ recipient, amountLuna: amount, data: transactionData }));
      } catch (error) {
        throw new EconomyError('PAYOUT_FAILED', `Treasury payout failed: ${error.message}`);
      }
    } else if (automatic) {
      throw new EconomyError('TREASURY_NOT_CONFIGURED', 'Automatic treasury payouts are not configured.');
    }
    const tx = await this.#tx({ userId, kind: 'payout', direction: 'debit', amountLuna: amount, ref,
      meta: { ...(rewardId ? { rewardId } : {}), ...(notificationId ? { notificationId } : {}) },
      note: ref ? 'Automatic on-chain treasury payout' : 'Payout (demo ledger — configure Nimiq treasury for real NIM)' });
    await this.store.update('users', userId, { balanceLuna: currentBalanceLuna - amount, updatedAt: now() });
    await this.#settle(tx);
    await this.store.save();
    return tx;
  }

  async pendingPayoutsForUser(userId) {
    const pending = await this.store.filter('rewards', (reward) =>
      reward.userId === userId && reward.status === 'pending_payout'
    );
    return pending.map((reward) => ({
      id: reward.id,
      challengeId: reward.challengeId,
      amountNim: toNim(reward.amountLuna),
      createdAt: reward.createdAt,
      status: reward.status,
    }));
  }

  async pendingPayouts(limit = 100) {
    const pending = await this.store.filter('rewards', (reward) => reward.status === 'pending_payout');
    return pending.slice(0, limit);
  }

  async retryPendingPayouts(limit = 100) {
    if (!this.treasury.isConfigured()) return { attempted: 0, paid: 0 };
    const pending = await this.pendingPayouts(limit);
    let attempted = 0;
    let paid = 0;
    for (const reward of pending) {
      try {
        const user = await this.#user(reward.userId);
        if (user.isDemo || user.walletMode === 'demo') {
          await this.store.update('rewards', reward.id, { status: 'credited' });
          continue;
        }
        attempted++;
        await this.requestPayout(reward.userId, toNim(reward.amountLuna), { automatic: true, rewardId: reward.id });
        await this.store.update('rewards', reward.id, { status: 'paid' });
        paid++;
      } catch (error) {
        console.error(`[rewards] retry failed for ${reward.id}:`, error.message);
      }
    }
    return { attempted, paid };
  }

  async sendStreakReminders(limit = 100) {
    const eco = this.config.economy;
    if (!eco.streakReminderNotificationsEnabled && !eco.streakReminderPayoutsEnabled) {
      return { inspected: 0, notified: 0, paid: 0 };
    }

    const today = this.todayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const cooldownStart = Date.now() - Math.max(1, Number(eco.streakReminderCooldownDays) || 7) * 86400000;
    const users = await this.store.all('users');
    let inspected = 0;
    let notified = 0;
    let paid = 0;

    for (const user of users.slice(0, limit)) {
      inspected++;
      const streak = Number(user.streak?.current) || 0;
      const lastActivity = user.streak?.lastDay;
      const hasWallet = user.walletAddress && !user.isDemo && user.walletMode !== 'demo' && looksLikeNimiqAddress(user.walletAddress);
      if (!hasWallet) continue;

      const streakAtRisk = streak > 0 && lastActivity === yesterday;
      const needsFirstStreak = streak === 0 && (!lastActivity || lastActivity < today);
      if (!streakAtRisk && !needsFirstStreak) continue;

      const reminderKey = `${user.id}:streak-reminder:${today}`;
      const existingNotification = await this.store.find('notifications', (entry) =>
        entry.userId === user.id && entry.type === 'streak_reminder' && Number(entry.createdAt) >= cooldownStart
      );
      const existingTransfer = await this.store.find('wallet_txs', (entry) =>
        entry.userId === user.id && entry.kind === 'payout' && String(entry.note || '').startsWith('PROOF streak reminder') && Number(entry.createdAt) >= cooldownStart
      );
      if (existingNotification) continue;

      let payoutSent = false;
      if (existingTransfer) {
        payoutSent = true;
      } else if (streakAtRisk && eco.streakReminderPayoutsEnabled && this.treasury.isConfigured()) {
        const amountLuna = Math.max(1, Number(eco.streakReminderAmountLuna) || 1);
        const { hash } = await this.treasury.send({
          recipient: normalizeNimiqAddress(user.walletAddress),
          amountLuna,
          data: `PROOF: protect your ${streak}-day streak`,
        });
        await this.store.insert('wallet_txs', {
          id: uid('tx'), userId: user.id, kind: 'payout', direction: 'credit',
          amountLuna, status: 'confirmed', ref: hash,
          note: `PROOF streak reminder: ${streak}-day streak`,
          meta: { reminderKey, streak }, network: 'nimiq', createdAt: now(), confirmedAt: now(),
        });
        payoutSent = true;
        paid++;
      }

      if (eco.streakReminderNotificationsEnabled && this.notifications) {
        await this.notifications.push(user.id, {
          type: 'streak_reminder',
          emoji: '🔥',
          title: streakAtRisk ? `PROOF misses you — protect your ${streak}-day streak` : 'PROOF misses you — start a learning streak',
          body: streakAtRisk
            ? payoutSent
              ? 'A PROOF streak reminder was sent to your Nimiq wallet. Continue learning today to keep your streak alive.'
              : 'Continue learning today to keep your streak alive.'
            : 'Start a lesson today and build your first learning streak.',
          href: '/learn',
        });
        notified++;
      }
    }

    await this.store.save();
    return { inspected, notified, paid };
  }

  /* ── tips & payments ───────────────────────────────────────────── */
  async tip(fromUserId, toUserId, amountNim, note = '') {
    const amount = luna(amountNim);
    if (fromUserId === toUserId) throw new EconomyError('SELF_TIP', 'You cannot tip yourself.');
    const tx = await this.debit(fromUserId, amount, 'tip', note || 'Tip');
    await this.credit(toUserId, amount, 'tip', 'Tip received' + (note ? `: ${note}` : ''), { fromUserId });
    return tx;
  }

  /** Escrow a payment; returns the escrow tx. fee is charged on release. */
  async escrow(userId, amountNim, kind, note, meta = {}) {
    return this.debit(userId, luna(amountNim), kind + '_escrow', note, { ...meta, escrowed: true });
  }

  async releaseEscrow({ fromUserId, toUserId, amountNim, kind, note, meta = {} }) {
    const gross = luna(amountNim);
    const fee = Math.round(gross * (this.config.economy.feeBps / 10000));
    const net = gross - fee;
    const user = await this.#user(toUserId);
    let payoutRef = null;
    let payoutSent = false;

    if (!user.isDemo && user.walletMode !== 'demo' && this.treasury.isConfigured()) {
      const recipient = normalizeNimiqAddress(user.walletAddress || '');
      if (!recipient || !looksLikeNimiqAddress(recipient)) {
        throw new EconomyError('INVALID_WALLET', 'The recipient wallet is missing or malformed. Connect a Nimiq wallet before releasing escrow.');
      }
      try {
        ({ hash: payoutRef } = await this.treasury.send({
          recipient,
          amountLuna: net,
          data: `PROOF:${kind}:${String(note || '').slice(0, 64)}`,
        }));
        payoutSent = true;
      } catch (error) {
        throw new EconomyError('PAYOUT_FAILED', `Treasury payout failed: ${error.message}`);
      }
    }

    const tx = await this.#tx({
      userId: toUserId,
      kind: 'payout',
      direction: 'credit',
      amountLuna: net,
      ref: payoutRef,
      note: payoutSent ? 'On-chain treasury payout' : `${note} (net of platform fee)`,
      meta: { ...meta, kind, payoutSent, feeLuna: fee },
    });

    const balanceLuna = user.balanceLuna + net;
    await this.store.update('users', toUserId, { balanceLuna, updatedAt: now() });
    await this.#settle(tx);
    await this.store.save();

    if (fee > 0) {
      const ftx = await this.#tx({ userId: fromUserId || toUserId, kind: 'platform_fee', direction: 'debit', amountLuna: fee, note: 'Platform fee (2%)' });
      await this.#settle(ftx);
    }

    return { gross, fee, net, payoutRef, payoutSent };
  }
}
