/**
 * WalletService — React/TypeScript port of the old wallet.js
 * 
 * Three modes:
 *  1. nimiqpay — real Nimiq Mini Apps environment (uses @nimiq/mini-app-sdk)
 *  2. hub — Nimiq Hub API for desktop browsers
 *  3. demo — browser demo wallet (server-issued Ed25519 keypair)
 */

import { api } from '../lib/api';

const SDK_CANDIDATES = [
  'https://esm.sh/@nimiq/mini-app-sdk',
  'https://cdn.jsdelivr.net/npm/@nimiq/mini-app-sdk/+esm',
];

const NIMIQ_PAY_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nimiq.pay';
const NIMIQ_PAY_MINI_APP_URL = 'https://nimpay.app/miniapps/open/proof.nimagent.online';

const HUB_VERSION = 'v1.10.0';
const HUB_CDN = `https://cdn.jsdelivr.net/npm/@nimiq/hub-api@${HUB_VERSION}/dist/standalone/HubApi.standalone.umd.js`;
const HUB_ENDPOINT = 'https://hub.nimiq.com';
const APP_NAME = 'PROOF';

interface WalletState {
  mode: 'nimiqpay' | 'hub' | 'demo' | null;
  nimiq: any;
  address: string | null;
  addresses: string[];
  demoKey: { publicKey: string; privateKey: string } | null;
  sessionUser: any;
}

const state: WalletState = {
  mode: null,
  nimiq: null,
  address: null,
  addresses: [],
  demoKey: null,
  sessionUser: null,
};

let hubApiInstance: any = null;
let hubApiLoadPromise: Promise<any> | null = null;

// Safe localStorage wrapper
const safeStorage = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string): void {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* sandboxed */
    }
  },
  del(k: string): void {
    try {
      localStorage.removeItem(k);
    } catch {
      /* sandboxed */
    }
  },
};

function withTimeout<T>(promise: Promise<T>, ms: number, tag = 'timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(tag)), ms)),
  ]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

async function loadScriptWithRetries(
  src: string,
  { attempts = 3, timeout = 8000, backoff = 2 } = {}
): Promise<boolean> {
  let lastErr: Error | null = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      console.debug(`wallet: loading script ${src} (attempt ${i}/${attempts})`);
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.crossOrigin = 'anonymous';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('SCRIPT_LOAD_ERROR'));
          document.head.append(s);
        }),
        timeout,
        'SCRIPT_LOAD_TIMEOUT'
      );
      return true;
    } catch (err) {
      lastErr = err as Error;
      console.warn(`wallet: script load failed for ${src} (attempt ${i}):`, err);
      if (i < attempts) await sleep(Math.round(timeout * Math.pow(backoff, i - 1)));
    }
  }
  throw lastErr || new Error('SCRIPT_LOAD_FAILED');
}

export function walletErrorCode(error: any): string {
  if (error?.code) return error.code;
  const message = String(error?.message || error || '');
  if (/cancel|reject|denied/i.test(message)) return 'USER_REJECTED';
  if (/timeout/i.test(message)) return 'HUB_TIMEOUT';
  return message || 'WALLET_ERROR';
}

export function bytesToHex(value: any): string {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array || ArrayBuffer.isView(value)) {
    const bytes =
      value instanceof Uint8Array
        ? value
        : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  if (Array.isArray(value) && value.every((b) => Number.isInteger(b) && b >= 0 && b <= 255)) {
    return Array.from(value, (b: number) => b.toString(16).padStart(2, '0')).join('');
  }
  if (value && typeof value.toHex === 'function') return value.toHex();
  throw new Error('UNSUPPORTED_BYTE_FORMAT');
}

// @ts-ignore
const windowWithMiniApp = window as Window & {
  nimiq?: any;
  nimiqPay?: { language?: string } & Record<string, any>;
  HubApi?: any;
};

function nimiqPayHostDetected(): boolean {
  if (windowWithMiniApp.nimiq) return true;
  const ctx = windowWithMiniApp.nimiqPay;
  return !!ctx && typeof ctx === 'object';
}

export interface Environment {
  inNimiqPay: boolean;
  desktop: boolean;
  kind: 'nimiqpay' | 'desktop' | 'mobile';
}

