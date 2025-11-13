# Get Public URL for Your Lecturer

## Quick Method: Localtunnel (2 minutes)

1. **Open a NEW PowerShell terminal** (keep your backend running in the other terminal)

2. **Run this command:**
   ```powershell
   cd C:\Users\User\Documents\SafeMzansi\server
   .\start-public-tunnel.ps1
   ```
   
   OR simply:
   ```powershell
   lt --port 5000
   ```

3. **You'll see output like:**
   ```
   your url is: https://random-name-123.loca.lt
   ```

4. **Copy that URL and add `/api` to the end:**
   ```
   https://random-name-123.loca.lt/api
   ```

5. **Share this URL with your lecturer**

6. **Keep this terminal open** while they test!

---

## Permanent Method: Vercel (10 minutes)

### Deploy via Vercel Website:

1. **Go to:** https://vercel.com
2. **Sign up/Login** (free, use GitHub)
3. **Click "Add New..." → "Project"**
4. **Import your server:**
   - If on GitHub: Select your repo, set root to `server`
   - If not: Click "Deploy without Git" → Upload `server` folder
5. **Add Environment Variables:**
   - `MONGO_URI` = (your MongoDB connection string)
   - `JWT_SECRET` = (any random string)
6. **Click "Deploy"**
7. **Wait 2-3 minutes**
8. **Copy your URL** (e.g., `https://safemzansi-backend.vercel.app`)
9. **Add `/api` to the end:**
   ```
   https://safemzansi-backend.vercel.app/api
   ```

---

## Test Your URL

Before giving it to your lecturer, test it:

```powershell
curl https://YOUR-URL-HERE/api
```

You should see: `{"message":"SafeMzansi backend is running"}`

---

## For Your Lecturer

Tell them:
1. Open the SafeMzansi app
2. When they see "Configure API Server" screen, enter:
   ```
   https://xxxxx.loca.lt/api
   ```
   (or your Vercel URL)
3. Click "Test Connection" - should show ✅
4. Click "Save & Continue"
5. Sign up or log in

---

## Troubleshooting

**"Cannot connect" error:**
- Make sure backend is running (`npm start` in server folder)
- Make sure localtunnel is running (if using localtunnel)
- Check URL has `/api` at the end
- Try the test button first

**Backend not responding:**
- Check MongoDB is connected
- Check server logs for errors
- Make sure port 5000 is not blocked by firewall

