-- Add missing createdAt column to ChallengeAttempt table
-- This column is referenced in queries but doesn't exist in Supabase schema

ALTER TABLE "ChallengeAttempt" 
ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

-- Set createdAt to startedAt for existing records (convert TIMESTAMP to BIGINT milliseconds)
UPDATE "ChallengeAttempt"
SET "createdAt" = EXTRACT(EPOCH FROM "startedAt") * 1000
WHERE "createdAt" = 0;

-- Note: We use startedAt instead of submittedAt because:
-- 1. startedAt is NOT NULL (always exists)
-- 2. submittedAt can be NULL for in-progress attempts
-- 3. createdAt represents when the attempt was created, which is startedAt
