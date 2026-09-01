import test from 'node:test';
import assert from 'node:assert/strict';
import { testbed } from './helpers.js';
import { generateKeyPair, signBytes, nimiqMessageDigest, nimiqAddressFromPublicKey, looksLikeNimiqAddress } from '../server/util.js';

test('WalletService (server): demo wallet sign-in issues a verified session', async (t) => {
  const tb = await testbed();
  const demo = tb.auth.createDemoWallet();
  const { nonce, message } = tb.auth.issueNonce(demo.publicKey);
  const signature = tb.auth.signDemoMessage(demo.privateKey, message);
  assert.equal(tb.auth.verifySignature({ mode: 'demo', publicKey: demo.publicKey, signature, message }), true, 'demo signature must verify with real Ed25519');
});

test('WalletService (server): messages cannot be replayed across nonces', async (t) => {
  const tb = await testbed();
  const demo = tb.auth.createDemoWallet();
  const n1 = tb.auth.issueNonce(demo.publicKey);
  const sig = tb.auth.signDemoMessage(demo.privateKey, n1.message);
  const n2 = tb.auth.issueNonce(demo.publicKey);
  assert.equal(tb.auth.verifySignature({ mode: 'demo', publicKey: demo.publicKey, signature: sig, message: n2.message }), false);
});

test('raw ed25519 helpers: sign/verify roundtrip', () => {
  const kp = generateKeyPair();
  const msg = nimiqMessageDigest('PROOF test message');
  const sig = signBytes(kp.privateKey, msg);
  assert.equal(sig.length, 128, 'ed25519 signature = 64 bytes hex');
});

test('Nimiq public keys derive to checksummed user-friendly addresses', () => {
  const kp = generateKeyPair();
  const address = nimiqAddressFromPublicKey(kp.publicKey);
  assert.equal(looksLikeNimiqAddress(address), true);
  assert.match(address, /^NQ\d{2}(?: [0-9A-Z]{4}){8}$/);
});

test('HubApi loader and byte serialization use the current standalone API', async () => {
  class MockHubApi {}
  globalThis.HubApi = MockHubApi;
  const wallet = await import('../web/js/wallet.js');
  assert.equal(await wallet.loadHubApi(), MockHubApi);
  assert.equal(wallet.bytesToHex(new Uint8Array([0, 15, 255])), '000fff');
  assert.equal(wallet.bytesToHex({ toHex: () => 'abcd' }), 'abcd');
  delete globalThis.HubApi;
});

test('Hub connection uses chooseAddress, nonce, and signMessage without login', async () => {
  const address = 'NQ' + 'A'.repeat(32);
  const calls = [];
  class MockHubApi {
    constructor(endpoint) { this.endpoint = endpoint; }
    chooseAddress(options) { calls.push(['chooseAddress', options]); return Promise.resolve({ address, label: 'Test' }); }
    signMessage(options) { calls.push(['signMessage', options]); return Promise.resolve({ signer: address, signerPublicKey: new Uint8Array(32), signature: new Uint8Array(64) }); }
  }
  globalThis.HubApi = MockHubApi;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body || '{}');
    if (options.method === 'POST' && _url.endsWith('/api/auth/nonce')) return new Response(JSON.stringify({ nonce: 'n_test', message: 'sign this' }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (options.method === 'POST' && _url.endsWith('/api/auth/verify')) return new Response(JSON.stringify({ user: { id: 'u1' }, received: body }), { status: 200, headers: { 'content-type': 'application/json' } });
    throw new Error('unexpected request');
  };
  const { WalletService } = await import('../web/js/wallet.js');
  const result = await WalletService.connectNimiqHub();
  assert.deepEqual(result, { mode: 'hub', address });
  assert.equal(calls[0][0], 'chooseAddress');
  assert.equal(calls[1][0], 'signMessage');
  assert.equal(calls[1][1].signer, address);
  WalletService.disconnect();
  globalThis.fetch = originalFetch;
  delete globalThis.HubApi;
});
