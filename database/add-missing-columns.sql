-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Run this if you get "column does not exist" errors
-- ============================================================

-- Add auth tables if missing
CREATE TABLE IF NOT EXISTS "sessions" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "bootTime" BIGINT NOT NULL,
  "expiresAt" BIGINT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "nonces" (
  id TEXT PRIMARY KEY,
  nonce TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  subject TEXT,
  used BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_nonces_nonce" ON "nonces"(nonce) WHERE used = false;
CREATE INDEX IF NOT EXISTS "idx_sessions_user" ON "sessions"("userId");

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
