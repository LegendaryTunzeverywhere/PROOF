import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed } from './helpers.js';

test('passing reward is automatically paid from the treasury', async () => {
  const treasury = {
    isConfigured: () => true,
    send: async ({ recipient, amountLuna }) => {
      assert.equal(recipient, 'NQ45FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY');
      assert.equal(amountLuna, 100000);
      return { hash: 'real-tx-hash' };
    },
  };
  const tb = await testbed();
  const user = await tb.users.createUser({ walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY', walletMode: 'nimiqpay' });
  const rewards = new (Object.getPrototypeOf(tb.rewards).constructor)(tb.store, tb.config, { treasury });

  const result = await rewards.rewardForAttempt({
    userId: user.id,
    challenge: { id: 'treasury-challenge', title: 'Treasury test', rewardNim: 1 },
    attempt: { duplicate: false },
    evaluation: { pass: true },
    sourceKey: `treasury:${user.id}`,
  });

  assert.equal(result.payout.ref, 'real-tx-hash');
  assert.equal(tb.users.get(user.id).balanceLuna, 0);
  assert.equal(result.payout.status, 'confirmed');
});

test('failed treasury broadcast leaves the credited balance available', async () => {
  let refilled = false;
  const treasury = {
    isConfigured: () => true,
    send: async ({ recipient }) => {
      if (!refilled) throw new Error('treasury empty');
      assert.equal(recipient, 'NQ45FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY');
      return { hash: 'retry-tx-hash' };
    },
  };
  const tb = await testbed();
  const user = await tb.users.createUser({ walletAddress: 'NQ45 FEDCBA9876543210ABCDEFGHJKLMNPQRSTUVXY', walletMode: 'nimiqpay' });
  const rewards = new (Object.getPrototypeOf(tb.rewards).constructor)(tb.store, tb.config, { treasury });

  const result = await rewards.rewardForAttempt({
    userId: user.id,
    challenge: { id: 'treasury-failure', title: 'Treasury failure test', rewardNim: 1 },
    attempt: { duplicate: false },
    evaluation: { pass: true },
    sourceKey: `treasury-failure:${user.id}`,
  });

  assert.equal(result.payout, null);
  assert.equal(tb.users.get(user.id).balanceLuna, 100000);
  assert.equal((await rewards.pendingPayoutsForUser(user.id)).length, 1);

  refilled = true;
  assert.deepEqual(await rewards.retryPendingPayouts(), { attempted: 1, paid: 1 });
  assert.equal((await rewards.pendingPayoutsForUser(user.id)).length, 0);
  assert.equal(tb.users.get(user.id).balanceLuna, 0);
});

test('demo daily rewards do not enter the treasury retry queue', async () => {
  let sendCalls = 0;
  const treasury = {
    isConfigured: () => true,
    send: async () => {
      sendCalls++;
      return { hash: 'unexpected-demo-payout' };
    },
  };
  const tb = await testbed();
  const user = await tb.users.createUser({ walletMode: 'demo', isDemo: true });
  const rewards = new (Object.getPrototypeOf(tb.rewards).constructor)(tb.store, tb.config, { treasury });

  const result = await rewards.claimDaily({ userId: user.id, challengeId: 'demo-daily', streak: 1 });

  assert.equal(result.payout, null);
  assert.equal(sendCalls, 0);
  assert.equal((await rewards.pendingPayoutsForUser(user.id)).length, 0);

  const legacyReward = await tb.store.insert('rewards', {
    id: 'rw-legacy-demo',
    key: 'legacy-demo-payout',
    userId: user.id,
    challengeId: 'legacy-demo',
    sourceKind: 'daily_claim',
    amountLuna: 10000,
    currency: 'NIM',
    status: 'pending_payout',
    transactionId: null,
    createdAt: Date.now(),
  });
  assert.equal(legacyReward.status, 'pending_payout');
  assert.deepEqual(await rewards.retryPendingPayouts(), { attempted: 0, paid: 0 });
  assert.equal(tb.store.get('rewards', legacyReward.id).status, 'credited');
  assert.equal(sendCalls, 0);
});