# 🚀 Quick Start - Run Migration Now

## 🎯 IMPORTANT: If You Already Ran Wrong Files

If you already ran the Prisma migration files (`add_socratic_teaching.sql` or `add_learn_anything_features.sql`), you need to clean up first:

**Step 1: Clean up incorrect tables**
1. Go to: https://app.supabase.com/project/taemiasvwhmiinrolkra/sql/new
2. Copy ALL content from: `database/cleanup-incorrect-tables.sql`
3. Run it in SQL Editor

**Step 2: Then run the correct migration**
1. Copy ALL content from: `database/complete-migration.sql`
2. Run it in SQL Editor

---

## ✅ Fresh Install (No Previous Migrations)

If you haven't run any migrations yet, just use:

**Copy this file to Supabase:**
```
database/complete-migration.sql
```

## 🎯 Run in Supabase (2 Minutes)

### Step 1: Open SQL Editor
Go to: **https://app.supabase.com/project/taemiasvwhmiinrolkra/sql/new**

### Step 2: Paste & Run
1. Open `database/complete-migration.sql` (this file has EVERYTHING)
2. Copy **all** the SQL
3. Paste into Supabase SQL Editor
4. Click **"Run"** button

### Step 3: Verify Success
You should see:
```
Complete migration successful! ✅
```

## ✅ What Gets Created

This creates ALL tables including:

**Core Tables:**
- ✅ User (with wallet addresses)
- ✅ Skill, UserSkill
- ✅ Challenge, ChallengeAttempt
- ✅ SkillProof, Evaluation
- ✅ Reward, WalletTransaction
- ✅ Achievement, UserAchievement
- ✅ Notification

**Socratic Teaching:**
- ✅ socratic_sessions
- ✅ user_glossary

**Learn Anything Features:**
- ✅ ReviewSchedule (spaced repetition)
- ✅ LearningSession
- ✅ UserStats (streaks, totals)
- ✅ LearningGoal
- ✅ MasteryBadge
- ✅ ExerciseAttempt
- ✅ QuizResult
- ✅ KnowledgeNode
- ✅ UserMastery

**Total: 27 tables created!**

## 🔄 Next: Import Your Data

After migration succeeds, import existing proof data:

```bash
node scripts/import-data-to-supabase.js
```

This imports:
- Users from `data/proof.json`
- Individual proofs from subdirectories
- Wallet addresses and transaction history

## 🎉 Start Your Server

```bash
npm start
```

Visit: http://localhost:3001

## 🧪 Verify It Works

### 1. Check Tables
Go to: https://app.supabase.com/project/taemiasvwhmiinrolkra/editor

You should see all tables listed above.

### 2. Test Connection
```bash
node -e "import('./server/supabase-store.js').then(m => new m.SupabaseStore().open().then(() => console.log('✅ Connected')))"
```

Expected: `✅ Connected`

### 3. Check Leaderboard
Visit: http://localhost:3001/#/leaderboard

You should see:
- Real Nimiq wallet addresses
- ✓ Verification badges
- No demo accounts (or marked with "(demo)")

## 🐛 Troubleshooting

### I Already Ran the Wrong Migration Files!
✅ **FIX:** Run `database/cleanup-incorrect-tables.sql` first, then run `database/complete-migration.sql`

The cleanup script will remove any tables created with incorrect names (lowercase `users`, `userid`) so you can start fresh with the correct schema.

### Error: "column 'userid' does not exist" or "table 'users' does not exist"
✅ **FIXED!** Use `database/complete-migration.sql` (NOT the Prisma migration files)

The Prisma migrations reference lowercase table names (`users`, `userid`) but Supabase uses quoted names (`"User"`, `"userId"`). The complete migration file has the correct names.

### Error: "Connection refused"
- Check Supabase project status
- Verify `SUPABASE_URL` in `.env`

### Error: "Authentication failed"
- Check `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Get from: Settings → API → Service Role Key

### No wallet addresses showing
- Run import: `node scripts/import-data-to-supabase.js`
- Or sign in with real Nimiq wallet

## 📊 Test Queries

After migration, try these in Supabase SQL Editor:

```sql
-- Count tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check users
SELECT COUNT(*) as total_users FROM "User";

-- Real wallet users
SELECT username, "walletAddress", "earnedLuna" 
FROM "User" 
WHERE "isDemo" = false 
LIMIT 10;
```

## 🎯 Your Setup Status

- ✅ Dependencies installed (`npm install`)
- ✅ Environment configured (`.env`)
- ✅ DB_MODE set to `supabase`
- ✅ Migration SQL fixed and ready
- ⏳ **Next: Run migration SQL in Supabase**

## 📍 Files in This Repo

| File | Purpose | Use It? |
|------|---------|---------|
| `database/complete-migration.sql` | **← USE THIS!** Complete schema | ✅ YES |
| `database/cleanup-incorrect-tables.sql` | Clean up wrong migrations | ⚠️ If you ran wrong files |
| `scripts/migrate-to-supabase.js` | Generate SQL (outputs to console) | ⚠️ Optional |
| `scripts/import-data-to-supabase.js` | Import existing data | ✅ After migration |
| `SETUP-SUPABASE.md` | Detailed setup guide | 📖 Reference |
| `docs/SUPABASE-SETUP.md` | Full documentation | 📖 Reference |

**Removed files (no longer in repo):**
- ❌ `prisma/migrations/*.sql` - Wrong table names, caused errors
- ❌ `database/migration.sql` - Incomplete, replaced by complete-migration.sql
- ❌ `database/schema.sql` - Old format, not compatible
- ❌ `database/supabase-migration.sql` - Generated file with console output

---

**Ready?** 
1. If you ran wrong files: use `database/cleanup-incorrect-tables.sql` first
2. Then use `database/complete-migration.sql`
3. Done! 🚀