export function environment(): Environment {
  const inNimiqPay = nimiqPayHostDetected();
  let desktop = false;
  try {
    desktop = window.matchMedia('(min-width: 1024px)').matches;
  } catch {
    /* no matchMedia */
  }
  return {
    inNimiqPay,
    desktop,
    kind: inNimiqPay ? 'nimiqpay' : desktop ? 'desktop' : 'mobile',
  };
}

export function isDesktopLike(): boolean {
  return environment().kind === 'desktop';
}

async function loadHubApi(): Promise<any> {
  if (windowWithMiniApp.HubApi) return windowWithMiniApp.HubApi;
  if (!hubApiLoadPromise) {
    console.debug('[wallet] loading Hub API', { version: HUB_VERSION });
    hubApiLoadPromise = loadScriptWithRetries(HUB_CDN, {
      attempts: 2,
      timeout: 10000,
      backoff: 1.5,
    })
      .then(() => {
        if (!windowWithMiniApp.HubApi) throw new Error('HUB_API_UNAVAILABLE');
        return windowWithMiniApp.HubApi;
      })
      .catch(() => {
        hubApiLoadPromise = null;
        throw new Error('HUB_API_UNAVAILABLE');
      });
  }
  return hubApiLoadPromise;
}

async function getHubApi(): Promise<any> {
  if (hubApiInstance) return hubApiInstance;
  const HubApi = await loadHubApi();
  hubApiInstance = new HubApi(HUB_ENDPOINT);
  console.debug('[wallet] Hub API loaded');
  return hubApiInstance;
}

function openNimiqPayPlayStore(): void {
  if (typeof window === 'undefined') return;
  try {
    window.location.assign(NIMIQ_PAY_PLAY_STORE_URL);
  } catch {
    window.open(NIMIQ_PAY_PLAY_STORE_URL, '_blank', 'noopener,noreferrer');
  }
}

function openNimiqPayMiniApp(): void {
  if (typeof window === 'undefined') return;
  window.location.assign(NIMIQ_PAY_MINI_APP_URL);

  // If the deep link did not hand off to Nimiq Pay, send the user to install it.
  window.setTimeout(() => {
    if (document.visibilityState === 'visible') openNimiqPayPlayStore();
  }, 1800);
}

async function loadNimiqSdk(): Promise<any> {
  if (state.nimiq) return state.nimiq;
  
  // Fast path — the host injects the provider directly
  if (windowWithMiniApp.nimiq) {
    state.nimiq = windowWithMiniApp.nimiq;
    return state.nimiq;
  }
  
  // Inside Nimiq Pay but the provider isn't injected yet
  const inHost = nimiqPayHostDetected();
  if (inHost) {
    for (const url of SDK_CANDIDATES) {
      try {
        console.debug('wallet: attempting to import Nimiq SDK from', url);
        // @ts-ignore - Dynamic import for Nimiq SDK
        const mod = await withTimeout(import(/* @vite-ignore */ url), 8000, 'NIMIQ_SDK_IMPORT_TIMEOUT');
        if (mod?.init) {
          state.nimiq = await withTimeout(mod.init({ timeout: 10000 }), 12000, 'NIMIQ_SDK_INIT_TIMEOUT');
          return state.nimiq;
        }
      } catch (e) {
        console.warn('wallet: Nimiq SDK candidate failed:', e);
      }
    }
    throw new Error('NIMIQ_SDK_UNAVAILABLE');
  }
  
  // Outside Nimiq Pay, try the mini-app deep link first. The timeout fallback
  // covers browsers where Nimiq Pay is not installed.
  openNimiqPayMiniApp();
  throw new Error('NIMIQ_PAY_UNAVAILABLE');
}

function assertNotErrorResponse(result: any, what: string): any {
  if (result && typeof result === 'object' && !Array.isArray(result) && result.error != null) {
    throw Object.assign(
      new Error(String(result.error?.message || result.error || 'WALLET_ERROR')),
      { code: 'WALLET_ERROR', source: what }
    );
  }
  return result;
}

class WalletServiceClass {
  get mode() {
    return state.mode;
  }
  get address() {
    return state.address;
  }
  get isDemo() {
    return state.mode === 'demo';
  }
  get connected() {
    return !!state.mode;
  }

