-- Add role-specific reputation values used by the marketplace and profiles.
-- Run this once against the production Supabase database.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "clientReputation" INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS "applicantReputation" INT NOT NULL DEFAULT 50;

COMMENT ON COLUMN "User"."clientReputation" IS 'Reputation earned as a client';
COMMENT ON COLUMN "User"."applicantReputation" IS 'Reputation earned as an applicant';