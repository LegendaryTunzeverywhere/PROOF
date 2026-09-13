import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed } from './helpers.js';

test('passing reward is automatically paid from the treasury', async () => {
  const treasury = {
    isConfigured: () => true,
    send: async ({ recipient, amountLuna }) => {
      assert.equal(recipient, 'NQXX TEST WALLET');
      assert.equal(amountLuna, 100000);
      return { hash: 'real-tx-hash' };
    },
  };
  const tb = await testbed();
  const user = await tb.users.createUser({ walletAddress: 'NQXX TEST WALLET', walletMode: 'nimiqpay' });
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
    send: async () => {
      if (!refilled) throw new Error('treasury empty');
      return { hash: 'retry-tx-hash' };
    },
  };
  const tb = await testbed();
  const user = await tb.users.createUser({ walletAddress: 'NQXX TEST WALLET', walletMode: 'nimiqpay' });
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