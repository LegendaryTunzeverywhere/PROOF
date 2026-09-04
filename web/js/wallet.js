/**
 * WalletService (client) — the ONLY place blockchain logic lives.
 *
 * Two modes:
 *  1. nimiqpay — real Nimiq Mini Apps environment. Uses the official
 *     `@nimiq/mini-app-sdk` (init() → provider). listAccounts(), sign(),
 *     sendBasicTransaction(WithData) per the Nimiq Provider API.
 *  2. demo — browser/sandbox demo wallet. Server-issued Ed25519 keypair,
 *     same real signature-verification path, clearly labeled DEMO.
 *
 * UI components never touch providers directly — only this service.
 */
import { api } from './api.js';

const SDK_CANDIDATES = [
  'https://esm.sh/@nimiq/mini-app-sdk',
  'https://cdn.jsdelivr.net/npm/@nimiq/mini-app-sdk/+esm',
];

/** Nimiq Hub API for normal browsers. Pin the production CDN build. */
const HUB_VERSION = 'v1.10.0';
const HUB_CDN = `https://cdn.jsdelivr.net/npm/@nimiq/hub-api@${HUB_VERSION}/dist/standalone/HubApi.standalone.umd.js`;
const HUB_ENDPOINT = 'https://hub.nimiq.com';
const APP_NAME = 'PROOF';
let hubApiInstance = null;
let hubApiLoadPromise = null;

/** localStorage can throw in sandboxed iframes — never let storage break wallet flows. */
const safeStorage = {
  /** @param {string} k */
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  /** @param {string} k @param {string} v */
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sandboxed */ } },
  /** @param {string} k */
  del(k) { try { localStorage.removeItem(k); } catch { /* sandboxed */ } },
};

/**
 * @type {{
 *   mode: 'nimiqpay' | 'hub' | 'demo' | null,
 *   nimiq: any,
 *   address: string | null,
 *   demoKey: { publicKey: string, privateKey: string } | null,
 *   sessionUser: any,
 * }}
 */
const state = {
  mode: null,            // 'nimiqpay' | 'hub' | 'demo' | null
  nimiq: null,           // provider from SDK init()
  address: null,
  demoKey: null,         // { publicKey, privateKey } — demo only
  sessionUser: null,
};

/**
 * Race a promise against a timeout.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [tag='timeout']
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, tag = 'timeout') {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(tag)), ms)),
  ]);
}

/** Simple sleep helper. */
function sleep(ms) { return new Promise((res) => setTimeout(res, ms)); }

/** Load a script with retries and exponential backoff; returns when global is available.
 * @param {string} src
 * @param {{ attempts?: number, timeout?: number, backoff?: number }=} [options]
 */
async function loadScriptWithRetries(src, { attempts = 3, timeout = 8000, backoff = 2 } = {}) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      console.debug(`wallet: loading script ${src} (attempt ${i}/${attempts})`);
      await withTimeout(new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.onload = () => resolve(undefined);
        s.onerror = (e) => reject(new Error('SCRIPT_LOAD_ERROR'));
        document.head.append(s);
      }), timeout, 'SCRIPT_LOAD_TIMEOUT');
      return true;
    } catch (err) {
      lastErr = err;
      console.warn(`wallet: script load failed for ${src} (attempt ${i}):`, err);
      if (i < attempts) await sleep(Math.round(timeout * Math.pow(backoff, i - 1)));
    }
  }
  throw lastErr || new Error('SCRIPT_LOAD_FAILED');
}

export function walletErrorCode(error) {
  if (error?.code) return error.code;
  const message = String(error?.message || error || '');
  if (/cancel|reject|denied/i.test(message)) return 'USER_REJECTED';
  if (/timeout/i.test(message)) return 'HUB_TIMEOUT';
  return message || 'WALLET_ERROR';
}

