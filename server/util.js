/**
 * Shared utilities: ids, hashing, Ed25519 (real crypto for wallet auth),
 * Nimiq signed-message format, rate limiting, and a tiny schema validator
 * used to validate EVERY AI output before it touches the database.
 */
import crypto from 'node:crypto';

export const now = () => Date.now();
export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${crypto.randomBytes(6).toString('hex')}`;

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const hmac = (s, secret) => crypto.createHmac('sha256', secret).update(s).digest('hex');

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const luna = (nim) => Math.round(nim * 100_000);       // 1 NIM = 100,000 luna
export const toNim = (lunas) => Math.round(lunas) / 100_000;
export const fmtNim = (lunas) => {
  const n = toNim(lunas);
  return (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2)) + ' NIM';
};
export const escapeHtml = (s = '') => String(s)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

/** Deterministic pick from a string seed — stable "daily" selections. */
export function seededPick(seed, list) {
  let h = 2166136261;
  for (const c of String(seed)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return list[Math.abs(h) % list.length];
}

// ── Ed25519 ─────────────────────────────────────────────────────────
// Nimiq keys are Ed25519. Node can verify raw 32-byte public keys by
// wrapping them in a minimal SPKI structure.
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');

export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const pub = publicKey.export({ format: 'der', type: 'spki' }).subarray(12); // raw 32 bytes
  const priv = privateKey.export({ format: 'der', type: 'pkcs8' }).subarray(16);
  return { publicKey: pub.toString('hex'), privateKey: priv.toString('hex') };
}

/** Sign a message buffer with a raw 32-byte Ed25519 private key (hex). */
export function signBytes(privHex, msgBuf) {
  const key = crypto.createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, Buffer.from(privHex, 'hex')]),
    format: 'der', type: 'pkcs8',
  });
  return crypto.sign(null, msgBuf, key).toString('hex');
}

/** Verify a hex signature over a message buffer with a raw Ed25519 public key (hex). */
export function verifyBytes(pubHex, msgBuf, sigHex) {
  try {
    const key = crypto.createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(pubHex, 'hex')]),
      format: 'der', type: 'spki',
    });
    return crypto.verify(null, msgBuf, key, Buffer.from(sigHex, 'hex'));
  } catch { return false; }
}

/**
 * Nimiq signed-message format (as used by Nimiq Pay / Hub signMessage):
 *   sign( sha256( '\x16Nimiq Signed Message:\n' + byteLength + message ) )
 */
export const NIMIQ_MSG_PREFIX = '\x16Nimiq Signed Message:\n';
export function nimiqMessageDigest(message) {
  const msg = Buffer.from(String(message), 'utf8');
  return Buffer.concat([
    Buffer.from(NIMIQ_MSG_PREFIX + msg.length, 'utf8'),
    msg,
  ]).length > 0
    ? crypto.createHash('sha256')
        .update(Buffer.concat([Buffer.from(NIMIQ_MSG_PREFIX + msg.length, 'utf8'), msg]))
        .digest()
    : Buffer.alloc(32);
}

export function verifyNimiqSignature(pubHex, message, sigHex) {
  return verifyBytes(pubHex, nimiqMessageDigest(message), sigHex);
}

// ── Rate limiting (in-memory sliding window; per-instance MVP) ──────
export class RateLimiter {
  #hits = new Map();
  /**
   * @returns {true | {retryInMs:number}} true when allowed
   */
  allow(key, limit, windowMs) {
    const t = now();
    const arr = (this.#hits.get(key) || []).filter((x) => t - x < windowMs);
    if (arr.length >= limit) {
      this.#hits.set(key, arr);
      return { retryInMs: windowMs - (t - arr[0]) };
    }
    arr.push(t);
    this.#hits.set(key, arr);
    return true;
  }
  allowOncePer(key, windowMs) {
    return this.allow(key, 1, windowMs);
  }
}

// ── Tiny schema validator (for AI outputs & API payloads) ───────────
/**
 * schema: { type:'object'|'array'|'string'|'number'|'integer'|'boolean',
 *           props:{...}, required:[...], items:schema, min, max, enum:[...] }
 */
export function validate(value, schema, path = '$') {
  const errs = [];
  const t = schema.type;
  const typeOk =
    (t === 'object' && typeof value === 'object' && value !== null && !Array.isArray(value)) ||
    (t === 'array' && Array.isArray(value)) ||
    (t === 'string' && typeof value === 'string') ||
    (t === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
    (t === 'integer' && Number.isInteger(value)) ||
    (t === 'boolean' && typeof value === 'boolean') ||
    t === undefined;
  if (!typeOk) { errs.push(`${path}: expected ${t}`); return errs; }
  if (schema.enum && !schema.enum.includes(value)) errs.push(`${path}: not in enum`);
  if (typeof value === 'string' && schema.min !== undefined && value.length < schema.min)
    errs.push(`${path}: too short (min ${schema.min})`);
  if (typeof value === 'string' && schema.max !== undefined && value.length > schema.max)
    errs.push(`${path}: too long (max ${schema.max})`);
  if ((t === 'number' || t === 'integer') && schema.min !== undefined && value < schema.min)
    errs.push(`${path}: below min`);
  if ((t === 'number' || t === 'integer') && schema.max !== undefined && value > schema.max)
    errs.push(`${path}: above max`);
  if (t === 'object') {
    for (const k of schema.required || [])
      if (value[k] === undefined) errs.push(`${path}.${k}: required`);
    for (const [k, s] of Object.entries(schema.props || {}))
      if (value[k] !== undefined) errs.push(...validate(value[k], s, `${path}.${k}`));
  }
  if (t === 'array' && schema.items)
    value.forEach((v, i) => errs.push(...validate(v, schema.items, `${path}[${i}]`)));
  return errs;
}

/** Human-readable Nimiq address shape check (NQ + 32 chars base32-ish). */
export const looksLikeNimiqAddress = (s) =>
  typeof s === 'string' && /^NQ[0-9A-Z ]{30,60}$/.test(s.replace(/\s+/g, ' ').trim());

/** Derive the checksummed user-friendly basic-account address from an Ed25519 key. */
export function nimiqAddressFromPublicKey(pubHex) {
  if (typeof pubHex !== 'string' || !/^[0-9a-f]{64}$/i.test(pubHex)) return null;
  const digest = crypto.createHash('blake2b512').update(Buffer.from(pubHex, 'hex')).digest().subarray(0, 20);
  const alphabet = '0123456789ABCDEFGHJKLMNPQRSTUVXY';
  let n = BigInt('0x' + digest.toString('hex'));
  let plain = '';
  for (let i = 0; i < 32; i++) { plain = alphabet[Number(n & 31n)] + plain; n >>= 5n; }
  const rearranged = 'NQ00' + plain;
  let remainder = 0;
  for (const ch of rearranged) {
    const value = ch >= 'A' && ch <= 'Z' ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of String(value)) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  const checksum = String(98 - remainder).padStart(2, '0');
  return `NQ${checksum}${plain}`.replace(/(.{4})/g, '$1 ').trim();
}


/**
 * Parse and validate a number from user input with bounds checking.
 * Prevents type coercion exploits like "5e20" or malformed strings.
 * @param {any} value - The value to parse
 * @param {{min?:number, max?:number, default?:number}} opts - Validation options
 * @returns {number} - Validated number
 */
export function parseNumber(value, opts = {}) {
  const { min = -Infinity, max = Infinity, default: defaultValue } = opts;
  
  // If value is missing or null/undefined, return default
  if (value === null || value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error('Number value is required');
  }
  
  // Parse as float, rejecting scientific notation exploits
  const str = String(value).trim();
  if (/[eE]/.test(str)) throw new Error('Scientific notation not allowed');
  
  const num = parseFloat(str);
  if (!Number.isFinite(num)) throw new Error('Invalid number');
  if (num < min) throw new Error(`Number must be at least ${min}`);
  if (num > max) throw new Error(`Number must be at most ${max}`);
  
  return num;
}

/**
 * Parse and validate an integer from user input.
 * @param {any} value - The value to parse
 * @param {{min?:number, max?:number, default?:number}} opts - Validation options
 * @returns {number} - Validated integer
 */
export function parseInt(value, opts = {}) {
  const num = parseNumber(value, opts);
  return Math.floor(num);
}
