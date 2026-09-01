-- ============================================================
-- FIX USER TABLE - Add missing proofsAttempted column
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add proofsAttempted column to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "proofsAttempted" INT DEFAULT 0;

SELECT 'User table fixed! ✅' as status;
