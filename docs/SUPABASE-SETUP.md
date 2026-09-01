# Supabase Migration Guide

## Overview

This guide walks you through migrating PROOF from the in-memory JSON store to Supabase (PostgreSQL) and displaying real participants with their Nimiq wallet addresses.

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New project"
3. Fill in:
   - **Name:** PROOF
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

## Step 2: Get Your Connection Strings

After your project is created:

1. Go to **Settings** → **Database**
2. Find "Connection string" section
3. Copy these values:

### Database URL (for Prisma)
```
postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### API Settings
Go to **Settings** → **API**

- **Project URL:** `https://[PROJECT_REF].supabase.co`
- **anon public key:** `eyJhbGc...` (long JWT token)
- **service_role key:** `eyJhbGc...` (long JWT token - **keep secret!**)

## Step 3: Update Environment Variables

Edit your `.env` file:

```bash
# Replace these with your actual values from Step 2:
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key

# Change mode to supabase
DB_MODE=supabase
```

## Step 4: Install Dependencies

```bash
npm install @supabase/supabase-js
```

## Step 5: Run Database Migration

This creates all tables in your Supabase database:

```bash
# Apply Prisma schema to Supabase
node scripts/migrate-to-supabase.js
```

This script will:
- Create all tables from `prisma/schema.prisma`
- Set up indexes and foreign keys
- Enable Row Level Security (RLS) policies
- Create functions and triggers

## Step 6: Migrate Existing Data

If you have existing data in the `data/` folder:

```bash
# Import all existing users, proofs, and attempts
node scripts/import-data-to-supabase.js
```

This will:
- Read all JSON files from `data/` folder
- Extract users with Nimiq wallet addresses
- Import proofs and challenge attempts
- Preserve all timestamps and scores

## Step 7: Start Server with Supabase

```bash
npm start
```

The server will now:
- ✅ Use Supabase instead of in-memory store
- ✅ Display real participant wallet addresses
- ✅ Persist data across server restarts
- ✅ Support concurrent users safely

## What Changes

### Before (In-Memory Store)
- Data stored in `data/proof.json`
- Lost on server restart (unless saved)
- Demo users with fake wallets
- Single-server only

### After (Supabase)
- Data stored in PostgreSQL cloud database
- Persistent across restarts
- Real users with real Nimiq wallets
- Scales to multiple servers
- Real-time capabilities available

## Displaying Real Wallet Addresses

### Leaderboard
Real wallet addresses are now shown:
```
🏆 Top Earners
1. NQ07 HKC8 3K4U... - 145.2 NIM
2. NQ12 GFK3 9SL2... - 98.5 NIM
3. NQ45 NEJ7 1RRN... - 67.3 NIM
```

### Profile Page
Shows:
- Full Nimiq wallet address
- Current balance from on-chain
- Transaction history
- Proof submissions linked to wallet

### How It Works
1. User signs in with Nimiq wallet (NimiqPay or Hub)
2. Wallet address stored in `User.walletAddress`
3. All earnings/proofs linked to that address
4. Leaderboard queries real users: `WHERE walletMode = 'nimiqpay' AND isDemo = false`

## Database Schema Highlights

### User Table
```sql
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  walletAddress TEXT UNIQUE,           -- Real Nimiq address
  walletMode TEXT,                      -- 'nimiqpay' or 'demo'
  username TEXT UNIQUE,
  balanceLuna BIGINT DEFAULT 0,        -- Luna = NIM * 100000
  earnedLuna BIGINT DEFAULT 0,
  proofsPassed INT DEFAULT 0,
  isDemo BOOLEAN DEFAULT false,        -- Filter out demo users
  ...
);
```

### Wallet Transactions
```sql
CREATE TABLE "WalletTransaction" (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES "User"(id),
  kind TEXT,                            -- 'reward', 'payout', etc.
  amountLuna BIGINT,
  status TEXT,                          -- 'pending', 'confirmed'
  ref TEXT,                             -- On-chain TX hash
  network TEXT,                         -- 'mainnet' or 'testnet'
  ...
);
```

## Row Level Security (RLS)

Supabase RLS policies ensure:
- Users can only read their own data
- Public leaderboard shows anonymized data
- Admin operations require service_role key

Example policies:
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own data"
ON "User" FOR SELECT
USING (auth.uid() = id);

-- Anyone can read leaderboard (public data only)
CREATE POLICY "Public leaderboard"
ON "User" FOR SELECT
USING (isDemo = false);
```

## Verification

After migration, verify:

### 1. Check Tables Created
Go to Supabase Dashboard → **Table Editor**
- Should see: User, Skill, Challenge, etc.

### 2. Test Queries
In Supabase SQL Editor:
```sql
-- Count real users with wallets
SELECT COUNT(*) FROM "User" 
WHERE walletMode = 'nimiqpay' AND isDemo = false;

-- Top earners
SELECT username, walletAddress, earnedLuna 
FROM "User" 
WHERE isDemo = false 
ORDER BY earnedLuna DESC 
LIMIT 10;
```

### 3. Test API Endpoints
```bash
# Health check
curl http://localhost:3001/api/health

# Leaderboard (should show real wallets)
curl http://localhost:3001/api/leaderboard
```

## Rollback to In-Memory Store

If you need to go back temporarily:

1. Change in `.env`:
   ```
   DB_MODE=store
   ```

2. Restart server:
   ```bash
   npm start
   ```

Data in Supabase remains intact - you can switch back anytime.

## Common Issues

### Connection Refused
- **Cause:** Wrong DATABASE_URL or project not ready
- **Fix:** Verify connection string from Supabase dashboard
- **Check:** Project status (should be "Active")

### Authentication Failed
- **Cause:** Wrong password in DATABASE_URL
- **Fix:** Reset database password in Supabase settings

### RLS Policy Blocks Query
- **Cause:** Missing or incorrect RLS policy
- **Fix:** Use service_role key for admin operations

### Slow Queries
- **Cause:** Missing indexes
- **Fix:** Run EXPLAIN ANALYZE and add indexes:
  ```sql
  CREATE INDEX idx_user_wallet ON "User"(walletAddress);
  CREATE INDEX idx_proofs_user ON "SkillProof"(userId, completedAt);
  ```

## Production Checklist

Before going live:

- [ ] Database backups enabled (automatic in Supabase)
- [ ] RLS policies tested and verified
- [ ] Indexes created for common queries
- [ ] Environment variables in production server
- [ ] Connection pooling configured (pgBouncer)
- [ ] Monitoring alerts set up
- [ ] Rate limiting configured
- [ ] Treasury key secured (never in version control)

## Benefits of Supabase

✅ **Real-time subscriptions** (future: live leaderboard updates)
✅ **Automatic API** (REST & GraphQL)
✅ **Built-in auth** (can integrate with Nimiq wallet signing)
✅ **File storage** (for proof submissions if needed)
✅ **Edge functions** (serverless compute close to users)
✅ **Auto backups** (point-in-time recovery)
✅ **Dashboard** (SQL editor, table viewer, logs)

## Next Steps

1. Set up staging environment
2. Test thoroughly with real wallets (testnet)
3. Monitor performance and optimize queries
4. Gradually migrate live users
5. Keep in-memory store as fallback for 1-2 weeks

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Discord:** https://discord.supabase.com
- **Stack Overflow:** Tag `supabase`

---

**Migration Time Estimate:** 30-60 minutes
**Downtime Required:** None (with proper planning)
**Risk Level:** Low (rollback available)
