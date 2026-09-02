-- Comprehensive fix for all missing columns in Supabase
-- Run this script in your Supabase SQL Editor to add all missing columns
-- Uses IF NOT EXISTS to avoid errors

-- ============================================================
-- USER SKILLS TABLE
-- ============================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'UserSkill') THEN
    ALTER TABLE "UserSkill" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "UserSkill" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated UserSkill table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_skills') THEN
    ALTER TABLE "user_skills" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "user_skills" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated user_skills table';
  END IF;
END $$;

-- ============================================================
-- MARKETPLACE TASKS TABLE  
-- ============================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'MarketplaceTask') THEN
    ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
    ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "completedAt" BIGINT;
    ALTER TABLE "MarketplaceTask" ADD COLUMN IF NOT EXISTS "acceptedAt" BIGINT;
    RAISE NOTICE 'Updated MarketplaceTask table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marketplace_tasks') THEN
    ALTER TABLE "marketplace_tasks" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "marketplace_tasks" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
    ALTER TABLE "marketplace_tasks" ADD COLUMN IF NOT EXISTS "completedAt" BIGINT;
    ALTER TABLE "marketplace_tasks" ADD COLUMN IF NOT EXISTS "acceptedAt" BIGINT;
    RAISE NOTICE 'Updated marketplace_tasks table';
  END IF;
END $$;

-- ============================================================
-- TASK APPLICATIONS TABLE
-- ============================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'TaskApplication') THEN
    ALTER TABLE "TaskApplication" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "TaskApplication" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated TaskApplication table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_applications') THEN
    ALTER TABLE "task_applications" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "task_applications" ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated task_applications table';
  END IF;
END $$;

-- ============================================================
-- ALL OTHER TABLES (add more as needed)
-- ============================================================
DO $$ 
BEGIN
  -- Add columns to any table that exists, ignore if it doesn't
  
  -- Teaching Sessions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teaching_sessions') THEN
    ALTER TABLE "teaching_sessions" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated teaching_sessions table';
  END IF;
  
  -- Reviews
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
    ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated reviews table';
  END IF;
  
  -- Notifications
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated notifications table';
  END IF;
  
  -- Challenges
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'challenges') THEN
    ALTER TABLE "challenges" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated challenges table';
  END IF;
  
  -- Attempts
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attempts') THEN
    ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "attempts" ADD COLUMN IF NOT EXISTS "submittedAt" BIGINT;
    RAISE NOTICE 'Updated attempts table';
  END IF;
  
  -- Skill Proofs
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'skill_proofs') THEN
    ALTER TABLE "skill_proofs" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    ALTER TABLE "skill_proofs" ADD COLUMN IF NOT EXISTS "completedAt" BIGINT;
    RAISE NOTICE 'Updated skill_proofs table';
  END IF;
  
  -- Paths
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'paths') THEN
    ALTER TABLE "paths" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated paths table';
  END IF;
  
  -- Achievements
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'achievements') THEN
    ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "unlockedAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated achievements table';
  END IF;
  
  -- Transactions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
    ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated transactions table';
  END IF;
  
  -- Socratic Sessions
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'socratic_sessions') THEN
    ALTER TABLE "socratic_sessions" ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;
    RAISE NOTICE 'Updated socratic_sessions table';
  END IF;
  
  RAISE NOTICE '✅ All missing columns added successfully!';
END $$;
