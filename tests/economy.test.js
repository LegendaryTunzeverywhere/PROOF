import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed } from './helpers.js';

test('rewards: insufficient balance blocks spending', async (t) => {
  const tb = await testbed();
  const u = tb.users.createUser({});
  assert.throws(() => tb.rewards.tip(u.id, u.id, 5), (e) => e.code === 'INSUFFICIENT_NIM' || e.code === 'SELF_TIP');
});

test('rewards: daily caps stop farming', async (t) => {
  const tb = await testbed();
  const u = tb.users.createUser({});
  // grant rewards manually up to the daily cap (config default 15 NIM, attempts cap 12)
  let granted = 0;
  for (let i = 0; i < 20; i++) {
    const r = tb.rewards.rewardForAttempt({
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
  const a = tb.users.createUser({});
  const b = tb.users.createUser({});
  tb.rewards.credit(a.id, 500000, 'reward', 'seed');
  const tx = tb.rewards.tip(a.id, b.id, 2, 'great answer');
  assert.equal(tx.status, 'confirmed');
  assert.equal(tb.users.get(a.id).balanceLuna, 300000);
  assert.equal(tb.users.get(b.id).balanceLuna, 200000);
  const history = tb.rewards.txHistory(a.id);
  assert.ok(history.every((t2) => ['pending', 'confirmed', 'failed', 'cancelled'].includes(t2.status)));
});

test('economy: task payment applies the platform fee', async (t) => {
  const tb = await testbed();
  const client = tb.users.createUser({});
  const pro = tb.users.createUser({});
  tb.rewards.credit(client.id, 10000000, 'reward', 'seed');
  tb.rewards.escrow(client.id, 50, 'task_payment', 'escrow landing page');
  const { net, fee } = tb.rewards.releaseEscrow({ fromUserId: client.id, toUserId: pro.id, amountNim: 50, kind: 'task_payment', note: 'task' });
  assert.equal(fee, 100000, '2% of 50 NIM');
  assert.equal(net, 4900000, '49 NIM net');
  assert.equal(tb.users.get(pro.id).balanceLuna, net);
});

test('economy: payout respects minimum and balance', async (t) => {
  const tb = await testbed();
  const u = tb.users.createUser({});
  tb.rewards.credit(u.id, 150000, 'reward', 'seed'); // 1.5 NIM
  const tx = tb.rewards.requestPayout(u.id, 1);
  assert.equal(tx.status, 'confirmed');
  assert.equal(tb.users.get(u.id).balanceLuna, 50000);
  assert.throws(() => tb.rewards.requestPayout(u.id, 5), (e) => e.code === 'INSUFFICIENT_NIM');
});
