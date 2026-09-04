-- ============================================================================
-- Fix: socratic_sessions / user_glossary columns the app writes at insert time.
--
-- Symptoms:
--   POST /api/socratic/start 500
--     Insert failed: Could not find the 'questions' / 'context' / 'startedAt'
--     column of 'socratic_sessions' in the schema cache
--
-- Run ONCE in the Supabase SQL editor. Idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS socratic_sessions (
  id TEXT PRIMARY KEY,
  "userId" TEXT,
  type TEXT,
  "topicSlug" TEXT,
  "topicTitle" TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  responses JSONB DEFAULT '[]'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  "currentQuestionIndex" INTEGER DEFAULT 0,
  "startedAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE socratic_sessions
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS "topicSlug" TEXT,
  ADD COLUMN IF NOT EXISTS "topicTitle" TEXT,
  ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS responses JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "currentQuestionIndex" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS user_glossary (
  id TEXT PRIMARY KEY,
  "userId" TEXT,
  term TEXT,
  definition TEXT,
  level TEXT,
  source TEXT,
  "masteryScore" INTEGER DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "lastReviewedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_glossary
  ADD COLUMN IF NOT EXISTS "userId" TEXT,
  ADD COLUMN IF NOT EXISTS term TEXT,
  ADD COLUMN IF NOT EXISTS definition TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS "masteryScore" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastReviewedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();

NOTIFY pgrst, 'reload schema';
