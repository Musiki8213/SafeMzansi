# Quick Setup for Lecturer Testing

## Option 1: Quick Test (Localtunnel) - 2 minutes

1. **Make sure your backend is running:**
   ```powershell
   cd server
   npm start
   ```

2. **In a NEW terminal window, run:**
   ```powershell
   cd server
   .\start-public-tunnel.ps1
   ```

3. **Copy the URL that appears** (it will look like `https://xxxxx.loca.lt`)

4. **Your lecturer should enter in the app:**
   ```
   https://xxxxx.loca.lt/api
   ```
   (Add `/api` at the end)

5. **Keep both terminals open** while your lecturer tests!

---

## Option 2: Permanent Solution (Vercel) - 10 minutes

### Deploy via Vercel Website (No CLI needed):

1. **Go to:** https://vercel.com
2. **Sign up/Login** (use GitHub account - it's free)
3. **Click "Add New..." → "Project"**
4. **Import Git Repository:**
   - If your code is on GitHub: Select your repo
   - If not: Click "Deploy without Git" → Upload the `server` folder
5. **Configure Project:**
   - **Framework Preset:** Other
   - **Root Directory:** `server` (or leave blank if uploading server folder)
   - **Build Command:** (leave blank)
   - **Output Directory:** (leave blank)
6. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add:
     - **Name:** `MONGO_URI`
     - **Value:** (your MongoDB connection string)
   - Add:
     - **Name:** `JWT_SECRET`
     - **Value:** (any random string, e.g., `my-secret-key-12345`)
7. **Click "Deploy"**
8. **Wait for deployment** (2-3 minutes)
9. **Copy your URL** (e.g., `https://safemzansi-backend.vercel.app`)
10. **Your lecturer should enter:**
    ```
    https://safemzansi-backend.vercel.app/api
    ```

---

## Testing the Connection

After getting your URL, test it:

```powershell
curl https://YOUR-URL-HERE/api
```

You should see: `{"message":"SafeMzansi backend is running"}`

---

## For Your Lecturer

Tell them to:
1. Open the SafeMzansi app
2. When prompted for "Backend Server URL", enter:
   - `https://xxxxx.loca.lt/api` (if using localtunnel)
   - OR `https://your-project.vercel.app/api` (if using Vercel)
3. Click "Test Connection"
4. If successful, click "Save & Continue"
5. Sign up or log in

---

## Troubleshooting

**"Unable to connect" error:**
- Make sure backend is running (Option 1)
- Make sure localtunnel is running (Option 1)
- Check the URL has `/api` at the end
- Try the "Test Connection" button first

**"Server Error" after login:**
- Check MongoDB connection string is correct
- Check environment variables are set (Vercel)
- Check backend logs for errors

