# How to Remove "For Development Purposes Only" Watermark

The watermark appears because Google Maps requires billing to be set up, even for the free tier. Here's how to fix it:

## Steps to Remove the Watermark

### 1. Set Up Billing in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Navigate to **Billing** in the left menu
4. Click **Link a billing account**
5. Add a payment method (credit card)
   - **Note**: You won't be charged unless you exceed the free tier limits
   - Free tier includes: 28,000 map loads/month, 1,000 Places requests/month

### 2. Enable Required APIs

1. Go to **APIs & Services** > **Library**
2. Enable these APIs:
   - ✅ **Maps JavaScript API** (Required)
   - ✅ **Places API** (For location search)
   - ✅ **Geocoding API** (Optional, for reverse geocoding)

### 3. Verify API Key Configuration

1. Go to **APIs & Services** > **Credentials**
2. Find your API key: `AIzaSyBuBXs8a6a9so-1J37OQDjpASMHZpmhwU8`
3. Click on it to edit
4. Under **API restrictions**:
   - Select "Restrict key"
   - Enable only: Maps JavaScript API, Places API
5. Under **Application restrictions** (optional but recommended):
   - Select "HTTP referrers (web sites)"
   - Add: `localhost:*` for development
   - Add: `yourdomain.com/*` for production

### 4. Create a Map ID (Optional but Recommended)

For advanced features like custom styling and better performance:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Maps** > **Map Styles**
3. Click **Create Map ID**
4. Name it: `safemzansi-map`
5. Select map type: **JavaScript**
6. Copy the Map ID

Then update `Map.jsx`:
```javascript
map.current = new Map(mapContainer.current, {
  // ... other options
  mapId: 'safemzansi-map', // Add this line
});
```

### 5. Wait for Changes to Propagate

- API changes: Usually instant, but can take a few minutes
- Billing setup: May take 5-10 minutes to activate
- Clear browser cache and refresh

## Free Tier Limits

You won't be charged as long as you stay within:

- **Maps JavaScript API**: 28,000 map loads/month (free)
- **Places API**: 
  - 1,000 Autocomplete requests/month (free)
  - 1,000 Place Details requests/month (free)
- **Geocoding API**: 40,000 requests/month (free)

## Troubleshooting

### Watermark Still Appears After Setup

1. **Check billing status**:
   - Go to Billing > Accounts
   - Ensure status is "Active"

2. **Verify API key**:
   - Check browser console for errors
   - Look for `NoApiKeys` or `MissingKeyMapError`

3. **Check API restrictions**:
   - Ensure your domain is allowed
   - For localhost, use: `localhost:*` or `127.0.0.1:*`

4. **Clear cache**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear browser cache

5. **Wait a few minutes**:
   - Changes can take 5-10 minutes to propagate

### Common Errors

**Error: "This API project is not authorized to use this API"**
- Solution: Enable the Maps JavaScript API in API Library

**Error: "RefererNotAllowedMapError"**
- Solution: Add your domain to API key restrictions

**Error: "BillingNotEnabledMapError"**
- Solution: Set up billing account

## Quick Checklist

- [ ] Billing account created and linked
- [ ] Payment method added (won't be charged on free tier)
- [ ] Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] API key restrictions configured
- [ ] Browser cache cleared
- [ ] Waited 5-10 minutes for changes to propagate

## After Setup

Once billing is active, the watermark will automatically disappear. The map will work exactly the same, just without the watermark.

## Monitoring Usage

To monitor your usage and avoid unexpected charges:

1. Go to **APIs & Services** > **Dashboard**
2. View usage for each API
3. Set up billing alerts:
   - Go to **Billing** > **Budgets & alerts**
   - Create a budget to get notified if you approach limits

---

**Note**: The watermark is Google's way of ensuring proper billing setup. Once billing is configured, it disappears automatically. You won't be charged unless you exceed the generous free tier limits.

