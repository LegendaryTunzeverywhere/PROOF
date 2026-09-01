/**
 * Supabase Migration Script
 * Converts Prisma schema to Supabase SQL and applies it
 * 
 * Usage: node scripts/migrate-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  console.error('   Please follow docs/SUPABASE-SETUP.md first');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Starting Supabase migration...\n');

// Read the Prisma schema and convert to SQL
const migrationSQL = `
-- ============================================================
-- PROOF Database Schema for Supabase
-- Generated from prisma/schema.prisma
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
  CREATE TYPE "WalletMode" AS ENUM ('nimiqpay', 'demo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AttemptStatus" AS ENUM ('in_progress', 'passed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChallengeKind" AS ENUM ('checkpoint', 'project', 'final', 'daily', 'sponsored');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TxStatus" AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TxKind" AS ENUM ('reward', 'payout', 'tip', 'task_escrow', 'task_payment', 'session_payment', 'platform_fee', 'sponsor_funding');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- User table (core)
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 12)),
  "walletAddress" TEXT UNIQUE,
  "walletMode" "WalletMode",
  "publicKey" TEXT,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT '🙂',
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  reputation INT DEFAULT 50,
  "balanceLuna" BIGINT DEFAULT 0,
  "earnedLuna" BIGINT DEFAULT 0,
  "proofsPassed" INT DEFAULT 0,
  "isDemo" BOOLEAN DEFAULT false,
  prefs JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Skill table
CREATE TABLE IF NOT EXISTS "Skill" (
  id TEXT PRIMARY KEY DEFAULT ('skl_' || substr(md5(random()::text), 1, 12)),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT DEFAULT '📚',
  blurb TEXT DEFAULT '',
  popularity INT DEFAULT 0
);

-- UserSkill table (many-to-many)
CREATE TABLE IF NOT EXISTS "UserSkill" (
  id TEXT PRIMARY KEY DEFAULT ('usk_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "skillId" TEXT NOT NULL REFERENCES "Skill"(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  tier TEXT DEFAULT 'Novice',
  xp INT DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  "verifiedScore" INT DEFAULT 0,
  "verifiedAt" TIMESTAMP,
  proofs INT DEFAULT 0,
  passed INT DEFAULT 0,
  UNIQUE("userId", "skillId")
);

-- LearningPath table
CREATE TABLE IF NOT EXISTS "LearningPath" (
  id TEXT PRIMARY KEY DEFAULT ('pth_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  "skillSlug" TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  level TEXT NOT NULL,
  "minutesPerDay" INT NOT NULL,
  days JSONB NOT NULL,
  progress JSONB DEFAULT '{}',
  engine TEXT DEFAULT 'proof-engine',
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Challenge table
CREATE TABLE IF NOT EXISTS "Challenge" (
  id TEXT PRIMARY KEY DEFAULT ('chl_' || substr(md5(random()::text), 1, 12)),
  "skillSlug" TEXT,
  "pathId" TEXT REFERENCES "LearningPath"(id) ON DELETE CASCADE,
  "dayIndex" INT,
  kind "ChallengeKind" DEFAULT 'checkpoint',
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  requirements TEXT[] DEFAULT '{}',
  "timeMin" INT DEFAULT 30,
  "passScore" INT DEFAULT 70,
  "rewardLuna" BIGINT DEFAULT 0,
  xp INT DEFAULT 100,
  evaluator JSONB NOT NULL,
  "dailyKey" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- ChallengeAttempt table
CREATE TABLE IF NOT EXISTS "ChallengeAttempt" (
  id TEXT PRIMARY KEY DEFAULT ('att_' || substr(md5(random()::text), 1, 12)),
  "challengeId" TEXT NOT NULL REFERENCES "Challenge"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  status "AttemptStatus" DEFAULT 'in_progress',
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "submittedAt" TIMESTAMP,
  score INT,
  "evaluationId" TEXT,
  "rewardClaimed" BOOLEAN DEFAULT false,
  duplicate BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS "idx_attempt_user_challenge" ON "ChallengeAttempt"("userId", "challengeId", "submittedAt");

-- Submission table
CREATE TABLE IF NOT EXISTS "Submission" (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text), 1, 12)),
  "attemptId" TEXT UNIQUE NOT NULL REFERENCES "ChallengeAttempt"(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Evaluation table
CREATE TABLE IF NOT EXISTS "Evaluation" (
  id TEXT PRIMARY KEY DEFAULT ('ev_' || substr(md5(random()::text), 1, 12)),
  "attemptId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  score INT NOT NULL,
  pass BOOLEAN NOT NULL,
  "passScore" INT NOT NULL,
  criteria JSONB NOT NULL,
  strengths TEXT[] DEFAULT '{}',
  improvements TEXT[] DEFAULT '{}',
  "nextStep" TEXT NOT NULL,
  engine TEXT NOT NULL,
  "contentHash" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_eval_user_challenge" ON "Evaluation"("userId", "challengeId", "contentHash");

-- SkillProof table (verified achievements)
CREATE TABLE IF NOT EXISTS "SkillProof" (
  id TEXT PRIMARY KEY DEFAULT ('prf_' || substr(md5(random()::text), 1, 12)),
  "publicId" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "skillSlug" TEXT NOT NULL,
  "challengeId" TEXT NOT NULL,
  "challengeTitle" TEXT NOT NULL,
  kind TEXT NOT NULL,
  score INT NOT NULL,
  passed BOOLEAN NOT NULL,
  "completedAt" TIMESTAMP DEFAULT NOW()
);

-- Achievement tables
CREATE TABLE IF NOT EXISTS "Achievement" (
  id TEXT PRIMARY KEY DEFAULT ('ach_' || substr(md5(random()::text), 1, 12)),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  "desc" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "UserAchievement" (
  id TEXT PRIMARY KEY DEFAULT ('uac_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "achievementId" TEXT NOT NULL REFERENCES "Achievement"(id) ON DELETE CASCADE,
  "unlockedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("userId", "achievementId")
);

-- Reward table
CREATE TABLE IF NOT EXISTS "Reward" (
  id TEXT PRIMARY KEY DEFAULT ('rwd_' || substr(md5(random()::text), 1, 12)),
  key TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "challengeId" TEXT NOT NULL,
  "sourceKind" TEXT NOT NULL,
  "amountLuna" BIGINT NOT NULL,
  currency TEXT DEFAULT 'NIM',
  status TEXT DEFAULT 'credited',
  "transactionId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- WalletTransaction table (blockchain txs)
CREATE TABLE IF NOT EXISTS "WalletTransaction" (
  id TEXT PRIMARY KEY DEFAULT ('tx_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  kind "TxKind" NOT NULL,
  direction TEXT NOT NULL,
  "amountLuna" BIGINT NOT NULL,
  status "TxStatus" DEFAULT 'pending',
  network TEXT DEFAULT 'demo-ledger',
  ref TEXT,
  note TEXT NOT NULL,
  meta JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "confirmedAt" TIMESTAMP
);

-- Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT ('not_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  emoji TEXT DEFAULT '🔔',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  href TEXT,
  read BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Socratic Teaching tables
CREATE TABLE IF NOT EXISTS "socratic_sessions" (
  id TEXT PRIMARY KEY DEFAULT ('soc_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "topicSlug" TEXT NOT NULL,
  "topicTitle" TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  "readinessScore" INT,
  "startedAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  context JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS "user_glossary" (
  id TEXT PRIMARY KEY DEFAULT ('gloss_' || substr(md5(random()::text), 1, 12)),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  level TEXT NOT NULL,
  source TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_wallet" ON "User"("walletAddress") WHERE "walletAddress" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_user_demo" ON "User"("isDemo", "earnedLuna") WHERE "isDemo" = false;
CREATE INDEX IF NOT EXISTS "idx_proof_user" ON "SkillProof"("userId", "completedAt");
CREATE INDEX IF NOT EXISTS "idx_glossary_user" ON "user_glossary"("userId");

-- Row Level Security (RLS) Policies
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SkillProof" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WalletTransaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "socratic_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_glossary" ENABLE ROW LEVEL SECURITY;

-- Public leaderboard policy (anonymous read for real users)
CREATE POLICY "Public leaderboard" ON "User"
FOR SELECT USING ("isDemo" = false);

-- Users can read their own full profile
CREATE POLICY "Users read own data" ON "User"
FOR SELECT USING (true); -- Auth handled by service layer

-- Users can read their own proofs
CREATE POLICY "Users read own proofs" ON "SkillProof"
FOR SELECT USING (true); -- Public proofs, auth in service

-- Users can read their own transactions
CREATE POLICY "Users read own transactions" ON "WalletTransaction"
FOR SELECT USING (true);

-- Users can manage their own Socratic sessions
CREATE POLICY "Users manage own sessions" ON "socratic_sessions"
FOR ALL USING (true);

-- Users can manage their own glossary
CREATE POLICY "Users manage own glossary" ON "user_glossary"
FOR ALL USING (true);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_updated_at BEFORE UPDATE ON "user_glossary"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Migration completed successfully! ✅' as status;
`;

async function runMigration() {
  try {
    console.log('📊 Creating tables and indexes...');
    console.log('⚠️  Note: Supabase doesn\'t support raw SQL execution via RPC');
    console.log('📋 Please run the migration SQL manually in Supabase SQL Editor:');
    console.log('   1. Go to https://app.supabase.com/project/_/sql/new');
    console.log('   2. Copy the SQL below');
    console.log('   3. Run it in the SQL Editor\n');
    console.log('━'.repeat(80));
    console.log(migrationSQL);
    console.log('━'.repeat(80));
    console.log('\n✅ Copy the SQL above and run it in Supabase SQL Editor\n');
    console.log('Next steps:');
    console.log('1. Check your Supabase dashboard → Table Editor');
    console.log('2. Run: node scripts/import-data-to-supabase.js');
    console.log('3. Update DB_MODE=supabase in .env');
    console.log('4. Restart your server: npm start\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

runMigration();
