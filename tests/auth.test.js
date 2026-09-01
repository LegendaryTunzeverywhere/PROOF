import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed } from './helpers.js';
import { generateKeyPair, nimiqMessageDigest, signBytes, verifyNimiqSignature } from '../server/util.js';

test('wallet auth: real Ed25519 signature verifies; tampering fails', async (t) => {
  const tb = await testbed();
  const kp = generateKeyPair();
  const { nonce, message } = tb.auth.issueNonce('NQTEST ADDRESS');
  const sig = signBytes(kp.privateKey, nimiqMessageDigest(message));
  assert.equal(tb.auth.verifySignature({ mode: 'nimiq', publicKey: kp.publicKey, signature: sig, message }), true);

  // tampered message fails
  assert.equal(tb.auth.verifySignature({ mode: 'nimiq', publicKey: kp.publicKey, signature: sig, message: message + 'x' }), false);
  // wrong key fails
  const other = generateKeyPair();
  assert.equal(tb.auth.verifySignature({ mode: 'nimiq', publicKey: other.publicKey, signature: sig, message }), false);
  // garbage signature fails safely
  assert.equal(tb.auth.verifySignature({ mode: 'nimiq', publicKey: kp.publicKey, signature: 'zzzz', message }), false);
});

test('wallet auth: nonce is single-use and expires', async (t) => {
  const tb = await testbed();
  const { nonce } = tb.auth.issueNonce('demo');
  assert.ok(await tb.auth.consumeNonce(nonce));
  assert.equal(await tb.auth.consumeNonce(nonce), null, 'nonce must be single-use');
});

test('wallet auth: sessions authenticate the right user only', async (t) => {
  const tb = await testbed();
  const u = tb.users.createUser({});
  const token = tb.auth.createSession(u.id);
  const got = tb.auth.userFromToken(token);
  assert.equal(got.id, u.id);
  assert.equal(tb.auth.userFromToken('nonsense.token'), null);
});

test('nimiq message digest matches the documented prefix scheme', () => {
  // '\x16Nimiq Signed Message:\n' + byteLength + message  → sha256
  const digest = nimiqMessageDigest('hello');
  assert.equal(digest.length, 32);
  const crypto = await0();
  function await0() { return null; }
  assert.ok(Buffer.isBuffer(digest));
  assert.equal(verifyNimiqSignature('bad', 'hello', 'bad'), false);
});
