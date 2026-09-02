-- Add missing createdAt column to SponsoredChallenge table
-- This column is referenced in queries but doesn't exist in Supabase schema

ALTER TABLE "SponsoredChallenge" 
ADD COLUMN IF NOT EXISTS "createdAt" BIGINT DEFAULT 0;

-- Set createdAt to current timestamp for existing records
UPDATE "SponsoredChallenge"
SET "createdAt" = EXTRACT(EPOCH FROM NOW()) * 1000
WHERE "createdAt" = 0;
