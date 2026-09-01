# Testing Guide

## 🚨 Important: Backend Must Be Running!

The test page needs the Node.js backend server to handle API requests. Port 5500 (Live Server) is just serving static HTML files - it cannot handle `/api/*` routes!

## Testing Options

### Option 1: Test on Railway (EASIEST) ✅

Your app is already deployed and running on Railway with Supabase connected.

1. Go to your Railway deployment URL
2. Add `/test-wallet.html` to the URL
3. Click "Test Basic API" to verify connectivity
4. Click "Test Demo Wallet" or "Test Full Auth Flow"

**Example:** `https://your-app-name.up.railway.app/test-wallet.html`

### Option 2: Test Locally

#### Step 1: Start the Backend Server

```powershell
# In the project root directory
npm run dev
```

This starts the server on port 3001 (default). You should see:
```
🗄️  Using Supabase (PostgreSQL)
✅ Connected to Supabase
[proof] listening on :3001
```

#### Step 2: Open the Test Page

Open your browser to:
```
http://localhost:3001/test-wallet.html
```

⚠️ **DO NOT use `http://localhost:5500`** - that's Live Server (static files only)!

#### Step 3: Run Tests

1. Click "Test Basic API" - should show 200 OK responses
2. Click "Test Demo Wallet" - should create wallet and authenticate
3. Click "Test Full Auth Flow" - should open Nimiq Hub popup

## 🔍 Troubleshooting

### Getting 405 Errors?
**Problem:** Backend server is not running.

**Solution:** 
- If testing locally: Start server with `npm run dev`
- If testing on Railway: Make sure you're using the Railway URL, not localhost:5500

### Getting 404 Errors on /api/me?
**Problem:** You're accessing static files, not the backend.

**Solution:**
- Use `http://localhost:3001` (backend port) NOT `localhost:5500` (Live Server)
- Or test on Railway URL

### Server Won't Start?
**Problem:** Missing environment variables or database connection.

**Solution:**
1. Copy `.env.example` to `.env`
2. Add your Supabase credentials:
   ```env
   DB_MODE=supabase
   SUPABASE_URL=your-project-url
   SUPABASE_ANON_KEY=your-anon-key
   AUTH_SECRET=your-secret-key
   ```

### Railway Deployment Issues?
**Problem:** Code not deploying or old version running.

**Solution:**
1. Check Railway dashboard for build logs
2. Verify the build succeeded
3. Check the deployment logs for errors
4. Force redeploy if needed

## 📊 Expected Results

### Test Basic API ✅
```
✅ GET /api/me works (returns { user: null })
✅ POST /api/wallet/demo works (returns publicKey/privateKey)
✅ POST /api/auth/nonce works (returns nonce/message)
```

### Test Demo Wallet ✅
```
✅ Demo wallet created
✅ Nonce received
✅ Message signed
✅ Authentication successful
✅ User ID and username returned
```

### Test Full Auth Flow ✅
```
✅ Hub API loaded
✅ Address selected from Hub popup
✅ Nonce received from server
✅ Message signed via Hub
✅ Authentication successful
✅ Session created
```

## 🎯 Quick Commands

```powershell
# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run smoke tests
npm run smoke
```

## 📝 Notes

- **Demo Wallet:** Works everywhere, uses server-generated keypairs
- **Nimiq Hub:** Works in browsers, opens popup at hub.nimiq.com
- **Nimiq Pay:** Only works inside Nimiq Pay mobile app
- **Railway:** Uses Supabase PostgreSQL (persistent database)
- **Local:** Can use in-memory store OR connect to Supabase

## 🔗 Important URLs

- **Railway Dashboard:** Check your Railway project for deployment status
- **Supabase Dashboard:** Monitor database and check for schema issues
- **GitHub Repo:** https://github.com/LegendaryTunzeverywhere/PROOF
- **Test Page:** `/test-wallet.html` (on Railway or localhost:3001)