export function bytesToHex(value) {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array || ArrayBuffer.isView(value)) {
    const bytes = value instanceof Uint8Array
      ? value
      : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  if (Array.isArray(value) && value.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
    return Array.from(value, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  if (value && typeof value.toHex === 'function') return value.toHex();
  throw new Error('UNSUPPORTED_BYTE_FORMAT');
}

/**
 * Full environment detection — drives the connect sheet's option order.
 *
 * Ground truth from @nimiq/mini-app-sdk (v0.1.0): inside Nimiq Pay the host
 * injects `window.nimiq` (the provider) and/or `window.nimiqPay` (a read-only
 * host context: `{ language?, requestDeviceIdentifier }`). There is NO
 * `nimiqPay.active` flag and no `NimiqMiniApp` global — checking those was why
 * detection always failed inside the real app.
 */
const browserWindow = typeof window === 'undefined' ? globalThis : window;
const windowWithMiniApp = /** @type {Window & typeof globalThis & {
  nimiq?: any,
  nimiqPay?: { language?: string } & Record<string, any>,
  HubApi?: any,
}} */ (browserWindow);

function nimiqPayHostDetected() {
  // Provider already injected → definitely inside Nimiq Pay.
  if (windowWithMiniApp.nimiq) return true;
  // Host context object present (has language / requestDeviceIdentifier, no .active flag).
  const ctx = windowWithMiniApp.nimiqPay;
  return !!ctx && typeof ctx === 'object';
}

export function environment() {
  const inNimiqPay = nimiqPayHostDetected();
  let desktop = false;
  try { desktop = window.matchMedia('(min-width: 1024px)').matches; } catch { /* no matchMedia */ }
  return {
    inNimiqPay,
    desktop,
    kind: inNimiqPay ? 'nimiqpay' : desktop ? 'desktop' : 'mobile',
  };
}

/** True when running in a desktop-class browser (Hub flow is the right fit). */
export function isDesktopLike() {
  return environment().kind === 'desktop';
}

const globalWindow = /** @type {typeof window & { HubApi?: any }} */ (browserWindow);

/** Load the official Nimiq HubApi standalone UMD build once. */
export async function loadHubApi() {
  if (windowWithMiniApp.HubApi) return windowWithMiniApp.HubApi;
  if (globalWindow.HubApi) return globalWindow.HubApi;
  if (!hubApiLoadPromise) {
    console.debug('[wallet] loading Hub API', { version: HUB_VERSION });
    hubApiLoadPromise = loadScriptWithRetries(HUB_CDN, { attempts: 2, timeout: 10000, backoff: 1.5 })
      .then(() => windowWithMiniApp.HubApi || globalWindow.HubApi || (() => { throw new Error('HUB_API_UNAVAILABLE'); })())
      .catch(() => { hubApiLoadPromise = null; throw new Error('HUB_API_UNAVAILABLE'); });
  }
  return hubApiLoadPromise;
}

async function getHubApi() {
  if (hubApiInstance) return hubApiInstance;
  const HubApi = await loadHubApi();
  hubApiInstance = new HubApi(HUB_ENDPOINT);
  console.debug('[wallet] Hub API loaded');
  return hubApiInstance;
}

/** Detect the Nimiq Pay injected environment / load the official SDK. */
async function loadNimiqSdk() {
  if (state.nimiq) return state.nimiq;
  // Fast path — the host injects the provider directly (this is what the
  // SDK's init() resolves to anyway). Zero network, works even if the CDN
  // is unreachable inside the webview. This was the connect-killer before.
  if (windowWithMiniApp.nimiq) {
    state.nimiq = windowWithMiniApp.nimiq;
    return state.nimiq;
  }
  // Inside Nimiq Pay but the provider isn't injected yet → load the official
  // SDK, whose init() polls for window.nimiq (default timeout 10s).
  const inHost = nimiqPayHostDetected();
  if (inHost) {
    for (const url of SDK_CANDIDATES) {
      try {
        console.debug('wallet: attempting to import Nimiq SDK from', url);
        const mod = await withTimeout(import(url), 8000, 'NIMIQ_SDK_IMPORT_TIMEOUT');
        if (mod?.init) { state.nimiq = await withTimeout(mod.init({ timeout: 10000 }), 12000, 'NIMIQ_SDK_INIT_TIMEOUT'); return state.nimiq; }
      } catch (e) { console.warn('wallet: Nimiq SDK candidate failed:', e); }
    }
    throw new Error('NIMIQ_SDK_UNAVAILABLE');
  }
  // Outside Nimiq Pay (regular browser): fail fast with clear guidance
  // instead of stalling ~15s through CDN imports that can never connect.
  throw new Error('NIMIQ_PAY_UNAVAILABLE');
}

/** The provider can also be an ErrorResponse object — normalize to strings or fail loudly. */
function assertNotErrorResponse(result, what) {
  if (result && typeof result === 'object' && !Array.isArray(result) && result.error != null)
    throw Object.assign(new Error(String(result.error?.message || result.error || 'WALLET_ERROR')), { code: 'WALLET_ERROR', source: what });
  return result;
}

export class WalletServiceClass {
  get mode() { return state.mode; }
  get address() { return state.address; }
  get isDemo() { return state.mode === 'demo'; }
  get connected() { return !!state.mode; }

  restore() {
    try {
      const raw = safeStorage.get('proof_wallet');
      if (!raw) return null;
      const w = JSON.parse(raw);
      state.mode = w.mode; state.address = w.address || null; state.demoKey = w.demoKey || null;
      return w;
    } catch { return null; }
  }

  #persist() {
    safeStorage.set('proof_wallet', JSON.stringify({
      mode: state.mode, address: state.address, demoKey: state.demoKey,
    }));
  }

  disconnect() {
    state.mode = null; state.address = null; state.demoKey = null; state.nimiq = null;
    safeStorage.del('proof_wallet');
  }

  /** Connect via the real Nimiq Pay provider (official SDK). */
  async connectNimiqPay() {
    const nimiq = await loadNimiqSdk();
    const accounts = assertNotErrorResponse(
      await withTimeout(nimiq.listAccounts(), 15000, 'NIMIQ_ACCOUNTS_TIMEOUT'),
      'listAccounts'
    );
    // Provider contract: string[] of user-friendly addresses — reject anything else.
    const address = Array.isArray(accounts)
      ? accounts.find((a) => typeof a === 'string' && a.trim())
      : null;
    if (!address) throw new Error('NO_ACCOUNTS');
    await this.#authenticate('nimiqpay', {
      address,
      /** @param {string} m */
      signMessage: async (m) => {
        const result = assertNotErrorResponse(
          await withTimeout(nimiq.sign(m), 15000, 'NIMIQ_SIGN_TIMEOUT'),
          'sign'
        );
        if (!result?.publicKey || !result?.signature) throw new Error('MALFORMED_SIGNATURE_RESULT');
        // SignatureResult is hex strings per the SDK — bytesToHex passes strings
        // through unchanged and safely hex-encodes byte arrays from other hosts.
        return { publicKey: bytesToHex(result.publicKey), signature: bytesToHex(result.signature) };
      },
    });
    state.mode = 'nimiqpay';
    state.address = address;
    state.nimiq = nimiq;
    this.#persist();
    return { mode: 'nimiqpay', address };
  }

  /** Connect with a demo wallet (real Ed25519, sandbox-held key). */
  async connectDemo() {
    let demo = state.demoKey;
    if (!demo) {
      const created = await api.post('/api/wallet/demo');
      demo = { publicKey: created.publicKey, privateKey: created.privateKey };
      state.demoKey = demo;
    }
    await this.#authenticate('demo', {
      publicKey: demo.publicKey,
      /** @param {string} m */
      signMessage: async (m) => {
        const r = await api.post('/api/wallet/demo/sign', { privateKey: demo.privateKey, message: m });
        return { publicKey: demo.publicKey, signature: r.signature };
      },
    });
    state.mode = 'demo';
    state.address = null;
    this.#persist();
    return { mode: 'demo', address: null };
  }

  /** Connect through the public Hub API address-selection + signing flow. */
  async connectNimiqHub() {
    try {
      // The static CDN tag preloads HubApi before this click handler runs. Start
      // the request synchronously when possible so popup-capable browsers do not
      // lose the user-gesture context (Hub also supports redirect behavior).
      const HubApi = windowWithMiniApp.HubApi || globalWindow.HubApi;
      const hubApi = hubApiInstance || (HubApi ? (hubApiInstance = new HubApi(HUB_ENDPOINT)) : await getHubApi());
      console.debug('[wallet] chooseAddress started');
      const selected = await withTimeout(hubApi.chooseAddress({ appName: APP_NAME }), 60000, 'HUB_TIMEOUT');
      const address = selected?.address;
      if (typeof address !== 'string' || !address.trim()) throw new Error('NO_ADDRESS_SELECTED');
      console.debug('[wallet] address selected', address);

      console.debug('[wallet] requesting nonce');
      const { nonce, message } = await api.post('/api/auth/nonce', { subject: address });
      console.debug('[wallet] requesting signature');
      const signed = await withTimeout(
        hubApi.signMessage({ appName: APP_NAME, message, signer: address }), 60000, 'HUB_TIMEOUT'
      );
      if (!signed?.signer || !signed.signerPublicKey || !signed.signature) throw new Error('MALFORMED_HUB_RESPONSE');
      if (String(signed.signer).replace(/\s+/g, ' ').trim() !== address.replace(/\s+/g, ' ').trim()) throw new Error('HUB_SIGNER_MISMATCH');
      console.debug('[wallet] signature received');

      const res = await api.post('/api/auth/verify', {
        mode: 'hub', nonce, address,
        signer: signed.signer,
        publicKey: bytesToHex(signed.signerPublicKey),
        signature: bytesToHex(signed.signature),
      });
      state.mode = 'hub';
      state.address = address;
      state.sessionUser = res.user;
      this.#persist();
      console.debug('[wallet] authenticated');
      return { mode: 'hub', address };
    } catch (err) {
      console.warn('wallet: connectNimiqHub failed:', err);
      const code = walletErrorCode(err);
      throw Object.assign(new Error(code), { cause: err });
    }
  }

  /**
   * nonce → signature → server verification → session (spec §22).
   *
   * If the server answers BAD_NONCE (nonce expired under the 10-min TTL, or
   * was already consumed by a previous attempt), retry ONCE with a fresh
   * nonce before surfacing the error — this is what kept demo sign-in
   * failing with "This sign-in request expired" on slow or retried connects.
   *
   * @param {string} mode
   * @param {any} signer
   */
  async #authenticate(mode, signer) {
    const subject = mode === 'nimiqpay' ? signer.address : signer.publicKey;
    for (let attempt = 0; ; attempt++) {
      const { nonce, message } = await api.post('/api/auth/nonce', { subject });
      const signed = await signer.signMessage(message);
      const payload = mode === 'nimiqpay'
        ? { mode, nonce, address: signer.address, publicKey: signed.publicKey, signature: signed.signature }
        : { mode, nonce, publicKey: signed.publicKey, signature: signed.signature };
      try {
        const res = await api.post('/api/auth/verify', payload);
        state.sessionUser = res.user;
        return res;
      } catch (err) {
        if (attempt === 0 && err?.code === 'BAD_NONCE') {
          console.warn('wallet: nonce rejected — retrying once with a fresh nonce');
          continue;
        }
        throw err;
      }
    }
  }

  /** NIM payment (only meaningful inside Nimiq Pay). */
  /**
   * @param {{ recipient: string, nim: number, note?: string }} param0
   */
  async sendNim({ recipient, nim, note = '' }) {
    const value = Math.round(nim * 100000); // luna
    if (state.mode === 'hub') {
      const hubApi = await getHubApi();
      const result = await hubApi.checkout({ appName: APP_NAME, sender: state.address, recipient, value, ...(note ? { extraData: note } : {}) });
      return result.hash;
    }
    if (state.mode !== 'nimiqpay' || !state.nimiq) throw new Error('WALLET_NOT_CONNECTED');
    const tx = note
      ? await state.nimiq.sendBasicTransactionWithData({ recipient, value, data: note })
      : await state.nimiq.sendBasicTransaction({ recipient, value });
    return assertNotErrorResponse(tx, 'sendBasicTransaction');
  }

  /**
   * Sign an arbitrary message.
   * @param {string} message
   */
  async signMessage(message) {
    if (state.mode === 'nimiqpay' && state.nimiq) return state.nimiq.sign(message);
    if (state.mode === 'hub' && state.address) {
      const hubApi = await getHubApi();
      return hubApi.signMessage({ appName: APP_NAME, message, signer: state.address });
    }
    if (state.mode === 'demo' && state.demoKey) {
      const { nonce, message: msg } = await api.post('/api/auth/nonce', { subject: state.demoKey.publicKey });
      const r = await api.post('/api/wallet/demo/sign', { privateKey: state.demoKey.privateKey, message: msg });
      return { publicKey: state.demoKey.publicKey, signature: r.signature, message: msg, nonce };
    }
    throw new Error('WALLET_NOT_CONNECTED');
  }

  diagnostics() {
    const env = environment();
    return { environment: env.kind, hubAvailable: !!(windowWithMiniApp.HubApi || hubApiInstance), nimiqPayDetected: env.inNimiqPay, providerInjected: !!windowWithMiniApp.nimiq, sdkLoaded: !!state.nimiq, provider: state.mode, address: state.address, authenticated: !!state.sessionUser };
  }
}

export const WalletService = new WalletServiceClass();
