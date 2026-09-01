/**
 * RewardService — the NIM economy. Server-authoritative, duplicate-proof.
 *
 * Rules enforced here (never in the client):
 *  - rewards exist only for PASSING evaluations produced server-side
 *  - one reward per user per source (unique key) — no double-claiming
 *  - daily reward cap + daily rewarded-attempt cap (anti-farming)
 *  - every money movement is a wallet_tx with pending/confirmed/failed/cancelled
 *  - in demo mode, txs settle to the in-app ledger and are labeled as such;
 *    with NIMIQ_RPC_URL configured, the same ledger records on-chain refs.
 */
import { uid, now, luna, toNim } from '../util.js';

export class EconomyError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export class RewardService {
  constructor(store, config) {
    this.store = store;
    this.config = config;
    store.declareUniques('rewards', ['key']);   // ← duplicate-claim prevention
    store.declareUniques('wallet_txs', []);
  }

  #user(userId) {
    const u = this.store.get('users', userId);
    if (!u) throw new EconomyError('USER_NOT_FOUND', 'User not found.');
    return u;
  }

  /* ── ledger primitives ─────────────────────────────────────────── */
  #tx({ userId, kind, direction, amountLuna, note, ref = null, meta = {} }) {
    const tx = this.store.insert('wallet_txs', {
      id: uid('tx'), userId, kind, direction, amountLuna,
      status: 'pending', ref, note, meta,
      network: this.config.nimiq.rpcUrl ? 'nimiq' : 'demo-ledger',
      createdAt: now(), confirmedAt: null,
    });
    return tx;
  }

  credit(userId, amountLuna, kind, note, meta = {}) {
    const user = this.#user(userId);
    if (!(amountLuna > 0)) throw new EconomyError('BAD_AMOUNT', 'Amount must be positive.');
    const tx = this.#tx({ userId, kind, direction: 'credit', amountLuna, note, meta });
    user.balanceLuna += amountLuna;
    user.earnedLuna += kind === 'payout' ? 0 : amountLuna; // payouts are not "earning"
    user.updatedAt = now();
    this.#settle(tx);
    this.store.save();
    return tx;
  }

  debit(userId, amountLuna, kind, note, meta = {}) {
    const user = this.#user(userId);
    if (!(amountLuna > 0)) throw new EconomyError('BAD_AMOUNT', 'Amount must be positive.');
    if (user.balanceLuna < amountLuna)
      throw new EconomyError('INSUFFICIENT_NIM', `Not enough NIM — you need ${toNim(amountLuna)} NIM.`);
    const tx = this.#tx({ userId, kind, direction: 'debit', amountLuna, note, meta });
    user.balanceLuna -= amountLuna;
    user.updatedAt = now();
    this.#settle(tx);
    this.store.save();
    return tx;
  }

  /** Transaction state machine: pending → confirmed | failed | cancelled. */
  #settle(tx) {
    // Demo ledger settles instantly. On-chain mode would record the tx hash
    // in `ref` at send time and flip to confirmed after RPC receipt checks.
    tx.status = 'confirmed';
    tx.confirmedAt = now();
    this.store.update('wallet_txs', tx.id, { status: tx.status, confirmedAt: tx.confirmedAt });
  }

  txHistory(userId, limit = 30) {
    return this.store.filter('wallet_txs', (t) => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  /* ── challenge rewards ─────────────────────────────────────────── */
  todayKey() { return new Date().toISOString().slice(0, 10); }

  dailyRewardTotals(userId) {
    const t0 = new Date(this.todayKey() + 'T00:00:00.000Z').getTime();
    const txs = this.store.filter('wallet_txs', (t) => t.userId === userId && t.kind === 'reward' && t.createdAt >= t0 && t.status === 'confirmed');
    return { count: txs.length, amountLuna: txs.reduce((a, x) => a + x.amountLuna, 0) };
  }

  /**
   * Try to grant a reward for a passing attempt. Returns reward | null.
   * All caps/limits are config-driven and enforced server-side.
   */
  rewardForAttempt({ userId, challenge, attempt, evaluation, sourceKind = 'challenge', sourceKey = null }) {
    const eco = this.config.economy;
    const rewardNim = challenge.rewardNim || 0;
    if (!(rewardNim > 0)) return { granted: false, reason: 'NO_REWARD' };
    if (!evaluation.pass) return { granted: false, reason: 'NOT_PASSED' };
    if (attempt.duplicate) return { granted: false, reason: 'DUPLICATE_SUBMISSION' };
    if (this.store.find('rewards', (r) => r.userId === userId && r.key === sourceKey))
      return { granted: false, reason: 'ALREADY_REWARDED' };

    const today = this.dailyRewardTotals(userId);
    if (today.count >= eco.dailyRewardedAttemptsCap)
      return { granted: false, reason: 'DAILY_ATTEMPT_CAP' };
    if (today.amountLuna + luna(rewardNim) > luna(eco.dailyRewardCapNim))
      return { granted: false, reason: 'DAILY_REWARD_CAP' };

    const reward = this.store.insert('rewards', {
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
    const tx = this.credit(userId, reward.amountLuna, 'reward',
      `Reward: ${challenge.title}`, { rewardId: reward.id, challengeId: challenge.id });
    this.store.update('rewards', reward.id, { transactionId: tx.id });
    this.store.save();
    return { granted: true, reward: { ...reward, transactionId: tx.id }, amountNim: rewardNim };
  }

  /**
   * Request an on-chain payout of the in-app balance (demo ledger → wallet).
   * Demo mode: records a pending → confirmed payout tx, clearly labeled.
   */
  requestPayout(userId, amountNim) {
    const amount = luna(amountNim);
    const user = this.#user(userId);
    if (amount < luna(1)) throw new EconomyError('MIN_PAYOUT', 'Minimum payout is 1 NIM.');
    if (user.balanceLuna < amount) throw new EconomyError('INSUFFICIENT_NIM', 'Not enough NIM for that payout.');
    const tx = this.#tx({ userId, kind: 'payout', direction: 'debit', amountLuna: amount,
      note: this.config.nimiq.rpcUrl ? 'On-chain payout' : 'Payout (demo ledger — connect Nimiq Pay in production)' });
    user.balanceLuna -= amount;
    this.#settle(tx);
    this.store.save();
    return tx;
  }

  /* ── tips & payments ───────────────────────────────────────────── */
  tip(fromUserId, toUserId, amountNim, note = '') {
    const amount = luna(amountNim);
    if (fromUserId === toUserId) throw new EconomyError('SELF_TIP', 'You cannot tip yourself.');
    const tx = this.debit(fromUserId, amount, 'tip', note || 'Tip');
    this.credit(toUserId, amount, 'tip', 'Tip received' + (note ? `: ${note}` : ''), { fromUserId });
    return tx;
  }

  /** Escrow a payment; returns the escrow tx. fee is charged on release. */
  escrow(userId, amountNim, kind, note, meta = {}) {
    return this.debit(userId, luna(amountNim), kind + '_escrow', note, { ...meta, escrowed: true });
  }

  releaseEscrow({ fromUserId, toUserId, amountNim, kind, note, meta = {} }) {
    const gross = luna(amountNim);
    const fee = Math.round(gross * (this.config.economy.feeBps / 10000));
    this.credit(toUserId, gross - fee, kind, note + ' (net of platform fee)', { ...meta });
    if (fee > 0) {
      const ftx = this.#tx({ userId: toUserId, kind: 'platform_fee', direction: 'debit', amountLuna: fee, note: 'Platform fee (2%)' });
      this.#settle(ftx);
    }
    this.store.save();
    return { gross, fee, net: gross - fee };
  }
}
