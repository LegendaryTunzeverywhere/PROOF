-- ============================================================
-- FIX NONCES TABLE - Ensure message column exists
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop and recreate nonces table to ensure it has all columns
DROP TABLE IF EXISTS "nonces" CASCADE;

CREATE TABLE "nonces" (
  id TEXT PRIMARY KEY,
  nonce TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  subject TEXT,
  used BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX "idx_nonces_nonce" ON "nonces"(nonce) WHERE used = false;

SELECT 'Nonces table fixed! ✅' as status;
