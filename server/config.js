/**
 * Central configuration. Everything is env-driven; nothing is hardcoded per-user.
 * The in-app economy knobs here are SERVER-AUTHORITATIVE — clients can never
 * influence scores, XP, or NIM amounts.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function loadDotEnv(file = '.env') {
  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      if (process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch { /* no .env — fine */ }
}
loadDotEnv();

const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 3000),
  dataDir: process.env.DATA_DIR || 'data',
  appUrl: process.env.APP_URL || `http://localhost:${int(process.env.PORT, 3000)}`,
  authSecret: process.env.AUTH_SECRET || `dev-secret-${crypto.randomBytes(16).toString('hex')}`,

  ai: {
    provider: process.env.AI_PROVIDER || 'auto',   // auto | engine | gemini
    apiKey: process.env.AI_API_KEY || '',          // Google Gemini API key
    baseUrl: process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    model: process.env.AI_MODEL || 'gemini-2.5-flash',
  },

  nimiq: {
    rpcUrl: process.env.NIMIQ_RPC_URL || '',
    network: process.env.NIMIQ_NETWORK || 'mainnet',
    treasuryAddress: process.env.TREASURY_ADDRESS || '',
    treasuryKey: process.env.TREASURY_KEY || '',
  },

  economy: {
    passThreshold: int(process.env.PASS_THRESHOLD, 70),
    dailyRewardCapNim: int(process.env.DAILY_REWARD_CAP_NIM, 15),
    dailyRewardedAttemptsCap: int(process.env.DAILY_REWARDED_ATTEMPTS_CAP, 12),
    minAttemptIntervalMs: int(process.env.MIN_ATTEMPT_INTERVAL_MS, 45_000),
    maxSubmissionBytes: int(process.env.MAX_SUBMISSION_BYTES, 200_000),
    /** Skill tiers. Derived from completed proofs — never user-selected. */
    skillTiers: [
      { max: 20, name: 'Novice' },
      { max: 40, name: 'Beginner' },
      { max: 70, name: 'Intermediate' },
      { max: 90, name: 'Advanced' },
      { max: 100, name: 'Expert' },
    ],
    /** Platform fee on teaching/task payments, in basis points (2%). */
    feeBps: 200,
    /**
     * Typing verification (anti paste / anti AI-dump):
     * proofs must be hand-typed in the app. Client blocks paste/drop and
     * reports edit telemetry; the server rejects pastes and implausible
     * typing (too fast / too few edits for the content length).
     */
    typingVerification: (process.env.TYPING_VERIFICATION || 'on') !== 'off',
  },
};

/** True when a real LLM provider is configured. */
export const aiEnabled = () =>
  config.ai.provider !== 'engine' && !!config.ai.apiKey;
/** True when an on-chain Nimiq RPC is configured. */
export const chainEnabled = () => !!config.nimiq.rpcUrl;

export function validateConfig(logger = console) {
  const problems = [];
  if (config.authSecret.startsWith('dev-secret-')) {
    logger.warn('[config] AUTH_SECRET not set — using an ephemeral dev secret (sessions reset on restart).');
  }
  if (!aiEnabled()) {
    logger.warn('[config] AI_API_KEY not set — using the local ProofEngine (deterministic evaluation).');
  }
  if (!chainEnabled()) {
    logger.warn('[config] NIMIQ_RPC_URL not set — rewards settle to the in-app demo ledger (no on-chain txs).');
  }
  return problems;
}
