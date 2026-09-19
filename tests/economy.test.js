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

test('rewards: daily learning claim grants 0.1 NIM once per day', async (t) => {
  const tb = await testbed();
  const u = await tb.users.createUser({});

  const first = await tb.rewards.claimDaily({ userId: u.id, challengeId: 'daily-test', streak: 1 });
  assert.equal(first.granted, true);
  assert.equal(first.amountNim, 0.1);
  assert.equal(tb.store.get('users', u.id).balanceLuna, 10000);

  const second = await tb.rewards.claimDaily({ userId: u.id, challengeId: 'daily-test', streak: 1 });
  assert.equal(second.granted, false);
  assert.equal(second.reason, 'ALREADY_CLAIMED');
  assert.equal(tb.store.get('users', u.id).balanceLuna, 10000, 'duplicate daily claims must not add balance');
});

test('rewards: configured treasury receives the daily claim, including sub-1 NIM amounts', async () => {
  const tb = await testbed();
  const user = await tb.users.createUser({ walletAddress: 'NQ18 TAQ8 CL7P K505 LE2M C78A 1YQC 1CH1 6Y4G' });
  let sent = null;
  const treasury = {
    isConfigured: () => true,
    send: async (request) => {
      sent = request;
      return { hash: 'a'.repeat(64) };
    },
  };
  const rewards = new (Object.getPrototypeOf(tb.rewards).constructor)(tb.store, tb.config, { treasury });

  const result = await rewards.claimDaily({ userId: user.id, challengeId: 'daily-test', streak: 1 });

  assert.equal(result.payout.ref, 'a'.repeat(64));
  assert.equal(sent.amountLuna, 10000);
  assert.equal(tb.store.get('users', user.id).balanceLuna, 0);
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

test('economy: transaction history is isolated per user', async () => {
  const tb = await testbed();
  const first = await tb.users.createUser({});
  const second = await tb.users.createUser({});
  await tb.rewards.credit(first.id, 10000, 'reward', 'first user');
  await tb.rewards.credit(second.id, 20000, 'reward', 'second user');

  const firstHistory = await tb.rewards.txHistory(first.id);
  const secondHistory = await tb.rewards.txHistory(second.id);
  assert.ok(firstHistory.every((tx) => tx.userId === first.id));
  assert.ok(secondHistory.every((tx) => tx.userId === second.id));
  assert.equal(firstHistory.length, 1);
  assert.equal(secondHistory.length, 1);
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

test('economy: releaseEscrow sends a treasury payout when configured', async (t) => {
  const tb = await testbed();
  const client = await tb.users.createUser({ walletAddress: 'NQ18 TAQ8 CL7P K505 LE2M C78A 1YQC 1CH1 6Y4G' });
  const pro = await tb.users.createUser({ walletAddress: 'NQ45 NEJ7 1RRN GXCM FJGJ 1UBS AKG2 Q0NJ TFEJ' });
  await tb.rewards.credit(client.id, 10000000, 'reward', 'seed');
  await tb.rewards.escrow(client.id, 50, 'task_payment', 'escrow landing page');

  let sent = null;
  const treasury = {
    isConfigured: () => true,
    send: async ({ recipient, amountLuna, data }) => {
      sent = { recipient, amountLuna, data };
      return { hash: 'ff'.repeat(32) };
    },
  };

  const rewards = new (Object.getPrototypeOf(tb.rewards).constructor)(tb.store, tb.config, { treasury });
  const result = await rewards.releaseEscrow({
    fromUserId: client.id,
    toUserId: pro.id,
    amountNim: 50,
    kind: 'task_payment',
    note: 'task',
  });

  assert.ok(sent, 'treasury send should be invoked for real wallet mode');
  assert.equal(sent.recipient, normalizeNimiqAddress(pro.walletAddress));
  assert.equal(sent.amountLuna, 4900000);
  assert.equal(result.net, 4900000);
  assert.equal(tb.store.get('users', pro.id).balanceLuna, 4900000);
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
