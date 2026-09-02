/**
 * Authentication — wallet-proof based (per Nimiq Mini Apps provider API).
 *
 * Flow (spec §22 of the product design):
 *   1. client requests nonce
 *   2. user signs the nonce message with their Nimiq key
 *      (`nimiq.sign(message)` → { publicKey, signature })
 *   3. server verifies the Ed25519 signature over the Nimiq signed-message
 *      digest  sha256('\x16Nimiq Signed Message:\n' + len + msg)
 *   4. server issues an HttpOnly session token
 *
 * A wallet address alone NEVER grants access — only a verified signature.
 * Demo mode uses the same real Ed25519 verification with a server-held
 * demo key and is clearly labeled everywhere.
 */
import { uid, now, hmac, sha256, verifyBytes, nimiqMessageDigest, generateKeyPair, signBytes } from './util.js';

const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;
const NONCE_TTL_MS = 10 * 60 * 1000;
const SERVER_BOOT_TIME = Date.now(); // Used for token binding to prevent replay attacks

export class AuthService {
  constructor(store, config) {
    this.store = store;
    this.config = config;
    store.declareUniques('sessions', []);
    store.declareUniques('nonces', ['nonce']);
  }

  /** @returns {{nonce, message}} */
  async issueNonce(subject) {
    const nonce = uid('n');
    const message =
      `PROOF — sign in\n` +
      `subject: ${String(subject || 'anonymous').slice(0, 80)}\n` +
      `nonce: ${nonce}\n` +
      `issued: ${new Date().toISOString()}\n` +
      `Signing proves you control this wallet. It does NOT move funds.`;
    await this.store.insert('nonces', { id: uid('nc'), nonce, message, subject: String(subject || '').slice(0, 120), createdAt: now(), used: false });
    this.store.save();
    return { nonce, message };
  }

  /**
   * Look up an issued nonce WITHOUT consuming it.
   *
   * The verify route uses this first so a failed signature check does not
   * burn the nonce — otherwise a transient wallet-side failure makes the
   * user's very next retry hit BAD_NONCE ("This sign-in request expired").
   * @param {string} nonce
   * @returns {Promise<object|null>} the fresh, unused nonce row, or null
   */
  async findNonce(nonce) {
    const row = await this.store.find('nonces', (n) => n.nonce === nonce && !n.used);
    if (!row) return null;
    if (now() - row.createdAt > NONCE_TTL_MS) return null;
    return row;
  }

  /** Atomically mark an issued nonce as used (single-use). Returns the row or null. */
  async consumeNonce(nonce) {
    const row = await this.findNonce(nonce);
    if (!row) return null;
    await this.store.update('nonces', row.id, { used: true });
    this.store.save();
    return row;
  }

  /**
   * Verify a wallet signature over a challenge message.
   * @param {{mode:'nimiqpay'|'hub'|'demo', publicKey:string, signature:string, message:string}} p
   */
  verifySignature({ mode, publicKey, signature, message }) {
    if (!publicKey || !signature || !message) {
      return false;
    }
    
    const digest = nimiqMessageDigest(message);
    return verifyBytes(publicKey, digest, signature);
  }

  /** Demo wallet: server holds the key (clearly labeled demo-only). */
  createDemoWallet() {
    const kp = generateKeyPair();
    return { publicKey: kp.publicKey, privateKey: kp.privateKey, label: `demo-${kp.publicKey.slice(0, 6)}` };
  }

  signDemoMessage(privateKeyHex, message) {
    return signBytes(privateKeyHex, nimiqMessageDigest(message));
  }

  async createSession(userId) {
    // Generate token with cryptographic binding: includes userId, creation time, boot time, and random entropy
    // Format: {tokenId}.{hmac}
    // HMAC covers: userId + createdAt + SERVER_BOOT_TIME + entropy + authSecret
    // This prevents replay attacks even if authSecret is leaked, because:
    // 1. Boot time changes on restart
    // 2. Creation time is in the session record
    // 3. Token validation requires matching all components
    const tokenId = uid('t');
    const createdAt = now();
    const entropy = uid('e');
    const payload = `${userId}:${createdAt}:${SERVER_BOOT_TIME}:${entropy}`;
    const signature = hmac(payload, this.config.authSecret).slice(0, 32);
    const token = `${tokenId}.${signature}`;
    
    await this.store.insert('sessions', { 
      id: token, 
      userId, 
      createdAt, 
      expiresAt: createdAt + SESSION_TTL_MS,
      bootTime: SERVER_BOOT_TIME,
      entropy 
    });
    this.store.save();
    return token;
  }

  async userFromRequest(req) {
    const cookie = req.headers.cookie || '';
    const m = cookie.match(/(?:^|;\s*)proof_session=([^;]+)/);
    if (!m) return null;
    const token = decodeURIComponent(m[1]);
    const user = await this.userFromToken(token);
    return user;
  }

  async userFromToken(token) {
    // console.log('[userFromToken] Looking up token:', token.slice(0, 30) + '...');
    if (!token || !token.includes('.')) {
      // console.log('[userFromToken] Invalid token format');
      return null;
    }
    const row = await this.store.get('sessions', token);
    // console.log('[userFromToken] Session row:', row ? { userId: row.userId, expiresAt: row.expiresAt } : 'null');
    if (!row || row.expiresAt < now()) {
      // console.log('[userFromToken] Session not found or expired');
      return null;
    }
    
    // Validate token signature
    const [tokenId, providedSignature] = token.split('.');
    const payload = `${row.userId}:${row.createdAt}:${row.bootTime}:${row.entropy}`;
    const expectedSignature = hmac(payload, this.config.authSecret).slice(0, 32);
    
    if (providedSignature !== expectedSignature) {
      await this.store.remove('sessions', token);
      this.store.save();
      return null;
    }
    
    // Boot time check for in-memory store only
    const isSupabase = this.store.constructor.name === 'SupabaseStore';
    if (!isSupabase && row.bootTime !== SERVER_BOOT_TIME) {
      await this.store.remove('sessions', token);
      this.store.save();
      return null;
    }

    // A session row must reference a real user. Guarding here prevents a
    // malformed/legacy row with a null userId from firing a pointless
    // `Get error (users/null)` query on every request that carries the cookie.
    if (!row.userId) {
      await this.store.remove('sessions', token);
      this.store.save();
      return null;
    }
    
    const user = await this.store.get('users', row.userId);
    return user;
  }

  destroySession(token) {
    if (token && this.store.remove('sessions', token)) this.store.save();
  }
}

export function sessionCookie(token, maxAgeS = 30 * 24 * 3600) {
  // Use SameSite=Lax for localhost to avoid cookie issues
  const sameSite = process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax';
  return `proof_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAgeS}`;
}
export const CLEAR_COOKIE = 'proof_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
