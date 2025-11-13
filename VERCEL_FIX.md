# Fixing "Route not found" Error on Vercel

## Problem
Getting `{"message":"Route not found"}` when accessing Vercel deployment.

## Solution Applied

### 1. Fixed `vercel.json`
Changed from rewrite rules to function configuration:
```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. Added Root Route
Added a root `/` route handler in addition to `/api`:
```javascript
app.get('/', (req, res) => {
  res.json({ message: 'SafeMzansi backend is running' });
});
```

## Testing Your Deployment

After redeploying, test these URLs:

1. **Root:** `https://your-project.vercel.app/`
2. **API Base:** `https://your-project.vercel.app/api`
3. **Register:** `https://your-project.vercel.app/api/register`
4. **Reports:** `https://your-project.vercel.app/api/reports`

## How Vercel Routes Work

- File at `api/index.js` → Available at `/api/*`
- All routes in Express app are relative to `/api`
- So `/api/register` in your app = `https://your-project.vercel.app/api/register`

## Next Steps

1. **Redeploy to Vercel:**
   - Go to your Vercel dashboard
   - Click "Redeploy" or push new code
   - Wait for deployment

2. **Test the URLs above**

3. **If still not working:**
   - Check Vercel function logs
   - Verify environment variables are set
   - Check MongoDB connection

## Common Issues

### Still getting 404?
- Make sure you're accessing `/api` not just root
- Check Vercel deployment logs for errors
- Verify `api/index.js` exists in your deployment

### MongoDB connection error?
- Check `MONGO_URI` environment variable in Vercel
- Verify MongoDB Atlas IP whitelist allows all IPs

### Routes not matching?
- All routes should start with `/api` in your Express app
- Vercel automatically prefixes with `/api` from the folder name

