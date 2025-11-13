# Mobile API Setup Guide

## Problem
When running the app on mobile (APK), it tries to connect to `localhost:5000`, which doesn't work because the mobile device can't access your computer's localhost.

## Solution Options

### Option 1: Use Your Deployed Backend (Recommended for Production)

If you have deployed your backend to Vercel or another service:

1. **Update the API URL in your code:**
   - Edit `client/src/utils/api.js`
   - Replace the mobile API URL with your deployed backend URL
   - Example: `https://safemzansi-backend.vercel.app/api`

2. **Or set environment variable:**
   - Create a `.env` file in the `client` folder
   - Add: `VITE_MOBILE_API_URL=https://your-backend-url.vercel.app/api`
   - Rebuild the app: `npm run build && npm run cap:sync`

### Option 2: Use Your Computer's IP Address (For Local Testing)

1. **Find your computer's IP address:**
   - Windows: Open Command Prompt and run `ipconfig`
   - Look for "IPv4 Address" (e.g., `192.168.1.100`)
   - Mac/Linux: Run `ifconfig` or `ip addr`

2. **Make sure your phone and computer are on the same WiFi network**

3. **Update the API URL:**
   - Edit `client/src/utils/api.js`
   - Change the mobile API URL to: `http://YOUR_IP_ADDRESS:5000/api`
   - Example: `http://192.168.1.100:5000/api`

4. **Make sure your backend server is running:**
   ```bash
   cd server
   npm start
   ```

5. **Rebuild the app:**
   ```bash
   cd client
   npm run build
   npm run cap:sync
   ```

6. **Rebuild APK:**
   ```bash
   npm run android:build
   ```

### Option 3: Configure at Runtime (Advanced)

You can add a settings screen in your app to let users configure the API URL:

1. The app already supports this via `localStorage.setItem('API_BASE_URL', 'your-url')`
2. Add a settings page where users can enter the API URL
3. The app will use the stored URL for all API requests

## Quick Fix for Testing Right Now

1. **Find your computer's IP:**
   - Windows: `ipconfig` → Look for IPv4 Address
   - Example: `192.168.1.100`

2. **Update `client/src/utils/api.js`:**
   - Find the line with `VITE_MOBILE_API_URL`
   - Change it to: `http://YOUR_IP:5000/api`
   - Example: `http://192.168.1.100:5000/api`

3. **Make sure backend is running on port 5000**

4. **Rebuild:**
   ```bash
   cd client
   npm run build
   npm run cap:sync
   npm run android:build
   ```

5. **Install the new APK**

## Important Notes

- **For production:** Always use a deployed backend (Vercel, Heroku, etc.)
- **For local testing:** Use your computer's IP address
- **Both devices must be on the same network** for local testing
- **Firewall:** Make sure your firewall allows connections on port 5000

## Troubleshooting

- **"Network error"**: Check that backend is running and IP address is correct
- **"Connection refused"**: Check firewall settings
- **"CORS error"**: Update CORS settings in `server/server.js` to allow your mobile app

