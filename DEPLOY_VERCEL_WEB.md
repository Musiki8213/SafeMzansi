# Deploy Backend to Vercel (Web Interface - No CLI Needed)

## ⚠️ IMPORTANT: For APK Submission

Since you're submitting an APK file, your lecturer will test it **without your computer running**. You **MUST** deploy to a cloud service like Vercel so the backend is always available.

---

## Step-by-Step: Deploy via Vercel Website

### Step 1: Prepare Your Code (Optional - if using Git)

If your code is on GitHub:
- Make sure `server` folder is pushed to GitHub
- Skip to Step 2

If your code is NOT on GitHub:
- You can deploy directly from your computer (see Step 2)

### Step 2: Go to Vercel

1. **Open:** https://vercel.com
2. **Sign up/Login:**
   - Click "Sign Up" or "Log In"
   - Use GitHub account (easiest) or email
   - It's **FREE** for personal projects

### Step 3: Create New Project

1. **Click:** "Add New..." → "Project"
2. **Import Repository:**
   - **Option A (If on GitHub):** Select your repository
   - **Option B (If NOT on GitHub):** Click "Deploy without Git" → Continue

### Step 4: Configure Project

**If deploying from GitHub:**
- **Root Directory:** Click "Edit" → Enter `server` (or leave blank if server is root)
- **Framework Preset:** Select "Other" or "Express"
- **Build Command:** (leave blank)
- **Output Directory:** (leave blank)
- **Install Command:** `npm install`

**If deploying without Git:**
- Drag and drop your `server` folder
- Or click "Browse" and select the `server` folder

### Step 5: Add Environment Variables

**Click "Environment Variables"** and add:

1. **MONGO_URI:**
   - Name: `MONGO_URI`
   - Value: `mongodb+srv://sithomolamusiki_db_user:SG2bXovf3B3NlT0m@cluster0.xfosg7g.mongodb.net/safemzansi?retryWrites=true&w=majority`
   - Environment: Select all (Production, Preview, Development)

2. **JWT_SECRET:**
   - Name: `JWT_SECRET`
   - Value: `safemzansiSuperSecretKey` (or any random string)
   - Environment: Select all (Production, Preview, Development)

### Step 6: Deploy

1. **Click:** "Deploy"
2. **Wait 2-3 minutes** for deployment
3. **You'll see:** "Building..." then "Ready"

### Step 7: Get Your URL

After deployment completes:
- You'll see a URL like: `https://safemzansi-backend-xxxxx.vercel.app`
- **Your API URL is:** `https://safemzansi-backend-xxxxx.vercel.app/api`

### Step 8: Test Your Deployment

Open in browser:
```
https://YOUR-PROJECT-NAME.vercel.app/api
```

You should see:
```json
{"message":"SafeMzansi backend is running"}
```

---

## Step 9: Update APK (Optional - Pre-configure URL)

You can pre-configure the APK with the Vercel URL so your lecturer doesn't need to enter it:

1. **Edit:** `client/.env` (create if doesn't exist)
   ```
   VITE_MOBILE_API_URL=https://YOUR-PROJECT-NAME.vercel.app/api
   ```

2. **Rebuild APK:**
   ```powershell
   cd client
   npm run build
   npm run cap:sync
   npm run android:build
   ```

**OR** leave it as-is - the app will prompt for the URL when opened (which is fine for testing).

---

## Step 10: Share with Lecturer

**Give your lecturer:**
1. The APK file
2. The backend URL: `https://YOUR-PROJECT-NAME.vercel.app/api`

**Tell them:**
- Install the APK
- When prompted for "Backend Server URL", enter the URL above
- Click "Test Connection" → Should show ✅
- Click "Save & Continue"
- Sign up and test!

---

## Troubleshooting

### "Build Failed"
- Check that `server/api/index.js` exists
- Check that `server/vercel.json` exists
- Check environment variables are set correctly

### "MongoDB connection error"
- Verify `MONGO_URI` environment variable is correct
- Check MongoDB Atlas IP whitelist (should allow all IPs for testing)

### "404 Not Found"
- Make sure URL ends with `/api`
- Check `vercel.json` configuration

### "Function timeout"
- Vercel free tier has timeout limits
- For production, consider upgrading or optimizing

---

## Your Backend Will Be:

✅ **Always online** (24/7)  
✅ **Accessible from anywhere**  
✅ **No need to keep your computer running**  
✅ **Perfect for APK submission**

---

## After Deployment

Your backend URL will be permanent and work even when:
- Your computer is off
- You're not at home
- Your lecturer tests from anywhere

**This is what you need for APK submission!** 🚀

