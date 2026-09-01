-- ============================================================
-- FIX USER TABLE - Add missing columns
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add missing columns to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "proofsAttempted" INT DEFAULT 0;

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "usernameLower" TEXT;

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "streak" JSONB DEFAULT '{"current": 0, "longest": 0, "lastDay": null}';

-- Create index on usernameLower for case-insensitive lookups
CREATE INDEX IF NOT EXISTS "idx_user_username_lower" ON "User"("usernameLower");

SELECT 'User table fixed! ✅' as status;
