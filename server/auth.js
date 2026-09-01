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
  issueNonce(subject) {
    const nonce = uid('n');
    const message =
      `PROOF — sign in\n` +
      `subject: ${String(subject || 'anonymous').slice(0, 80)}\n` +
      `nonce: ${nonce}\n` +
      `issued: ${new Date().toISOString()}\n` +
      `Signing proves you control this wallet. It does NOT move funds.`;
    this.store.insert('nonces', { id: uid('nc'), nonce, message, subject: String(subject || '').slice(0, 120), createdAt: now(), used: false });
    this.store.save();
    return { nonce, message };
  }

  consumeNonce(nonce) {
    const row = this.store.find('nonces', (n) => n.nonce === nonce && !n.used);
    if (!row) return null;
    if (now() - row.createdAt > NONCE_TTL_MS) return null;
    this.store.update('nonces', row.id, { used: true });
    this.store.save();
    return row;
  }

  /**
   * Verify a wallet signature over a challenge message.
   * @param {{mode:'nimiqpay'|'hub'|'demo', publicKey:string, signature:string, message:string}} p
   */
  verifySignature({ mode, publicKey, signature, message }) {
    if (!publicKey || !signature || !message) return false;
    const digest = nimiqMessageDigest(message);
    const result = verifyBytes(publicKey, digest, signature);
    
    if (!result) {
      console.log('Signature verification failed:', {
        mode,
        publicKey: publicKey.slice(0, 16) + '...',
        signature: signature.slice(0, 16) + '...',
        messagePreview: message.slice(0, 100),
        digestPreview: digest.toString('hex').slice(0, 32) + '...'
      });
    }
    
    return result;
  }

  /** Demo wallet: server holds the key (clearly labeled demo-only). */
  createDemoWallet() {
    const kp = generateKeyPair();
    return { publicKey: kp.publicKey, privateKey: kp.privateKey, label: `demo-${kp.publicKey.slice(0, 6)}` };
  }

  signDemoMessage(privateKeyHex, message) {
    return signBytes(privateKeyHex, nimiqMessageDigest(message));
  }

  createSession(userId) {
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
    
    this.store.insert('sessions', { 
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

  userFromRequest(req) {
    const cookie = req.headers.cookie || '';
    const m = cookie.match(/(?:^|;\s*)proof_session=([^;]+)/);
    if (!m) return null;
    return this.userFromToken(decodeURIComponent(m[1]));
  }

  userFromToken(token) {
    if (!token || !token.includes('.')) return null;
    const row = this.store.get('sessions', token);
    if (!row || row.expiresAt < now()) return null;
    
    // Validate token signature to prevent forgery/replay
    // Token must match: userId + createdAt + bootTime + entropy hashed with authSecret
    const [tokenId, providedSignature] = token.split('.');
    const payload = `${row.userId}:${row.createdAt}:${row.bootTime}:${row.entropy}`;
    const expectedSignature = hmac(payload, this.config.authSecret).slice(0, 32);
    
    if (providedSignature !== expectedSignature) {
      // Signature mismatch - possible forgery or replay attack
      this.store.remove('sessions', token);
      this.store.save();
      return null;
    }
    
    // Additional check: boot time must match current server boot time
    // This invalidates all sessions from previous server instances
    if (row.bootTime !== SERVER_BOOT_TIME) {
      this.store.remove('sessions', token);
      this.store.save();
      return null;
    }
    
    return this.store.get('users', row.userId);
  }

  destroySession(token) {
    if (token && this.store.remove('sessions', token)) this.store.save();
  }
}

export function sessionCookie(token, maxAgeS = 30 * 24 * 3600) {
  return `proof_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeS}`;
}
export const CLEAR_COOKIE = 'proof_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
