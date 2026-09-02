-- Add all missing createdAt columns to various tables
-- These columns are referenced by convertTimestamps but don't exist in Supabase

-- 1. ChallengeAttempt (already done, but included for completeness)
ALTER TABLE "ChallengeAttempt" 
ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

UPDATE "ChallengeAttempt"
SET "createdAt" = EXTRACT(EPOCH FROM "startedAt") * 1000
WHERE "createdAt" = 0;

-- 2. SponsoredChallenge
ALTER TABLE "SponsoredChallenge" 
ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

UPDATE "SponsoredChallenge"
SET "createdAt" = EXTRACT(EPOCH FROM NOW()) * 1000
WHERE "createdAt" = 0;

-- 3. Achievement
ALTER TABLE "Achievement" 
ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

UPDATE "Achievement"
SET "createdAt" = EXTRACT(EPOCH FROM NOW()) * 1000
WHERE "createdAt" = 0;

-- 4. MasteryBadge
ALTER TABLE "MasteryBadge" 
ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

UPDATE "MasteryBadge"
SET "createdAt" = EXTRACT(EPOCH FROM NOW()) * 1000
WHERE "createdAt" = 0;

-- Note: UserStats doesn't need createdAt - it uses userId as primary key
-- The error is because convertTimestamps tries to convert it, but we can handle that differently