  restore() {
    try {
      const raw = safeStorage.get('proof_wallet');
      if (!raw) return null;
      const w = JSON.parse(raw);
      state.mode = w.mode;
      state.address = w.address || null;
      state.addresses = Array.isArray(w.addresses) ? w.addresses : state.address ? [state.address] : [];
      state.demoKey = w.demoKey || null;
      return w;
    } catch {
      return null;
    }
  }

  private persist() {
    safeStorage.set(
      'proof_wallet',
      JSON.stringify({
        mode: state.mode,
        address: state.address,
        addresses: state.addresses,
        demoKey: state.demoKey,
      })
    );
  }

  disconnect() {
    state.mode = null;
    state.address = null;
    state.addresses = [];
    state.demoKey = null;
    state.nimiq = null;
    safeStorage.del('proof_wallet');
  }

  async connectNimiqPay(username: string | null = null) {
    const nimiq = await loadNimiqSdk();
    const accounts = assertNotErrorResponse(
      await withTimeout(nimiq.listAccounts(), 15000, 'NIMIQ_ACCOUNTS_TIMEOUT'),
      'listAccounts'
    );
    
    const addresses = Array.isArray(accounts)
      ? accounts.filter((a: any): a is string => typeof a === 'string' && a.trim()).map((a) => a.trim())
      : [];
    const address = addresses[0] || null;
    if (!address) throw new Error('NO_ACCOUNTS');
    console.debug('[wallet] Nimiq Pay accounts returned', { count: addresses.length, addresses });
    
    const authResult = await this.authenticate(
      'nimiqpay',
      {
        address,
        addresses,
        signMessage: async (m: string) => {
          const result = assertNotErrorResponse(
            await withTimeout(nimiq.sign(m), 15000, 'NIMIQ_SIGN_TIMEOUT'),
            'sign'
          );
          if (!result?.publicKey || !result?.signature) throw new Error('MALFORMED_SIGNATURE_RESULT');
          return {
            publicKey: bytesToHex(result.publicKey),
            signature: bytesToHex(result.signature),
          };
        },
      },
      username
    );
    
    state.mode = 'nimiqpay';
    state.address = address;
    state.addresses = addresses;
    state.nimiq = nimiq;
    this.persist();
    return { mode: 'nimiqpay' as const, address, addresses, isNewUser: Boolean(authResult?.isNewUser) };
  }

  async connectDemo(username: string | null = null) {
    let demo = state.demoKey;
    if (!demo) {
      const created = await api.post<any>('/api/wallet/demo', {});
      demo = { publicKey: created.publicKey, privateKey: created.privateKey };
      state.demoKey = demo;
    }
    
    const authResult = await this.authenticate(
      'demo',
      {
        publicKey: demo.publicKey,
        signMessage: async (m: string) => {
          const r = await api.post<any>('/api/wallet/demo/sign', {
            privateKey: demo.privateKey,
            message: m,
          });
          return { publicKey: demo.publicKey, signature: r.signature };
        },
      },
      username
    );
    
    state.mode = 'demo';
    state.address = null;
    this.persist();
    return { mode: 'demo' as const, address: null, isNewUser: Boolean(authResult?.isNewUser) };
  }

  async connectNimiqHub(username: string | null = null) {
    try {
      const HubApi = windowWithMiniApp.HubApi;
      const hubApi = hubApiInstance || (HubApi ? (hubApiInstance = new HubApi(HUB_ENDPOINT)) : await getHubApi());
      
      console.debug('[wallet] chooseAddress started');
      const selected = await withTimeout(
        hubApi.chooseAddress({ appName: APP_NAME }),
        60000,
        'HUB_TIMEOUT'
      ) as { address?: string };
      const address = selected?.address;
      if (typeof address !== 'string' || !address.trim()) throw new Error('NO_ADDRESS_SELECTED');
      console.debug('[wallet] address selected', address);

      console.debug('[wallet] requesting nonce');
      const { nonce, message } = await api.post<any>('/api/auth/nonce', { subject: address });
      
      console.debug('[wallet] requesting signature');
      const signed = await withTimeout(
        hubApi.signMessage({ appName: APP_NAME, message, signer: address }),
        60000,
        'HUB_TIMEOUT'
      ) as { signer: string; signerPublicKey: Uint8Array; signature: Uint8Array };
      
      if (!signed?.signer || !signed.signerPublicKey || !signed.signature) {
        throw new Error('MALFORMED_HUB_RESPONSE');
      }
      if (String(signed.signer).replace(/\s+/g, ' ').trim() !== address.replace(/\s+/g, ' ').trim()) {
        throw new Error('HUB_SIGNER_MISMATCH');
      }
      console.debug('[wallet] signature received');

      const payload: any = {
        mode: 'hub',
        nonce,
        address,
        signer: signed.signer,
        publicKey: bytesToHex(signed.signerPublicKey),
        signature: bytesToHex(signed.signature),
      };
      if (username) payload.username = username;

      const res = await api.post<any>('/api/auth/verify', payload);
      state.mode = 'hub';
      state.address = address;
      state.sessionUser = res.user;
      this.persist();
      console.debug('[wallet] authenticated');
      return { mode: 'hub' as const, address, isNewUser: Boolean(res?.isNewUser) };
    } catch (err) {
      console.warn('wallet: connectNimiqHub failed:', err);
      const code = walletErrorCode(err);
      throw Object.assign(new Error(code), { cause: err });
    }
  }

