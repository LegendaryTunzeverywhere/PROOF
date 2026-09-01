-- Fix sessions.createdAt to be BIGINT instead of TIMESTAMP
-- This is needed for HMAC signature validation to work correctly

-- Drop existing sessions (they're invalid anyway due to signature mismatch)
TRUNCATE TABLE "sessions";

-- Change createdAt to BIGINT (Unix timestamp in milliseconds)
ALTER TABLE "sessions" 
  ALTER COLUMN "createdAt" TYPE BIGINT 
  USING EXTRACT(EPOCH FROM "createdAt")::BIGINT * 1000;

-- Remove the DEFAULT NOW() since we'll provide values from the application
ALTER TABLE "sessions" 
  ALTER COLUMN "createdAt" DROP DEFAULT;

-- Add NOT NULL constraint
ALTER TABLE "sessions" 
  ALTER COLUMN "createdAt" SET NOT NULL;
