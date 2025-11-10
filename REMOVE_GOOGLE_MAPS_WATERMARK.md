# How to Remove "For Development Purposes Only" Watermark

The watermark appears because **billing must be set up** in Google Cloud Console, even for the free tier.

## Quick Fix Steps

### 1. Set Up Billing (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **Billing** in the left menu
4. Click **Link a billing account**
5. Add a payment method (credit card)
   - **Important**: You won't be charged unless you exceed free tier limits
   - Free tier includes: **28,000 map loads/month** (free)

### 2. Enable Maps JavaScript API

1. Go to **APIs & Services** > **Library**
2. Search for "Maps JavaScript API"
3. Click on it and press **Enable**
4. Also enable **Places API** (for location search)

### 3. Verify API Key Configuration

1. Go to **APIs & Services** > **Credentials**
2. Find your API key: `AIzaSyAeoH2TrdBXsN6v_ETdXwsi7wo2hdo02D8`
3. Click on it to edit
4. Under **API restrictions**:
   - Select "Don't restrict key" (for testing)
   - OR restrict to: Maps JavaScript API, Places API
5. Under **Application restrictions** (optional):
   - For development: Add `localhost:*`
   - For production: Add your domain `yourdomain.com/*`

### 4. Wait and Refresh

- Changes can take **5-10 minutes** to propagate
- Clear browser cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Refresh the page

## Why the Watermark Appears

Google Maps shows this watermark when:
- ❌ Billing is not set up
- ❌ Maps JavaScript API is not enabled
- ❌ API key has incorrect restrictions
- ❌ API key is invalid or expired

## Free Tier Limits

You **won't be charged** as long as you stay within:

- **Maps JavaScript API**: 28,000 map loads/month (FREE)
- **Places API**: 1,000 requests/month (FREE)
- **Geocoding API**: 40,000 requests/month (FREE)

## Troubleshooting

### Watermark Still Appears After Setup

1. **Check billing status**:
   - Go to Billing > Accounts
   - Ensure status shows "Active"

2. **Verify API key**:
   - Check browser console (F12) for errors
   - Look for: `NoApiKeys`, `MissingKeyMapError`, or `RefererNotAllowedMapError`

3. **Check API restrictions**:
   - Ensure your domain/IP is allowed
   - For localhost: Use `localhost:*` or `127.0.0.1:*`

4. **Wait longer**:
   - Sometimes takes 10-15 minutes for changes to take effect

### Common Errors

**"This page can't load Google Maps correctly"**
- Solution: Enable Maps JavaScript API in API Library

**"RefererNotAllowedMapError"**
- Solution: Add your domain to API key restrictions

**"BillingNotEnabledMapError"**
- Solution: Set up billing account (even for free tier)

## After Setup

Once billing is active:
- ✅ Watermark disappears automatically
- ✅ Map loads without restrictions
- ✅ All features work normally
- ✅ You stay within free tier (no charges)

## Your API Key

```
AIzaSyAeoH2TrdBXsN6v_ETdXwsi7wo2hdo02D8
```

This key is already configured in `client/src/pages/Map.jsx`

## Need Help?

- [Google Maps Platform FAQ](https://developers.google.com/maps/faq)
- [Maps JavaScript API Troubleshooting](https://developers.google.com/maps/documentation/javascript/troubleshooting)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Note**: The watermark is Google's way of ensuring proper billing setup. Once billing is configured, it disappears automatically. You won't be charged unless you exceed the generous free tier limits.

