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

export class EconomyError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

export class RewardService {
  constructor(store, config, { treasury = new NimiqTreasury(config) } = {}) {
    this.store = store;
    this.config = config;
    this.treasury = treasury;
    store.declareUniques('rewards', ['key']);   // ← duplicate-claim prevention
    store.declareUniques('wallet_txs', []);
  }

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
    const balanceLuna = user.balanceLuna + amountLuna;
    const earnedLuna = user.earnedLuna + (kind === 'payout' ? 0 : amountLuna); // payouts are not "earning"
    await this.store.update('users', userId, { balanceLuna, earnedLuna, updatedAt: now() });
    await this.#settle(tx);
    await this.store.save();
    return tx;
  }

  async debit(userId, amountLuna, kind, note, meta = {}) {
    const user = await this.#user(userId);
    if (!(amountLuna > 0)) throw new EconomyError('BAD_AMOUNT', 'Amount must be positive.');
    if (user.balanceLuna < amountLuna)
      throw new EconomyError('INSUFFICIENT_NIM', `Not enough NIM — you need ${toNim(amountLuna)} NIM.`);
    const tx = await this.#tx({ userId, kind, direction: 'debit', amountLuna, note, meta });
    const balanceLuna = user.balanceLuna - amountLuna;
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
    const filtered = await this.store.filter('wallet_txs', (t) => t.userId === userId);
    return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }

  /* ── challenge rewards ─────────────────────────────────────────── */
  todayKey() { return new Date().toISOString().slice(0, 10); }

  async dailyRewardTotals(userId) {
    const t0 = new Date(this.todayKey() + 'T00:00:00.000Z').getTime();
    const txs = await this.store.filter('wallet_txs', (t) => t.userId === userId && t.kind === 'reward' && t.createdAt >= t0 && t.status === 'confirmed');
    return { count: txs.length, amountLuna: txs.reduce((a, x) => a + x.amountLuna, 0) };
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

  /**
  * Request a payout of the in-app balance. Configured treasury mode broadcasts
  * first and debits the balance only after the network accepts the transfer.
   */
  async requestPayout(userId, amountNim, { automatic = false, rewardId = null } = {}) {
    const amount = luna(amountNim);
    const user = await this.#user(userId);
    if (user.isDemo || user.walletMode === 'demo') {
      throw new EconomyError('DEMO_WALLET_REQUIRED', 'Demo wallets cannot receive or withdraw real NIM. Connect Nimiq Pay to continue.');
    }
    if (amount < luna(1)) throw new EconomyError('MIN_PAYOUT', 'Minimum payout is 1 NIM.');
    if (user.balanceLuna < amount) throw new EconomyError('INSUFFICIENT_NIM', 'Not enough NIM for that payout.');
    if (this.treasury.isConfigured() && !rewardId && (await this.pendingPayoutsForUser(userId)).length) {
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
        ({ hash: ref } = await this.treasury.send({ recipient, amountLuna: amount }));
      } catch (error) {
        throw new EconomyError('PAYOUT_FAILED', `Treasury payout failed: ${error.message}`);
      }
    } else if (automatic) {
      throw new EconomyError('TREASURY_NOT_CONFIGURED', 'Automatic treasury payouts are not configured.');
    }
    const tx = await this.#tx({ userId, kind: 'payout', direction: 'debit', amountLuna: amount, ref,
      meta: rewardId ? { rewardId } : {},
      note: ref ? 'Automatic on-chain treasury payout' : 'Payout (demo ledger — configure Nimiq treasury for real NIM)' });
    await this.store.update('users', userId, { balanceLuna: user.balanceLuna - amount, updatedAt: now() });
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
    let paid = 0;
    for (const reward of pending) {
      try {
        await this.requestPayout(reward.userId, toNim(reward.amountLuna), { automatic: true, rewardId: reward.id });
        await this.store.update('rewards', reward.id, { status: 'paid' });
        paid++;
      } catch (error) {
        console.error(`[rewards] retry failed for ${reward.id}:`, error.message);
      }
    }
    return { attempted: pending.length, paid };
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
    await this.credit(toUserId, gross - fee, kind, note + ' (net of platform fee)', { ...meta });
    if (fee > 0) {
      const ftx = await this.#tx({ userId: toUserId, kind: 'platform_fee', direction: 'debit', amountLuna: fee, note: 'Platform fee (2%)' });
      await this.#settle(ftx);
    }
    await this.store.save();
    return { gross, fee, net: gross - fee };
  }
}
