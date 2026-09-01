# Database Migration Files

This folder contains SQL migration files for setting up your PROOF database on Supabase.

## 📁 Files

### ✅ USE THESE

**`complete-migration.sql`** - **Main migration file**
- Creates all tables with correct names for Supabase
- Includes core features + Learn Anything + Socratic teaching
- Creates 27 tables total
- Sets up Row Level Security policies
- Adds performance indexes
- **This is the ONE file you need to run**

**`cleanup-incorrect-tables.sql`** - **Cleanup script**
- Use this ONLY if you previously ran incorrect migration files
- Drops tables created with wrong names (lowercase `users`, `userid`)
- Run this first, THEN run `complete-migration.sql`

## ❌ REMOVED FILES

These files have been removed from the repo because they caused errors or were redundant:

- ❌ `migration.sql` - Incomplete (missing Learn Anything features)
- ❌ `schema.sql` - Old format with lowercase table names
- ❌ `supabase-migration.sql` - Auto-generated with console output
- ❌ `prisma/migrations/*.sql` - Wrong table names, incompatible with Supabase

## 🚀 Quick Start

### First Time Setup
```sql
-- Just run this one file in Supabase SQL Editor:
database/complete-migration.sql
```

### If You Already Ran Wrong Files
```sql
-- 1. Clean up first:
database/cleanup-incorrect-tables.sql

-- 2. Then run the correct migration:
database/complete-migration.sql
```

## 📊 What Gets Created

After running `complete-migration.sql`, you'll have:

**Core Tables (14):**
- User, Skill, UserSkill
- LearningPath, Challenge, ChallengeAttempt
- Submission, Evaluation, SkillProof
- Achievement, UserAchievement
- Reward, WalletTransaction
- Notification

**Learning Features (11):**
- ReviewSchedule (spaced repetition)
- LearningSession, UserStats
- LearningGoal, MasteryBadge
- ExerciseAttempt, QuizResult
- KnowledgeNode, UserMastery
- socratic_sessions, user_glossary

**Plus:**
- 6 Enum types
- 15+ Indexes for performance
- 6 Row Level Security policies
- 2 Triggers for auto-updating timestamps

## 🔒 Table Naming Convention

Supabase uses **quoted case-sensitive names**:
- ✅ `"User"` (capital U, quoted)
- ✅ `"userId"` (camelCase, quoted)
- ❌ `users` (lowercase, unquoted) - will cause errors

All tables in `complete-migration.sql` use the correct naming.

## 🧪 Verify Migration

After running the migration, check in Supabase:

1. **Table Editor:** https://app.supabase.com/project/_/editor
   - You should see 27 tables

2. **SQL Query:**
   ```sql
   SELECT COUNT(*) as table_count 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
   - Should return: 27

3. **Test Query:**
   ```sql
   SELECT * FROM "User" LIMIT 5;
   ```
   - Should work without errors

## 🐛 Common Issues

**Error: `column "userid" does not exist`**
- You ran the wrong migration files
- Fix: Run `cleanup-incorrect-tables.sql` then `complete-migration.sql`

**Error: `syntax error at or near "desc"`**
- Fixed in current version (column is now quoted as `"desc"`)

**Error: `table "users" does not exist`**
- Table name should be `"User"` (quoted, capital U)
- Fix: Run `cleanup-incorrect-tables.sql` then `complete-migration.sql`

## 📚 Documentation

- **Quick Start:** `../QUICK-START.md`
- **Setup Guide:** `../SETUP-SUPABASE.md`
- **Full Docs:** `../docs/SUPABASE-SETUP.md`
- **Schema Reference:** `../prisma/schema.prisma`

## 🔄 Migration History

- **v1** - Initial core tables (User, Skill, Challenge, etc.)
- **v2** - Added Learn Anything features (spaced repetition, badges)
- **v3** - Added Socratic teaching (sessions, glossary)
- **v4** - **Current: `complete-migration.sql`** (all features, correct names)

---

**Need help?** Check `../QUICK-START.md` for step-by-step instructions.
