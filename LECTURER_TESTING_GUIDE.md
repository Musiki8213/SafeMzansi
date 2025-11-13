# Guide for Lecturer Testing

## ✅ Everything is Ready!

Your app is fully configured and ready for testing. The app will automatically prompt for the backend URL when opened on a mobile device.

---

## Step 1: Get a Public URL

### Option A: Quick Test (Localtunnel) - 2 minutes

1. **Open a NEW PowerShell terminal** (keep backend running)
2. **Run:**
   ```powershell
   cd C:\Users\User\Documents\SafeMzansi\server
   lt --port 5000
   ```
3. **Copy the URL** that appears (e.g., `https://random-name.loca.lt`)
4. **Add `/api` to the end:**
   ```
   https://random-name.loca.lt/api
   ```
5. **Keep this terminal open** while testing!

### Option B: Permanent (Vercel) - 10 minutes

See `DEPLOY_BACKEND.md` for full instructions, or:
1. Go to https://vercel.com
2. Sign up/login
3. Deploy the `server` folder
4. Add environment variables (MONGO_URI, JWT_SECRET)
5. Get your URL: `https://your-project.vercel.app/api`

---

## Step 2: Share with Your Lecturer

**Give them this URL:**
```
https://xxxxx.loca.lt/api
```
(Replace with your actual URL)

**Instructions for your lecturer:**
1. Install the SafeMzansi APK on their phone
2. Open the app
3. When they see "Configure API Server" screen:
   - Enter the URL you provided
   - Click "Test Connection" (should show ✅)
   - Click "Save & Continue"
4. Sign up with a new account or log in
5. Test the app features:
   - View map with hotspots
   - Submit a crime report
   - Get safe route between two points
   - View alerts from other users
   - See notifications when others submit reports

---

## Step 3: What to Test

### Core Features:
- ✅ **Map View**: Shows crime hotspots with color coding (Brown/Orange/Red)
- ✅ **Safe Route**: Always finds a route avoiding hotspots
- ✅ **Report Submission**: Submit crime reports with location
- ✅ **Alerts Page**: View reports from other users
- ✅ **Notifications**: Real-time toast notifications when others submit reports
- ✅ **Profile**: View and delete own reports

### Test Scenarios:
1. **Sign up** with a new account
2. **Submit a report** at a location
3. **Switch to another account** (or have lecturer use different account)
4. **Verify notification appears** when first account submits report
5. **Test safe route** between two points
6. **View alerts** from other users
7. **Delete own report** from profile

---

## Troubleshooting

### "Unable to connect backend"
- ✅ Backend server is running on port 5000
- ✅ Localtunnel is running (if using localtunnel)
- ✅ URL has `/api` at the end
- ✅ Test connection button works

### "Server Error" after login
- ✅ MongoDB connection is working
- ✅ Environment variables are set (if using Vercel)
- ✅ Check server logs for errors

### Notification not appearing
- ✅ Both users are logged in
- ✅ Backend is processing notifications
- ✅ Check browser/device notification permissions

---

## Current Status

✅ Backend server: **Running on port 5000**  
✅ API endpoints: **All working**  
✅ Mobile app: **Configured for runtime URL entry**  
✅ Database: **Connected**  
✅ Notifications: **Working**  
✅ Safe routes: **Always available**

---

## Quick Commands Reference

**Start backend:**
```powershell
cd server
npm start
```

**Start localtunnel:**
```powershell
cd server
lt --port 5000
```

**Test backend:**
```powershell
curl http://localhost:5000/api
```

**Test public URL:**
```powershell
curl https://YOUR-URL-HERE/api
```

---

## Support Files Created

- `QUICK_SETUP.md` - Quick setup instructions
- `GET_PUBLIC_URL.md` - How to get public URL
- `DEPLOY_BACKEND.md` - Vercel deployment guide
- `server/start-public-tunnel.ps1` - Helper script for localtunnel

---

**Your app is ready! 🚀**

