-- ============================================================
-- FIX SESSIONS TABLE - Add missing entropy column
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add entropy column to sessions table
ALTER TABLE "sessions" 
ADD COLUMN IF NOT EXISTS "entropy" TEXT;

SELECT 'Sessions table fixed! ✅' as status;
