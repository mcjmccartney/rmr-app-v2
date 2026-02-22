# Google Maps API Setup for Members Map

## Overview

The Members Map uses **Google Maps Geocoding API** to convert postcodes/zip codes into approximate coordinates for plotting on the map.

**Key Features:**
- ✅ Supports UK postcodes (e.g., "SW1A 1AA", "M1 1AE")
- ✅ Supports US zip codes (e.g., "08003", "90210")
- ✅ Supports international addresses worldwide
- ✅ Postcode-level accuracy (approximate area center, not door-level)
- ✅ 30-day localStorage caching (instant after first load)

---

## Why Google Maps Instead of Mapbox?

**Previous setup (Mapbox):**
- ❌ Restricted to UK only (`country=gb` parameter)
- ❌ US zip codes like "08003" didn't work
- ✅ 100,000 free geocoding requests/month

**New setup (Google Maps):**
- ✅ Worldwide support (UK, US, and 200+ countries)
- ✅ US zip codes work perfectly
- ✅ $200 free credit/month (~40,000 geocoding requests)
- ✅ More accurate for international addresses

---

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Geocoding API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Geocoding API"
   - Click "Enable"
4. Create API credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key

### 2. Restrict Your API Key (Security)

**Important:** Restrict your API key to prevent unauthorized use!

1. Click on your API key in the Credentials page
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     ```
     https://rmrcms.vercel.app/*
     https://*.vercel.app/*
     http://localhost:3000/*
     ```
3. Under "API restrictions":
   - Select "Restrict key"
   - Check only: **Geocoding API**
4. Click "Save"

### 3. Add API Key to Environment Variables

Add to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Add to Vercel environment variables:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value:** Your API key
   - **Environments:** Production, Preview, Development
3. Click "Save"
4. Redeploy your app

---

## How It Works

### 1. Postcode/Zip Code Extraction

The system extracts postcodes from the Client `address` field:

**UK Postcode:**
```
Address: "123 High Street, London, SW1A 1AA"
Extracted: "SW1A 1AA"
```

**US Zip Code:**
```
Address: "456 Main St, Cherry Hill, 08003"
Extracted: "08003"
```

**Regex patterns:**
- UK: `([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})$`
- US: `(\d{5}(-\d{4})?)$`

### 2. Geocoding with Caching

**First time a postcode is geocoded:**
1. Extract postcode from address
2. Call Google Maps Geocoding API
3. Get approximate coordinates (postcode area center)
4. Cache in localStorage for 30 days
5. Plot marker on map

**Subsequent loads:**
1. Extract postcode from address
2. Check localStorage cache
3. Use cached coordinates (no API call!)
4. Plot marker on map

**Result:** After the first load, the map is **instant** (no API calls needed)

### 3. Approximate Locations

Geocoding a postcode returns the **approximate center** of that postcode area:

- **UK Postcode "SW1A 1AA"** → Westminster area center (~100m radius)
- **US Zip Code "08003"** → Cherry Hill, NJ area center (~1-5km radius)

This is perfect for a Members Map overview - you don't need door-level accuracy.

---

## API Usage & Costs

### Free Tier
- **$200 credit per month** (automatically applied)
- **~40,000 geocoding requests** at $5 per 1,000 requests
- **No credit card required** for free tier

### Your Expected Usage
- **~50-100 members** with addresses
- **First load:** 50-100 API calls (one-time per postcode)
- **Subsequent loads:** 0 API calls (cached for 30 days)
- **New members:** 1 API call per new member
- **Cache refresh:** ~50-100 API calls per month (when cache expires)

**Total monthly usage: ~100-200 API calls**  
**Cost: FREE** (well within $200 credit)

---

## Files Modified

### `src/app/api/geocode/route.ts`
- Changed from Mapbox to Google Maps Geocoding API
- Removed `country=gb` restriction (now worldwide)
- Updated response parsing for Google Maps format

### `src/components/modals/MembersMapModal.tsx`
- Updated `extractPostcode()` to handle both UK and US formats
- No changes to caching logic (still 30-day expiry)

---

## Testing

### Test UK Postcode
1. Create a client with address: `"123 High St, London, SW1A 1AA"`
2. Open Members Map
3. Should see pin in Westminster, London

### Test US Zip Code
1. Create a client with address: `"456 Main St, Cherry Hill, 08003"`
2. Open Members Map
3. Should see pin in Cherry Hill, New Jersey, USA

### Test Caching
1. Open Members Map (first load - may take 5-10 seconds)
2. Close and reopen Members Map
3. Should load instantly (< 1 second)

---

## Troubleshooting

### "Google Maps API key not configured"
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in environment variables
- Restart your dev server after adding the key
- Redeploy to Vercel after adding the key

### "Geocoding failed: REQUEST_DENIED"
- Your API key may not have Geocoding API enabled
- Check API restrictions on your key
- Make sure your domain is in the HTTP referrer list

### "No results found"
- The postcode/address may be invalid
- Check that the address field contains a valid postcode
- Try the full address if postcode extraction fails

### Pins not appearing on map
- Check browser console for errors
- Verify API key is correct
- Check that Geocoding API is enabled in Google Cloud Console

---

## Related Documentation

- [Google Maps Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/) (still used for map rendering)

