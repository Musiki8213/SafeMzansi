# Fix RefererNotAllowedMapError

## Error Message
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: http://localhost:5175/map
```

## Solution

This error occurs because your Google Maps API key has **HTTP referrer restrictions** that don't include your localhost URL.

### Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to API Credentials**
   - Go to **APIs & Services** > **Credentials**
   - Find your API key: `AIzaSyAeoH2TrdBXsN6v_ETdXwsi7wo2hdo02D8`
   - Click on the key to edit it

3. **Update Application Restrictions**

   **Option A: Remove Restrictions (Easiest for Development)**
   - Under **Application restrictions**, select **None**
   - Click **Save**
   - ⚠️ **Warning**: Only for development! Always restrict in production.
   
   **Option B: Add Specific Referrers (If Option A doesn't work)**
   - Under **Application restrictions**, select **HTTP referrers (web sites)**
   - Click **Add an item**
   - Try these formats (one at a time, in this order):
     1. First try: `http://localhost:5175/`
     2. If that works, also add: `http://localhost:5175/*`
     3. Alternative format: `localhost:5175/*`
   
   **Note**: If Google rejects `http://localhost:*`, try the specific port format above.
   
   **For production**, add:
     ```
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     ```

4. **Save Changes**
   - Click **Save**
   - Wait 5-10 minutes for changes to propagate

5. **Test**
   - Clear browser cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Refresh the page
   - The error should be gone

## Alternative: Remove Restrictions (Development Only)

For development/testing, you can temporarily remove restrictions:

1. Under **Application restrictions**, select **None**
2. Click **Save**
3. **Warning**: Only do this for development. Always restrict keys in production!

## Troubleshooting: "Invalid website domain" Error

If Google Cloud Console rejects `http://localhost:*`, try these solutions:

### Solution 1: Remove Restrictions (Recommended for Development)
1. Under **Application restrictions**, select **None**
2. Click **Save**
3. This allows the API key to work from any domain (development only!)

### Solution 2: Use Specific Port Format
Try adding these one at a time:
- `http://localhost:5175/` (with trailing slash, no wildcard)
- `http://localhost:5175/*` (with wildcard)
- `localhost:5175/*` (without http://)

### Solution 3: Check API Restrictions Instead
If Application restrictions don't work:
1. Go to **API restrictions** tab
2. Select **Restrict key**
3. Enable only: **Maps JavaScript API** and **Places API**
4. Leave **Application restrictions** as **None**

## Valid Formats (if accepted)
- ✅ `http://localhost:5175/` (specific port with trailing slash)
- ✅ `http://localhost:5175/*` (specific port with wildcard)
- ❌ `http://localhost:*` (may be rejected by some Google Cloud Console versions)
- ❌ `http://127.0.0.1:*` (NOT accepted)
- ❌ `https://localhost:*` (NOT accepted)

## Current Port

Your app is running on: `http://localhost:5175`

Make sure this exact URL (or the pattern `http://localhost:*`) is in your API key restrictions.

## After Fixing

Once the restrictions are updated:
- ✅ The `RefererNotAllowedMapError` will disappear
- ✅ Maps will load correctly
- ✅ All features will work

---

**Note**: Changes to API key restrictions can take 5-10 minutes to take effect.