  private async authenticate(mode: string, signer: any, username: string | null = null) {
    const subject = mode === 'nimiqpay' ? signer.address : signer.publicKey;
    
    for (let attempt = 0; ; attempt++) {
      const { nonce, message } = await api.post<any>('/api/auth/nonce', { subject });
      const signed = await signer.signMessage(message);
      
      const payload: any =
        mode === 'nimiqpay'
          ? {
              mode,
              nonce,
              address: signer.address,
              addresses: signer.addresses,
              publicKey: signed.publicKey,
              signature: signed.signature,
            }
          : { mode, nonce, publicKey: signed.publicKey, signature: signed.signature };
      
      if (username) payload.username = username;

      try {
        const res = await api.post<any>('/api/auth/verify', payload);
        state.sessionUser = res.user;
        return res;
      } catch (err: any) {
        if (attempt === 0 && err?.code === 'BAD_NONCE') {
          console.warn('wallet: nonce rejected — retrying once with a fresh nonce');
          continue;
        }
        throw err;
      }
    }
  }

  async sendNim({ recipient, nim, note = '' }: { recipient: string; nim: number; note?: string }) {
    const value = Math.round(nim * 100000); // luna
    
    if (state.mode === 'hub') {
      const hubApi = await getHubApi();
      const result = await hubApi.checkout({
        appName: APP_NAME,
        sender: state.address,
        recipient,
        value,
        ...(note ? { extraData: note } : {}),
      });
      return result.hash;
    }
    
    if (state.mode !== 'nimiqpay' || !state.nimiq) throw new Error('WALLET_NOT_CONNECTED');
    
    const tx = note
      ? await state.nimiq.sendBasicTransactionWithData({ recipient, value, data: note })
      : await state.nimiq.sendBasicTransaction({ recipient, value });
    
    return assertNotErrorResponse(tx, 'sendBasicTransaction');
  }

  async signMessage(message: string) {
    if (state.mode === 'nimiqpay' && state.nimiq) return state.nimiq.sign(message);
    
    if (state.mode === 'hub' && state.address) {
      const hubApi = await getHubApi();
      return hubApi.signMessage({ appName: APP_NAME, message, signer: state.address });
    }
    
    if (state.mode === 'demo' && state.demoKey) {
      const { nonce, message: msg } = await api.post<any>('/api/auth/nonce', {
        subject: state.demoKey.publicKey,
      });
      const r = await api.post<any>('/api/wallet/demo/sign', {
        privateKey: state.demoKey.privateKey,
        message: msg,
      });
      return { publicKey: state.demoKey.publicKey, signature: r.signature, message: msg, nonce };
    }
    
    throw new Error('WALLET_NOT_CONNECTED');
  }

  diagnostics() {
    const env = environment();
    return {
      environment: env.kind,
      hubAvailable: !!(windowWithMiniApp.HubApi || hubApiInstance),
      nimiqPayDetected: env.inNimiqPay,
      providerInjected: !!windowWithMiniApp.nimiq,
      sdkLoaded: !!state.nimiq,
      provider: state.mode,
      address: state.address,
      addresses: state.addresses,
      authenticated: !!state.sessionUser,
    };
  }
}

export const WalletService = new WalletServiceClass();
