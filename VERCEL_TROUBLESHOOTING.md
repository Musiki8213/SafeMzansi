# Vercel Deployment Troubleshooting

## 404 DEPLOYMENT_NOT_FOUND Error

This error typically means:
1. The deployment failed during build
2. The function/routes aren't configured correctly
3. The project structure doesn't match Vercel's expectations

## Quick Fixes

### For Server (Backend)

1. **Check your project structure:**
   ```
   server/
   ├── api/
   │   └── index.js  ← Must exist
   ├── routes/
   ├── models/
   ├── middleware/
   ├── package.json
   └── vercel.json
   ```

2. **Verify api/index.js exports correctly:**
   ```javascript
   // Should export the Express app
   export default app;
   ```

3. **Check Vercel logs:**
   - Go to your Vercel dashboard
   - Click on the failed deployment
   - Check the "Build Logs" tab
   - Look for errors

4. **Common issues:**
   - Missing environment variables (MONGO_URI, JWT_SECRET)
   - Import errors (check all file paths)
   - MongoDB connection issues

### For Client (Frontend)

1. **Check build output:**
   - Vercel should auto-detect Vite
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Verify environment variables:**
   - `VITE_API_URL` should be set to your backend URL

## Step-by-Step Redeployment

### Server Redeployment

1. **Delete the failed deployment** (optional, but recommended)

2. **Verify structure:**
   ```bash
   cd server
   ls api/index.js  # Should exist
   ```

3. **Test locally first:**
   ```bash
   # Make sure it works locally
   npm install
   npm start
   ```

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

5. **Or via dashboard:**
   - Go to Vercel dashboard
   - Click "Redeploy" on the latest deployment
   - Or create a new deployment

### Client Redeployment

1. **Verify build works:**
   ```bash
   cd client
   npm run build
   # Check that dist/ folder is created
   ```

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

## Alternative: Use Vercel CLI to Debug

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Test build locally:**
   ```bash
   cd server
   vercel dev
   # This will simulate Vercel locally
   ```

3. **Check for errors in the output**

## Environment Variables Checklist

### Server Environment Variables:
- ✅ `MONGO_URI` - MongoDB connection string
- ✅ `JWT_SECRET` - Secret for JWT tokens
- ✅ `PORT` - (Optional, Vercel sets this)

### Client Environment Variables:
- ✅ `VITE_API_URL` - Your backend URL (e.g., `https://your-backend.vercel.app/api`)

## Common Error Solutions

### "Cannot find module"
- Make sure all dependencies are in `package.json`
- Run `npm install` before deploying
- Check import paths are correct

### "MongoDB connection error"
- Verify `MONGO_URI` is set correctly
- Check MongoDB Atlas IP whitelist (should include `0.0.0.0/0`)
- Verify database credentials

### "Route not found" after deployment
- Check `vercel.json` rewrites configuration
- Verify `api/index.js` exists and exports correctly
- Check that routes are mounted correctly in the Express app

## Manual Deployment Test

If automatic deployment fails, try manual deployment:

1. **Build the project:**
   ```bash
   cd server
   npm install
   ```

2. **Deploy via CLI:**
   ```bash
   vercel
   # Follow prompts
   # Set environment variables when asked
   ```

3. **Or drag and drop:**
   - Go to Vercel dashboard
   - Create new project
   - Drag the `server` folder
   - Configure settings manually

## Still Having Issues?

1. **Check Vercel Status:** [status.vercel.com](https://status.vercel.com)
2. **Review Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
3. **Check Build Logs:** Look for specific error messages
4. **Test Locally:** Make sure everything works locally first

## Quick Test Commands

```bash
# Test server locally
cd server
npm install
npm start
# Should start on port 5000

# Test client build
cd client
npm install
npm run build
# Should create dist/ folder

# Test Vercel locally (server)
cd server
vercel dev
# Simulates Vercel environment
```

