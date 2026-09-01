-- ============================================================
-- CLEANUP SCRIPT: Remove Incorrectly Created Tables
-- Run this ONLY if you ran the Prisma migration files
-- ============================================================

-- This script drops tables that may have been created with
-- incorrect names (lowercase) from Prisma migration files.
-- After running this, run database/complete-migration.sql

-- Drop tables from add_socratic_teaching.sql (if they exist with wrong names)
DROP TABLE IF EXISTS group_discussions CASCADE;
DROP TABLE IF EXISTS study_groups CASCADE;
DROP TABLE IF EXISTS code_reviews CASCADE;
DROP TABLE IF EXISTS checkpoint_responses CASCADE;
DROP TABLE IF EXISTS lesson_checkpoints CASCADE;
DROP TABLE IF EXISTS user_project_progress CASCADE;
DROP TABLE IF EXISTS project_tracks CASCADE;
DROP TABLE IF EXISTS skill_dependencies CASCADE;
DROP TABLE IF EXISTS user_glossary CASCADE;  -- lowercase version
DROP TABLE IF EXISTS socratic_sessions CASCADE;  -- lowercase version

-- Note: We keep "socratic_sessions" and "user_glossary" with quotes
-- because those are the correct versions in complete-migration.sql

SELECT 'Cleanup completed! Now run database/complete-migration.sql' as status;
