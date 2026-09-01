# Quick Supabase Setup Guide

## ✅ Dependencies Installed

You've already completed:
- ✅ Dependencies installed (`npm install`)
- ✅ Environment variables configured (`.env`)
- ✅ DB_MODE set to `supabase`

## 🚀 Next Steps

### Step 1: Run Migration SQL in Supabase

The migration SQL has been generated and saved to `database/supabase-migration.sql`.

**To apply it:**

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/taemiasvwhmiinrolkra/sql/new

2. **Copy the SQL:**
   ```bash
   # Open the file and copy all content:
   notepad database\supabase-migration.sql
   ```

3. **Paste and Run:**
   - Paste the entire SQL into the Supabase SQL Editor
   - Click "Run" button
   - Wait for "Migration completed successfully! ✅" message

### Step 2: Import Existing Data (Optional)

If you have existing proof data in the `data/` folder:

```bash
node scripts/import-data-to-supabase.js
```

This will:
- ✅ Import all users from `data/proof.json`
- ✅ Import individual proof submissions from subdirectories
- ✅ Preserve wallet addresses and real participant data
- ✅ Skip demo users if desired

### Step 3: Start the Server

```bash
npm start
```

Visit: http://localhost:3001

## 🧪 Verify Migration

### Check Tables in Supabase

Go to: https://app.supabase.com/project/taemiasvwhmiinrolkra/editor

You should see these tables:
- User
- Skill
- Challenge
- ChallengeAttempt
- SkillProof
- Reward
- WalletTransaction
- socratic_sessions
- user_glossary

### Test API Connection

```bash
# Test Supabase connection
node -e "import('./server/supabase-store.js').then(m => new m.SupabaseStore().open().then(() => console.log('✅ Connected')))"
```

Expected output: `✅ Connected`

### Check Leaderboard

Once server is running:

1. Visit: http://localhost:3001/#/leaderboard
2. You should see:
   - ✅ Real Nimiq wallet addresses (first 20 chars)
   - ✅ Verification badges (✓) for real wallet users
   - ✅ "(demo)" labels for test accounts

### Check Profile Page

1. Sign in with a Nimiq wallet
2. Visit your profile: http://localhost:3001/#/profile
3. You should see:
   - ✅ Full Nimiq address displayed
   - ✅ "Copy address" button
   - ✅ Transaction history

## 🔄 Rollback (if needed)

To go back to in-memory store:

1. Edit `.env`:
   ```bash
   DB_MODE=store
   ```

2. Restart server:
   ```bash
   npm start
   ```

Your Supabase data remains intact.

## 📊 Query Examples

Test queries in Supabase SQL Editor:

```sql
-- Count real users with wallets
SELECT COUNT(*) as real_users 
FROM "User" 
WHERE "walletAddress" IS NOT NULL 
  AND "isDemo" = false;

-- Top 10 earners
SELECT username, "walletAddress", "earnedLuna" 
FROM "User" 
WHERE "isDemo" = false 
ORDER BY "earnedLuna" DESC 
LIMIT 10;

-- Recent proof submissions
SELECT 
  u.username,
  u."walletAddress",
  sp."challengeTitle",
  sp.score,
  sp."completedAt"
FROM "SkillProof" sp
JOIN "User" u ON u.id = sp."userId"
WHERE u."isDemo" = false
ORDER BY sp."completedAt" DESC
LIMIT 20;
```

## 🐛 Troubleshooting

### "Connection refused"
- Check Supabase dashboard → Project status
- Verify `SUPABASE_URL` in `.env` is correct

### "Authentication failed"
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Check Settings → API → Service Role Key

### "No wallet addresses showing"
- Import real user data: `node scripts/import-data-to-supabase.js`
- Or create new users by signing in with Nimiq wallet

### Migration SQL errors
- Make sure to copy **all** the SQL content
- Run it in a single execution (don't split into parts)
- Check for any error messages in SQL Editor

## 📚 Documentation

- **Full Setup Guide:** `docs/SUPABASE-SETUP.md`
- **Migration Complete:** `docs/SUPABASE-MIGRATION-COMPLETE.md`
- **Architecture:** `docs/ARCHITECTURE.md`
- **Database Schema:** `prisma/schema.prisma`

## ✨ What You Get

After setup, PROOF will:
- ✅ Store all data in Supabase PostgreSQL (persistent)
- ✅ Display real Nimiq wallet addresses on leaderboards
- ✅ Show verification badges for real wallet users
- ✅ Support concurrent users without data loss
- ✅ Provide full transaction history
- ✅ Scale to production workloads

---

**Current Status:**
- ✅ Code ready
- ✅ Dependencies installed
- ✅ Environment configured
- ⏳ **Next: Run migration SQL in Supabase**

**Your Supabase Project:** https://app.supabase.com/project/taemiasvwhmiinrolkra
