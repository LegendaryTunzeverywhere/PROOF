import test from 'node:test';
import assert from 'node:assert/strict';
import { Store } from '../server/store.js';

test('store: insert/get/update/remove roundtrip', async () => {
  const s = new Store({ dataDir: './data/t1-' + Math.random().toString(36).slice(2, 6) });
  await s.open(null);
  const row = s.insert('things', { id: 'a1', name: 'x', n: 1 });
  assert.equal(row.name, 'x');
  s.update('things', 'a1', { n: 2 });
  assert.equal(s.get('things', 'a1').n, 2);
  s.remove('things', 'a1');
  assert.equal(s.get('things', 'a1'), null);
});

test('store: unique constraint prevents duplicates', async () => {
  const s = new Store({ dataDir: './data/t2-' + Math.random().toString(36).slice(2, 6) });
  await s.open(null);
  s.declareUniques('users2', ['email']);
  s.insert('users2', { id: 'u1', email: 'a@b.c' });
  assert.throws(() => s.insert('users2', { id: 'u2', email: 'a@b.c' }), /UNIQUE_VIOLATION/);
  s.insert('users2', { id: 'u3', email: 'other@b.c' });
  assert.equal(s.count('users2'), 2);
});

test('store: atomic persistence survives reload', async () => {
  const dir = './data/t3-' + Math.random().toString(36).slice(2, 6);
  const s = new Store({ dataDir: dir });
  await s.open(null);
  s.insert('keep', { id: 'k1', v: 42 });
  await s.flushAndWait();
  const s2 = new Store({ dataDir: dir });
  await s2.open(null);
  assert.equal(s2.get('keep', 'k1').v, 42);
});
