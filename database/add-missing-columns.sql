-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Run this if you get "column does not exist" errors
-- ============================================================

-- Add autoAccept to MarketplaceTask
ALTER TABLE "MarketplaceTask" 
ADD COLUMN IF NOT EXISTS "autoAccept" BOOLEAN DEFAULT false;

-- Add minProof to MarketplaceTask (JSON field for skill requirements)
ALTER TABLE "MarketplaceTask" 
ADD COLUMN IF NOT EXISTS "minProof" JSONB;

-- Make clientId nullable (some demo tasks might not have a client)
ALTER TABLE "MarketplaceTask" 
ALTER COLUMN "clientId" DROP NOT NULL;

-- Add createdAt to Skill (if missing)
ALTER TABLE "Skill" 
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW();

-- Refresh Supabase schema cache
-- (Supabase will auto-refresh after running this)
SELECT 'Missing columns added successfully! ✅' as status;
