/**
 * Central configuration. Everything is env-driven; nothing is hardcoded per-user.
 * The in-app economy knobs here are SERVER-AUTHORITATIVE — clients can never
 * influence scores, XP, or NIM amounts.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

function loadDotEnv(file = '.env') {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const candidates = [
    process.env.ENV_FILE,
    path.resolve(process.cwd(), file),
    path.join(projectRoot, file),
  ].filter(Boolean);
  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
    }
    process.env[m[1]] = value;
  }
}

function parseApiKeys(primary, additional) {
  return [primary, additional]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}
loadDotEnv();

const int = (v, d) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const isProduction = process.env.NODE_ENV === 'production';
const defaultAllowedOrigins = isProduction
  ? 'https://proof.nimagent.online,https://proofnim.vercel.app'
  : '';

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 3000),
  dataDir: process.env.DATA_DIR || 'data',
  appUrl: process.env.APP_URL || (process.env.NODE_ENV === 'production'
    ? 'https://proof.nimagent.online'
    : `http://localhost:${int(process.env.PORT, 3000)}`),
  authSecret: process.env.AUTH_SECRET || `dev-secret-${crypto.randomBytes(16).toString('hex')}`,
  adminSecret: process.env.ADMIN_SECRET || '',
  demoWalletsEnabled: false,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || defaultAllowedOrigins)
    .split(',')
    .map((value) => String(value).trim())
    .filter(Boolean),

  ai: {
    provider: process.env.AI_PROVIDER || 'auto',   // auto | engine | gemini | cohere
    apiKey: process.env.AI_API_KEY || '',          // Google Gemini API key
    cohereApiKey: parseApiKeys(process.env.COHERE_API_KEY, process.env.COHERE_API_KEYS)[0] || '', // Cohere API key
    cohereApiKeys: parseApiKeys(process.env.COHERE_API_KEY, process.env.COHERE_API_KEYS),
    baseUrl: process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
    model: process.env.AI_MODEL || 'gemini-3.6-flash',
    cohereCurriculumModel: process.env.COHERE_MODEL_CURRICULUM || 'command-r-plus-08-2024',
    cohereTutorModel: process.env.COHERE_MODEL_TUTOR || 'command-r-08-2024',
    cohereEmbedModel: process.env.COHERE_EMBED_MODEL || 'embed-v4.0',
    cohereEmbedDimension: Number(process.env.COHERE_EMBED_DIMENSION || 1024),
    cohereEmbeddingsEnabled: process.env.COHERE_EMBEDDINGS_ENABLED === 'true',
  },

  nimiq: {
    rpcUrl: process.env.NIMIQ_RPC_URL || '',
    network: process.env.NIMIQ_NETWORK || 'mainnet',
    treasuryAddress: process.env.TREASURY_ADDRESS || '',
    treasuryKey: /^[0-9a-fA-F]{64}$/.test(process.env.TREASURY_KEY || '') ? process.env.TREASURY_KEY : '',
    treasuryMnemonic: process.env.TREASURY_MNEMONIC || (/\s/.test(process.env.TREASURY_KEY || '') ? process.env.TREASURY_KEY : ''),
    treasuryMnemonicPassword: process.env.TREASURY_MNEMONIC_PASSWORD || '',
    seedNodes: (process.env.NIMIQ_SEED_NODES || '').split(',').map((value) => value.trim()).filter(Boolean),
  },

  economy: {
    passThreshold: int(process.env.PASS_THRESHOLD, 70),
    dailyRewardCapNim: int(process.env.DAILY_REWARD_CAP_NIM, 15),
    dailyRewardedAttemptsCap: int(process.env.DAILY_REWARDED_ATTEMPTS_CAP, 12),
    minAttemptIntervalMs: int(process.env.MIN_ATTEMPT_INTERVAL_MS, 45_000),
    maxSubmissionBytes: int(process.env.MAX_SUBMISSION_BYTES, 200_000),
    streakReminderNotificationsEnabled: process.env.STREAK_REMINDER_NOTIFICATIONS_ENABLED !== 'false',
    streakReminderPayoutsEnabled: process.env.STREAK_REMINDER_PAYOUTS_ENABLED === 'true',
    streakReminderAmountLuna: int(process.env.STREAK_REMINDER_AMOUNT_LUNA, 100),
    streakReminderCooldownDays: int(process.env.STREAK_REMINDER_COOLDOWN_DAYS, 7),
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
    typingVerification: true,
  },
};

/** True when a real LLM provider is configured. */
export const aiEnabled = () =>
  config.ai.provider !== 'engine' && !!config.ai.apiKey;
/** True when automatic treasury payouts have all required settings. */
export const chainEnabled = () => Boolean(
  config.nimiq.treasuryAddress && treasuryKeyValid() && config.nimiq.rpcUrl,
);
export const treasuryCredentialsEnabled = () => Boolean(
  config.nimiq.treasuryAddress && (config.nimiq.treasuryKey || config.nimiq.treasuryMnemonic),
);
export const treasuryKeyValid = () => Boolean(
  /^[0-9a-fA-F]{64}$/.test(config.nimiq.treasuryKey)
  || config.nimiq.treasuryMnemonic,
);

export function validateConfig(logger = console) {
  const problems = [];
  if ((config.env === 'production' || process.env.DB_MODE === 'supabase') && !process.env.AUTH_SECRET) {
    const message = '[config] AUTH_SECRET must be set permanently in the deployment environment; refusing ephemeral sessions.';
    logger.error(message);
    throw new Error(message);
  }
  if (config.authSecret.startsWith('dev-secret-')) {
    logger.warn('[config] AUTH_SECRET not set — using an ephemeral dev secret (sessions reset on restart).');
  }
  if (!aiEnabled()) {
    logger.warn('[config] AI_API_KEY not set — using the local ProofEngine (deterministic evaluation).');
  }
  if (!chainEnabled()) {
    if (treasuryCredentialsEnabled() && !treasuryKeyValid()) {
      logger.error('[config] Treasury credentials are invalid — set TREASURY_MNEMONIC or a 64-character hexadecimal TREASURY_KEY; on-chain payouts are disabled.');
    } else if (treasuryCredentialsEnabled() && !config.nimiq.rpcUrl) {
      logger.warn('[config] Treasury credentials loaded, but NIMIQ_RPC_URL is missing — on-chain payouts are disabled.');
    } else {
      logger.warn('[config] NIMIQ_SEED_NODES, TREASURY_ADDRESS, or TREASURY_KEY not set — rewards settle to the in-app demo ledger (no on-chain txs).');
    }
  }
  return problems;
}
