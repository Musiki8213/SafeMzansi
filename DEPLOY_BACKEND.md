# Quick Backend Deployment Guide for Lecturer Testing

## Your Lecturer Needs This URL:
```
https://YOUR-VERCEL-URL.vercel.app/api
```

## Step 1: Install Vercel CLI (if not installed)
```bash
npm install -g vercel
```

## Step 2: Deploy Backend to Vercel

1. **Navigate to server folder:**
   ```bash
   cd server
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```
   - Follow the prompts to login (use GitHub/Google/Email)

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow prompts:
     - Set up and deploy? **Yes**
     - Which scope? (Choose your account)
     - Link to existing project? **No**
     - Project name: `safemzansi-backend` (or your choice)
     - Directory: `./` (current directory)
     - Override settings? **No**

4. **Set Environment Variables:**
   ```bash
   vercel env add MONGO_URI
   # Paste your MongoDB connection string when prompted
   
   vercel env add JWT_SECRET
   # Enter a secure random string (e.g., "my-secret-key-12345")
   ```

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

6. **Get Your URL:**
   - After deployment, Vercel will show you a URL like:
   - `https://safemzansi-backend.vercel.app`
   - Your API URL will be: `https://safemzansi-backend.vercel.app/api`

## Step 3: Update Mobile App

1. **Rebuild app with production URL:**
   - Edit `client/src/utils/api.js`
   - Change line 21 to your Vercel URL:
   ```javascript
   const mobileApiUrl = import.meta.env.VITE_MOBILE_API_URL || 'https://YOUR-VERCEL-URL.vercel.app/api';
   ```

2. **Or use environment variable:**
   - Create `client/.env`:
   ```
   VITE_MOBILE_API_URL=https://YOUR-VERCEL-URL.vercel.app/api
   ```

3. **Rebuild APK:**
   ```bash
   cd client
   npm run build
   npm run cap:sync
   npm run android:build
   ```

## Step 4: Give Lecturer the URL

Tell your lecturer to enter this in the app:
```
https://YOUR-VERCEL-URL.vercel.app/api
```

## Alternative: Quick Test URL

If you need a URL right now for testing, you can use a temporary service like:
- **ngrok** (creates public URL to localhost)
- **localtunnel** (similar to ngrok)

But Vercel is the best permanent solution.

