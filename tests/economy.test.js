import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNimiqAddress } from '../server/util.js';
import { testbed, copyOnReadStore } from './helpers.js';

test('rewards: insufficient balance blocks spending', async (t) => {
  const tb = await testbed();
  const u = await tb.users.createUser({});
  await assert.rejects(() => tb.rewards.tip(u.id, u.id, 5), (e) => e.code === 'INSUFFICIENT_NIM' || e.code === 'SELF_TIP');
});

test('rewards: daily caps stop farming', async (t) => {
  const tb = await testbed();
  const u = await tb.users.createUser({});
  // grant rewards manually up to the daily cap (config default 15 NIM, attempts cap 12)
  let granted = 0;
  for (let i = 0; i < 20; i++) {
    const r = await tb.rewards.rewardForAttempt({
      userId: u.id,
      challenge: { id: 'ch' + i, title: 'C' + i, rewardNim: 5 },
      attempt: { duplicate: false },
      evaluation: { pass: true },
      sourceKey: `k${u.id}:${i}`,
    });
    if (r.granted) granted += 5;
    else break;
  }
  assert.equal(granted, 15, 'must stop at the daily NIM cap');
});

test('economy: tips and payments move through transaction states', async (t) => {
  const tb = await testbed();
  const a = await tb.users.createUser({});
  const b = await tb.users.createUser({});
  await tb.rewards.credit(a.id, 500000, 'reward', 'seed');
  const tx = await tb.rewards.tip(a.id, b.id, 2, 'great answer');
  assert.equal(tx.status, 'confirmed');
  assert.equal(tb.users.get(a.id).balanceLuna, 300000);
  assert.equal(tb.users.get(b.id).balanceLuna, 200000);
  const history = await tb.rewards.txHistory(a.id);
  assert.ok(history.every((t2) => ['pending', 'confirmed', 'failed', 'cancelled'].includes(t2.status)));
});

test('economy: task payment applies the platform fee', async (t) => {
  const tb = await testbed();
  const client = await tb.users.createUser({});
  const pro = await tb.users.createUser({});
  await tb.rewards.credit(client.id, 10000000, 'reward', 'seed');
  await tb.rewards.escrow(client.id, 50, 'task_payment', 'escrow landing page');
  const { net, fee } = await tb.rewards.releaseEscrow({ fromUserId: client.id, toUserId: pro.id, amountNim: 50, kind: 'task_payment', note: 'task' });
  assert.equal(fee, 100000, '2% of 50 NIM');
  assert.equal(net, 4900000, '49 NIM net');
  assert.equal(tb.users.get(pro.id).balanceLuna, net);
});

test('economy: payout respects minimum and balance', async (t) => {
  const tb = await testbed();
  const u = await tb.users.createUser({});
  await tb.rewards.credit(u.id, 150000, 'reward', 'seed'); // 1.5 NIM
  const tx = await tb.rewards.requestPayout(u.id, 1);
  assert.equal(tx.status, 'confirmed');
  assert.equal(tb.users.get(u.id).balanceLuna, 50000);
  await assert.rejects(() => tb.rewards.requestPayout(u.id, 5), (e) => e.code === 'INSUFFICIENT_NIM');
});

test('economy: payout normalizes the stored Nimiq wallet address before treasury broadcast', async (t) => {
  const tb = await testbed();
  const user = await tb.users.createUser({ walletAddress: 'nq45  abcdefghijklmnopqrstuvwxyz 1234' });
  const treasury = {
    isConfigured: () => true,
    send: async ({ recipient, amountLuna }) => {
      assert.equal(recipient, normalizeNimiqAddress(recipient));
      assert.equal(recipient.replace(/\s+/g, ''), normalizeNimiqAddress(recipient));
      assert.equal(amountLuna, 100000);
      return { hash: 'stubbed-ref' };
    },
  };
  const rewards = new (Object.getPrototypeOf(tb.rewards).constructor)(tb.store, tb.config, { treasury });
  await rewards.credit(user.id, 150000, 'reward', 'seed');
  await rewards.requestPayout(user.id, 1);
});

test('economy: balance changes persist via store.update(), not just in-memory mutation', async (t) => {
  const tb = await testbed();
  const u = await tb.users.createUser({});
  const isolatingStore = copyOnReadStore(tb.store, ['users']);
  const rewards = new (Object.getPrototypeOf(tb.rewards).constructor)(isolatingStore, tb.config);

  await rewards.credit(u.id, 200000, 'reward', 'seed'); // 2 NIM
  assert.equal(tb.store.get('users', u.id).balanceLuna, 200000, 'credit must persist through store.update()');

  await rewards.debit(u.id, 50000, 'tip', 'spend'); // 0.5 NIM
  assert.equal(tb.store.get('users', u.id).balanceLuna, 150000, 'debit must persist through store.update()');

  await rewards.requestPayout(u.id, 1); // 1 NIM
  assert.equal(tb.store.get('users', u.id).balanceLuna, 50000, 'payout must persist through store.update()');
});
