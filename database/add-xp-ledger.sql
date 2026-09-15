-- Add the idempotent XP award ledger used by lesson, practice, and proof rewards.
-- Run this once against the production Supabase database.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "xpLedger" JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "User"."xpLedger" IS 'Deduplicated XP award events and amounts';
