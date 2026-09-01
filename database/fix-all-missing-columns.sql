-- Comprehensive fix for all missing columns in Supabase
-- Run this script in your Supabase SQL Editor to add all missing columns

-- ============================================================
-- USER SKILLS TABLE
-- ============================================================
ALTER TABLE "UserSkill" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "UserSkill" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;

-- ============================================================
-- MARKETPLACE TASKS TABLE  
-- ============================================================
ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "completedAt" BIGINT;
ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "acceptedAt" BIGINT;

-- ============================================================
-- TASK APPLICATIONS TABLE
-- ============================================================
ALTER TABLE "TaskApplication" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "TaskApplication" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
ALTER TABLE "TaskApplication" ADD COLUMN IF NOT EXISTS "acceptedAt" BIGINT;
ALTER TABLE "TaskApplication" ADD COLUMN IF NOT EXISTS "completedAt" BIGINT;

-- ============================================================
-- TEACHING SESSIONS TABLE
-- ============================================================
ALTER TABLE "TeachingSession" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "TeachingSession" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
ALTER TABLE "TeachingSession" ADD COLUMN IF NOT EXISTS "scheduledAt" BIGINT;

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "readAt" BIGINT;

-- ============================================================
-- CHALLENGES TABLE
-- ============================================================
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;

-- ============================================================
-- ATTEMPTS TABLE
-- ============================================================
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "submittedAt" BIGINT;
ALTER TABLE "Attempt" ADD COLUMN IF NOT EXISTS "evaluatedAt" BIGINT;

-- ============================================================
-- SKILL PROOFS TABLE
-- ============================================================
ALTER TABLE "SkillProof" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "SkillProof" ADD COLUMN IF NOT EXISTS "completedAt" BIGINT;
ALTER TABLE "SkillProof" ADD COLUMN IF NOT EXISTS "verifiedAt" BIGINT;

-- ============================================================
-- PATHS TABLE
-- ============================================================
ALTER TABLE "Path" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "Path" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;

-- ============================================================
-- ACHIEVEMENTS TABLE
-- ============================================================
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "unlockedAt" BIGINT DEFAULT 0;

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

-- ============================================================
-- SOCRATIC SESSIONS TABLE
-- ============================================================
ALTER TABLE "socratic_sessions" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
ALTER TABLE "socratic_sessions" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;

-- ============================================================
-- MASTERY BADGES TABLE
-- ============================================================
ALTER TABLE "mastery_badges" ADD COLUMN IF NOT EXISTS "earnedAt" BIGINT DEFAULT 0;

-- ============================================================
-- PRINT SUCCESS MESSAGE
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE 'All missing columns added successfully!';
  RAISE NOTICE 'Tables updated: UserSkill, MarketplaceTask, TaskApplication, TeachingSession, Review, Notification, Challenge, Attempt, SkillProof, Path, Achievement, Transaction, socratic_sessions, mastery_badges';
END $$;
