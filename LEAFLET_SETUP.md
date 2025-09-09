# Leaflet + OpenStreetMap Setup Guide

This guide explains the Members Map feature implementation using Leaflet and OpenStreetMap for the Raising My Rescue app.

## 🎉 Why Leaflet + OpenStreetMap?

- **Completely FREE** - No API keys, no usage limits, no credit card required
- **No registration needed** - Works out of the box
- **Excellent for UK addresses** - Great postcode and address support
- **Lightweight and fast** - Smaller bundle size than Mapbox
- **Open source** - Full control and customization

## 📦 Dependencies Installed

The following packages have been added to your project:

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1", 
  "@types/leaflet": "^1.9.12"
}
```

## 🗂️ Files Created

### Core Components:
- **`src/hooks/useGeocoding.ts`** - Geocoding hook using Nominatim (OpenStreetMap's free geocoding service)
- **`src/components/maps/MembersMap.tsx`** - Interactive Leaflet map component
- **`src/components/modals/MembersMapModal.tsx`** - Modal containing map and statistics

### Integration:
- **`src/app/memberships/page.tsx`** - Already integrated with map button and modal

## 🌍 Geocoding Service: Nominatim

**Nominatim** is OpenStreetMap's free geocoding service:

- **Completely free** with no API keys required
- **Rate limit**: 1 request per second (respectfully implemented)
- **UK-focused**: Excellent support for UK addresses and postcodes
- **Usage policy**: Requires User-Agent header (already implemented)

### API Endpoint Used:
```
https://nominatim.openstreetmap.org/search?format=json&q={address}&countrycodes=gb&limit=1&addressdetails=1
```

## 🎯 Features Implemented

### 📍 **Smart Address Resolution**
The system uses addresses in this priority order:

1. **Behaviour Questionnaire** (most complete):
   - `address1`, `address2`, `city`, `state_province`, `zip_postal_code`, `country`

2. **Client Address Field**:
   - Basic `address` field from clients table

3. **Behavioural Brief Postcode**:
   - Just the `postcode` field (fallback option)

### 🗺️ **Interactive Map**
- **OpenStreetMap tiles** - Free, high-quality map tiles
- **Custom markers** with amber theme matching your app
- **Interactive popups** showing member details
- **Auto-fit bounds** to show all members optimally
- **Zoom and pan controls**
- **Hover effects** on markers

### 👥 **Active Member Detection**
- **Membership validation** (must have `membership: true`)
- **Recent payment verification** (within last 2 months)
- **Address availability check**
- **Statistics dashboard** showing counts

### ⚡ **Performance Features**
- **localStorage caching** - Prevents repeated geocoding of same addresses
- **Rate limiting** - 1 second delay between requests (Nominatim policy)
- **Batch processing** - Sequential geocoding with progress indicator
- **Dynamic imports** - Leaflet loaded only when needed (SSR-safe)
- **Cleanup handling** - Proper map instance cleanup

### 📊 **Statistics Dashboard**
- **Total Active Members** - Count of members with recent payments
- **Members with Addresses** - Count of members with addressable data
- **Successfully Mapped** - Count of members successfully geocoded
- **Missing Address Warning** - Alert for members without addresses

## 🚀 How to Use

1. **Go to Memberships page**
2. **Click the map pin icon (📍)** in the header
3. **The system automatically:**
   - Finds all active members (with recent membership payments)
   - Extracts addresses from available sources
   - Geocodes addresses to coordinates (with caching)
   - Displays them on an interactive map

## 🎨 UI Features

### Map Display:
- **Custom amber markers** (👤) matching app theme
- **Member popups** showing:
  - Client name
  - Dog name (if available)
  - Email address
  - Membership date
  - Full address
- **Member count badge** in bottom-left corner

### Modal Interface:
- **Statistics panel** showing member counts
- **Progress indicator** during geocoding
- **Warning messages** for missing addresses
- **Refresh button** to clear cache and re-geocode

## 🔧 Technical Implementation

### Geocoding Cache:
```javascript
// Cache key format
localStorage.setItem(`geocode_${clientId}`, JSON.stringify({
  lat: 51.5074,
  lng: -0.1278
}));
```

### Rate Limiting:
```javascript
// 1 second delay between requests (Nominatim policy)
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Custom Markers:
```javascript
const customIcon = L.divIcon({
  html: `<div style="background-color: #92400e; ...">👤</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});
```

## 🛡️ Privacy & Performance

### Privacy:
- **No tracking** - OpenStreetMap doesn't track users
- **No API keys** - No sensitive credentials to manage
- **Local caching** - Addresses cached locally, not sent repeatedly

### Performance:
- **Caching system** - Prevents repeated API calls
- **Rate limiting** - Respectful to Nominatim servers
- **Lazy loading** - Map only loads when modal opens
- **Cleanup** - Proper memory management

## 🔍 Troubleshooting

### Map Not Loading:
- Check browser console for JavaScript errors
- Ensure internet connection (needs to load Leaflet CSS/JS)
- Try refreshing the page

### No Members Showing:
- Check that members have `membership: true` in database
- Verify members have recent membership payments (within 2 months)
- Ensure members have address information in supported formats

### Geocoding Issues:
- UK addresses and postcodes work best
- Use "Refresh Locations" button to clear cache
- Check browser console for geocoding errors
- Nominatim may be temporarily unavailable (rare)

### Performance Issues:
- Clear geocoding cache using refresh button
- Check network tab for slow API responses
- Nominatim has 1 request/second limit (automatically handled)

## 📈 Benefits Over Mapbox

| Feature | Leaflet + OSM | Mapbox |
|---------|---------------|---------|
| **Cost** | Completely Free | Free tier with limits |
| **Setup** | No registration | Requires account + token |
| **API Keys** | None required | Required |
| **Usage Limits** | None | 50K map loads, 100K geocoding |
| **UK Support** | Excellent | Excellent |
| **Bundle Size** | Smaller | Larger |
| **Customization** | Full control | Limited on free tier |

## 🎯 Next Steps

The Members Map is now fully functional! Consider these future enhancements:

1. **Clustering** - Group nearby markers for dense areas
2. **Filters** - Filter by membership type, date range, etc.
3. **Export** - Export member locations to CSV/Excel
4. **Heatmap** - Show member density across regions
5. **Directions** - Integration with routing services

---

**The Members Map feature is ready to use with no additional setup required!** 🎉

Just click the map pin icon on the Memberships page and start exploring your member locations across the UK.
