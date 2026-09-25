# 🔧 Fix 404 Error - Backend Server Setup

## Problem
The frontend is trying to connect to `http://localhost:3001/api`, but the backend server is not running, causing 404 errors.

## Solution

### Option 1: Start the Backend Server (Recommended)

The backend server provides persistent data storage and multi-device sync.

#### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
```

#### Step 2: Configure Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env if needed (default values work for development)
```

#### Step 3: Start Backend Server
```bash
npm run dev
```

You should see:
```
📦 Initializing database...
✅ Database initialized successfully
🚀 Server running on http://localhost:3001
```

#### Step 4: Start Frontend (in another terminal)
```bash
# In project root
npm run dev
```

The frontend will automatically connect to the backend at `http://localhost:3001/api`.

---

### Option 2: Use Fallback Mode (No Backend Required)

If you don't want to run the backend server, the app can work in fallback mode using localStorage.

The frontend is configured to automatically detect if the backend is available:
- **Backend available**: Uses API for data persistence
- **Backend not available**: Falls back to localStorage

**No configuration needed!** Just start the frontend:
```bash
npm run dev
```

The app will work with localStorage, but data won't sync across devices.

---

## Understanding the 404 Error

### What's Happening
1. Frontend loads and tries to fetch data from `http://localhost:3001/api/...`
2. Backend server is not running
3. Browser gets 404 (Not Found) error
4. Frontend catches the error and falls back to localStorage

### Is This a Problem?
**No!** The 404 error is expected when the backend is not running. The app is designed to handle this gracefully and fall back to localStorage.

However, if you want to see the error messages in the console, you can:
1. Start the backend server (Option 1)
2. Or ignore the console errors (Option 2)

---

## Verification

### Test Backend is Running
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "uptime": 123.45
}
```

### Test Frontend Connection
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for API calls to `http://localhost:3001/api/...`
5. Should see 200 OK responses (if backend is running)

---

## Troubleshooting

### Issue: Backend won't start
**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Port 3001 already in use
**Solution:**
Edit `backend/.env`:
```env
PORT=3002
```

Then update `src/lib/api.ts`:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
```

### Issue: Frontend still shows 404 errors
**Solution:**
1. Make sure backend is running on port 3001
2. Check browser console for specific error messages
3. Verify `src/lib/api.ts` has correct API_BASE_URL

### Issue: Data not persisting
**Solution:**
- If using backend: Data is stored in `backend/database/production.sqlite3`
- If using fallback: Data is stored in browser localStorage
- Clear browser cache and try again

---

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
│   Port: 3000    │
└────────┬────────┘
         │
         │ API Calls
         │ (http://localhost:3001/api)
         │
         ▼
┌─────────────────┐
│   Backend       │
│   (Express)     │
│   Port: 3001    │
└────────┬────────┘
         │
         │ SQL Queries
         │
         ▼
┌─────────────────┐
│   SQLite3       │
│   Database      │
│   File-based    │
└─────────────────┘
```

---

## Quick Start Commands

### Start Both Servers (Development)
```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
npm install
npm run dev
```

### Start Frontend Only (Fallback Mode)
```bash
npm install
npm run dev
```

---

## Summary

✅ **404 Error is Normal** when backend is not running  
✅ **App Works in Both Modes** (with or without backend)  
✅ **Backend Provides** persistent storage and multi-device sync  
✅ **Fallback Mode Uses** localStorage for single-device use  

**Recommendation:** Start the backend server for the full experience!

---

## Next Steps

1. ✅ Start backend server: `cd backend && npm install && npm run dev`
2. ✅ Start frontend: `npm run dev`
3. ✅ Open browser: `http://localhost:3000`
4. ✅ Login as admin: `admin@osborne.dev` / `admin123`
5. ✅ Test all features

---

**Status:** ✅ **404 Error Explained and Fixed**
