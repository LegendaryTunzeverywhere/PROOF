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

/** Full environment detection — drives the connect sheet's option order. */
const browserWindow = typeof window === 'undefined' ? globalThis : window;
const windowWithMiniApp = /** @type {Window & typeof globalThis & {
  nimiqPay?: { active?: boolean },
  NimiqMiniApp?: unknown,
  HubApi?: any,
}} */ (browserWindow);

export function environment() {
  const inNimiqPay = !!(windowWithMiniApp.nimiqPay?.active || windowWithMiniApp.NimiqMiniApp);
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
  // The Nimiq Pay host may expose the provider directly:
  if (windowWithMiniApp.nimiqPay?.active || windowWithMiniApp.NimiqMiniApp) {
    for (const url of SDK_CANDIDATES) {
      try {
        console.debug('wallet: attempting to import Nimiq SDK from', url);
        const mod = await withTimeout(import(/* @vite-ignore */ url), 6000, 'NIMIQ_SDK_IMPORT_TIMEOUT');
        if (mod?.init) { state.nimiq = await withTimeout(mod.init(), 8000, 'NIMIQ_SDK_INIT_TIMEOUT'); return state.nimiq; }
      } catch (e) { console.warn('wallet: Nimiq SDK candidate failed:', e); }
    }
  }
  // Outside Nimiq Pay, trying the CDN still lets embedded hosts work;
    // It is intentionally not a fallback to demo; callers choose demo explicitly.
  for (const url of SDK_CANDIDATES) {
    try {
      console.debug('wallet: importing Nimiq SDK (fallback) from', url);
      const mod = await withTimeout(import(/* @vite-ignore */ url), 5000, 'NIMIQ_SDK_IMPORT_TIMEOUT');
      if (mod?.init) { state.nimiq = await withTimeout(mod.init(), 6000, 'NIMIQ_SDK_INIT_TIMEOUT'); return state.nimiq; }
    } catch (e) { console.warn('wallet: Nimiq SDK fallback candidate failed:', e); }
  }
  console.error('wallet: Nimiq Pay unavailable after attempts');
  throw new Error('NIMIQ_PAY_UNAVAILABLE');
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
    const accounts = await withTimeout(
      nimiq.listAccounts(),
      10000,
      'NIMIQ_ACCOUNTS_TIMEOUT'
    );
    if (!accounts?.length) throw new Error('NO_ACCOUNTS');
    const address = accounts[0];
    await this.#authenticate('nimiqpay', {
      address,
      /** @param {string} m */
      signMessage: async (m) => {
        const result = await withTimeout(
          nimiq.sign(m),
          10000,
          'NIMIQ_SIGN_TIMEOUT'
        );
        return result;
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

  /** nonce → signature → server verification → session (spec §22). */
  /**
   * nonce → signature → server verification → session (spec §22).
   * @param {string} mode
   * @param {any} signer
   */
  async #authenticate(mode, signer) {
    const subject = mode === 'nimiqpay' ? signer.address : signer.publicKey;
    const { nonce, message } = await api.post('/api/auth/nonce', { subject });
    const signed = await signer.signMessage(message);
    const payload = mode === 'nimiqpay'
      ? { mode, nonce, address: signer.address, publicKey: signed.publicKey, signature: signed.signature }
      : { mode, nonce, publicKey: signed.publicKey, signature: signed.signature };
    const res = await api.post('/api/auth/verify', payload);
    state.sessionUser = res.user;
    return res;
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
    const hash = note
      ? await state.nimiq.sendBasicTransactionWithData({ recipient, value, data: note })
      : await state.nimiq.sendBasicTransaction({ recipient, value });
    return hash;
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
    return { environment: env.kind, hubAvailable: !!(windowWithMiniApp.HubApi || hubApiInstance), nimiqPayDetected: env.inNimiqPay, sdkLoaded: !!state.nimiq, provider: state.mode, address: state.address, authenticated: !!state.sessionUser };
  }
}

export const WalletService = new WalletServiceClass();
