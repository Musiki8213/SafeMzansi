# Vercel Deployment Guide for SafeMzansi

This guide will help you deploy both the frontend (client) and backend (server) to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a free MongoDB database at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **GitHub Account**: (Recommended) For automatic deployments

## Deployment Strategy

You have two options:

### Option 1: Deploy as Separate Projects (Recommended)
- Deploy `client/` as one Vercel project
- Deploy `server/` as another Vercel project
- Easier to manage and scale independently

### Option 2: Deploy as Monorepo
- Deploy both from root directory
- More complex configuration

We'll use **Option 1** (separate projects).

---

## Step 1: Prepare MongoDB

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist IP addresses (use `0.0.0.0/0` for Vercel)
5. Get your connection string (MONGO_URI)

---

## Step 2: Deploy Backend (Server)

### Via Vercel CLI:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Navigate to server directory**:
   ```bash
   cd server
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Project name: `safemzansi-server` (or your choice)
   - Directory: `./` (current directory)
   - Override settings: No

5. **Set Environment Variables**:
   ```bash
   vercel env add MONGO_URI
   # Paste your MongoDB connection string
   
   vercel env add JWT_SECRET
   # Enter a secure random string (e.g., use: openssl rand -base64 32)
   
   vercel env add PORT
   # Enter: 5000 (or leave empty, Vercel will set it)
   ```

6. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

7. **Note your backend URL**: 
   - It will be something like: `https://safemzansi-server.vercel.app`
   - Save this URL for the frontend configuration

### Via Vercel Dashboard:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select the `server` folder as root directory
4. Framework Preset: **Other**
5. Build Command: Leave empty (or `npm install`)
6. Output Directory: Leave empty
7. Add Environment Variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string
   - `PORT`: `5000` (optional)
8. Click **Deploy**

---

## Step 3: Deploy Frontend (Client)

### Via Vercel CLI:

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - Project name: `safemzansi` (or your choice)
   - Directory: `./` (current directory)
   - Override settings: No

3. **Set Environment Variable**:
   ```bash
   vercel env add VITE_API_URL
   # Enter your backend URL: https://safemzansi-server.vercel.app/api
   ```

4. **Redeploy with environment variable**:
   ```bash
   vercel --prod
   ```

### Via Vercel Dashboard:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select the `client` folder as root directory
4. Framework Preset: **Vite**
5. Build Command: `npm run build` (auto-detected)
6. Output Directory: `dist` (auto-detected)
7. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-url.vercel.app/api`
8. Click **Deploy**

---

## Step 4: Update CORS Settings (If Needed)

If you encounter CORS errors, update `server/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend-url.vercel.app',
    'http://localhost:5173' // For local development
  ],
  credentials: true
}));
```

---

## Step 5: Verify Deployment

1. **Test Backend**:
   - Visit: `https://your-backend-url.vercel.app/api`
   - Should see: `{"message":"SafeMzansi backend is running"}`

2. **Test Frontend**:
   - Visit: `https://your-frontend-url.vercel.app`
   - Should see the SafeMzansi app
   - Try logging in/registering

---

## Environment Variables Summary

### Backend (Server) Environment Variables:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/safemzansi?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-string-here
PORT=5000 (optional)
```

### Frontend (Client) Environment Variables:
```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

---

## Troubleshooting

### Backend Issues:

1. **MongoDB Connection Error**:
   - Check MONGO_URI is correct
   - Verify IP whitelist includes Vercel IPs (0.0.0.0/0)
   - Check database user credentials

2. **Routes Not Working**:
   - Verify vercel.json is correct
   - Check that api/index.js exists
   - Review Vercel function logs

### Frontend Issues:

1. **API Calls Failing**:
   - Verify VITE_API_URL is set correctly
   - Check browser console for errors
   - Verify CORS settings on backend

2. **Build Fails**:
   - Check Node.js version (should be 18+)
   - Review build logs in Vercel dashboard
   - Ensure all dependencies are in package.json

---

## Continuous Deployment

If you connected a Git repository:

- **Automatic Deployments**: Every push to main/master triggers a new deployment
- **Preview Deployments**: Pull requests get preview URLs
- **Production Deployments**: Only main/master branch deploys to production

---

## Custom Domains

1. Go to your project settings in Vercel
2. Navigate to **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Cost Considerations

- **Vercel Free Tier**: 
  - 100GB bandwidth/month
  - Serverless function execution time limits
  - Perfect for small to medium apps

- **MongoDB Atlas Free Tier**:
  - 512MB storage
  - Shared cluster
  - Perfect for development and small apps

---

## Next Steps

1. ✅ Deploy backend to Vercel
2. ✅ Deploy frontend to Vercel
3. ✅ Test both deployments
4. ✅ Update mobile app API URL (if using APK)
5. ✅ Set up custom domain (optional)
6. ✅ Configure monitoring and analytics (optional)

---

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Capacitor Documentation](https://capacitorjs.com/docs)

