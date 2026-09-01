-- ============================================================
-- FIX WALLET MODE ENUM - Add 'hub' value
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add 'hub' to the WalletMode enum
ALTER TYPE "WalletMode" ADD VALUE IF NOT EXISTS 'hub';

SELECT 'WalletMode enum fixed! ✅' as status;
