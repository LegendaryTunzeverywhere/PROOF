-- ============================================================================
-- Fix: LearningPath is missing columns the app code writes at insert time.
--
-- Symptoms in the backend logs:
--   * Boot / seed crash:
--       Error: Insert failed: Could not find the 'skillEmoji' column of
--       'LearningPath' in the schema cache          (server/supabase-store.js)
--   * POST /api/paths 500:
--       TypeError: pathRow.days is not iterable     (server/index.js)
--
-- The curriculum upgrade (PR #1) made the app persist skillName / skillEmoji /
-- totalXp on every learning path, but deployments created before that change
-- never had those columns added to their existing "LearningPath" table.
--
-- Run this ONCE against the Supabase SQL editor (or psql as the owning role),
-- then redeploy/restart the app. It is idempotent — safe to run again.
-- ============================================================================

ALTER TABLE "LearningPath"
  ADD COLUMN IF NOT EXISTS "skillName" TEXT    NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "skillEmoji" TEXT   NOT NULL DEFAULT '📘',
  ADD COLUMN IF NOT EXISTS "totalXp"   INTEGER NOT NULL DEFAULT 0;

-- Existing rows keep sensible display defaults:
UPDATE "LearningPath"
   SET "skillName"  = COALESCE(NULLIF("skillName", ''), "goal"),
       "skillEmoji" = COALESCE(NULLIF("skillEmoji", ''), '📘')
 WHERE "skillName" = '' OR "skillEmoji" = '';

-- Refresh PostgREST's schema cache so inserts accept the columns immediately
-- (no need to wait for the automatic reload).
NOTIFY pgrst, 'reload schema';
