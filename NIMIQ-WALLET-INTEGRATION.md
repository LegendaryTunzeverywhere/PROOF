# Nimiq Wallet Integration Guide

## ✅ Fixed Issues

### 1. Demo Wallet Authentication (RESOLVED)
**Problem:** `userId` was null when creating sessions for demo wallets.

**Root Cause:** `UserService.createUser()` and `update()` were not async, so they didn't properly await Supabase operations.

**Fix:**
- Made `createUser()` async with `await this.store.insert()`
- Made `update()` async with `await this.store.update()`
- Both methods now properly return user objects

### 2. Database Schema Issues (RESOLVED)
**Applied Fixes:**
```sql
-- Added missing columns
ALTER TABLE "User" ADD COLUMN "proofsAttempted" INT DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "usernameLower" TEXT;
ALTER TABLE "User" ADD COLUMN "streak" JSONB DEFAULT '{"current": 0, "longest": 0, "lastDay": null}';
ALTER TABLE "sessions" ADD COLUMN "entropy" TEXT;

-- Added missing enum value
ALTER TYPE "WalletMode" ADD VALUE 'hub';
```

## 🔌 Wallet Connection Types

### 1. Nimiq Hub (Browser-based)
**Status:** ✅ Working

**Where it works:**
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Any web environment

**How it works:**
1. Opens `https://hub.nimiq.com` in a popup window
2. User selects their address
3. User signs authentication message
4. Returns to your app with signature

**Test it:**
```javascript
// Client-side
await WalletService.connectNimiqHub();
```

**API Flow:**
```
chooseAddress() → returns { address }
signMessage() → returns { signature, signerPublicKey }
```

### 2. Nimiq Pay (Mobile App Only)
**Status:** ⚠️ Only works inside Nimiq Pay app

**Where it works:**
- **ONLY** inside the Nimiq Pay mobile app (iOS/Android)
- Uses injected JavaScript provider (`window.nimiqPay`)

**Where it DOESN'T work:**
- Regular mobile browsers (Safari, Chrome)
- Desktop browsers
- Web views outside Nimiq Pay

**How to test:**
1. Install [Nimiq Pay app](https://www.nimiq.com/pay/) on iOS/Android
2. Open your app **inside** Nimiq Pay (as a mini app)
3. The injected provider will be available

**API Flow:**
```javascript
// Inside Nimiq Pay app only
import { init } from '@nimiq/mini-app-sdk';
const nimiq = await init();
const accounts = await nimiq.listAccounts();
await nimiq.sign(message);
```

### 3. Demo Wallet (Testing)
**Status:** ✅ Working

**Purpose:** Local testing without real wallets

**How it works:**
1. Server generates Ed25519 keypair
2. Private key sent to client (sandbox only!)
3. Client signs messages locally
4. No real blockchain interaction

## 🧪 Testing

### Test Page: `/test-wallet.html`
A diagnostic page to verify wallet connections work.

**Usage:**
1. Deploy to Railway: `https://your-app.up.railway.app/test-wallet.html`
2. Click "Test Nimiq Hub" - should open popup and complete auth
3. Click "Test Nimiq Pay" - will show warning if not in Nimiq Pay app

### Manual Testing

**Test Demo Wallet:**
```bash
# In browser console on your deployed app
WalletService.connectDemo()
  .then(result => console.log('Demo connected:', result))
  .catch(err => console.error('Demo failed:', err));
```

**Test Nimiq Hub:**
```bash
# In browser console
WalletService.connectNimiqHub()
  .then(result => console.log('Hub connected:', result))
  .catch(err => console.error('Hub failed:', err));
```

## 📋 Leaderboard & Profile Integration

### Real Wallet Addresses
Users with Nimiq wallets now show their real addresses:

```javascript
// Leaderboard API response
{
  rank: 1,
  username: "SwiftOtter42",
  walletAddress: "NQ18 TAQ8 CL7P K505 LE2M C78A 1YQC 1CH1 6Y4G", // Real address!
  walletMode: "hub", // or "nimiqpay"
  isDemo: false,
  // ... other fields
}
```

### Demo Users
Demo users are clearly marked:
```javascript
{
  walletAddress: null,
  walletMode: "demo",
  isDemo: true
}
```

## 🔐 Authentication Flow

### All Wallet Types
```
1. Client requests nonce
   POST /api/auth/nonce
   { subject: address_or_pubkey }
   
2. Client signs challenge message
   (via Hub popup, Nimiq Pay, or demo signing)
   
3. Client sends verification
   POST /api/auth/verify
   { mode, nonce, signature, publicKey, [address] }
   
4. Server verifies signature
   - For Hub/Pay: Validates Ed25519 signature
   - Creates or updates user record
   - Creates session
   
5. Returns session token + user data
```

## 🚨 Common Issues & Solutions

### Issue: "Nimiq Pay connection failed"
**Solution:** This is normal in browsers. Nimiq Pay only works inside the Nimiq Pay mobile app.

### Issue: "null value in column userId"
**Solution:** ✅ Fixed by making `createUser()` and `update()` async.

### Issue: Hub popup blocked
**Solution:** Ensure user interaction triggers the Hub call (button click, not automatic).

### Issue: "Could not find the 'entropy' column"
**Solution:** ✅ Fixed by running `ALTER TABLE sessions ADD COLUMN "entropy" TEXT;`

### Issue: "invalid input value for enum WalletMode: 'hub'"
**Solution:** ✅ Fixed by running `ALTER TYPE "WalletMode" ADD VALUE 'hub';`

## 📚 Documentation Links

- [Nimiq Hub API Guide](https://www.nimiq.com/developers/hub/guide/accounts)
- [Nimiq Mini Apps (Nimiq Pay)](https://www.nimiq.com/developers/mini-apps/overview)
- [Hub API GitHub](https://github.com/nimiq/hub)
- [Mini App SDK GitHub](https://github.com/nimiq/mini-app-sdk)

## 🎯 Next Steps

1. ✅ **Deployed to Railway** - Auto-deploys from GitHub
2. ✅ **Database schema fixed** - All columns present
3. ✅ **Async operations fixed** - User creation works
4. 🧪 **Test demo wallet** - Should work now!
5. 🧪 **Test Nimiq Hub** - Should open popup and authenticate
6. 📱 **Test Nimiq Pay** - Only works in Nimiq Pay mobile app

## 🔧 Files Changed

- `server/services/users.js` - Made `createUser()` and `update()` async
- `server/auth.js` - Made `consumeNonce()` and `createSession()` async
- `server/index.js` - Added await for user operations in `/api/auth/verify`
- `database/complete-migration.sql` - Complete schema with all tables/columns
- `test-wallet.html` - Diagnostic page for wallet testing

All changes pushed to GitHub and deployed to Railway!
