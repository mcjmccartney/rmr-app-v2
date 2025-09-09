# Mapbox Members Map Setup Guide

## Overview
The Members Map feature uses Mapbox GL JS to display active members' locations on an interactive map. This guide covers setup, configuration, and usage.

## Prerequisites
- Mapbox account (free tier available)
- Next.js 15.3.3+ with React 19
- Supabase database with client and membership data

## 1. Mapbox Account Setup

### Create Account
1. Go to [mapbox.com](https://account.mapbox.com/auth/signup/)
2. Sign up for a free account (no credit card required)
3. Verify your email address

### Get Access Token
1. Go to your [Mapbox Account Dashboard](https://account.mapbox.com/)
2. Navigate to "Access tokens"
3. Copy your "Default public token" (starts with `pk.`)
4. Or create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`
   - `geocoding`

## 2. Environment Configuration

Add your Mapbox access token to your environment variables:

### Local Development (.env.local)
```bash
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
```

### Production (Vercel)
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add:
   - **Name**: `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`
   - **Value**: `pk.your_actual_token_here`
   - **Environment**: Production, Preview, Development

## 3. Dependencies

The following packages are already installed:
- `mapbox-gl`: ^3.14.0
- `react-map-gl`: ^7.1.9
- `@types/mapbox-gl`: ^3.4.1

## 4. Usage Limits (Free Tier)

Mapbox free tier includes:
- **50,000 map loads per month**
- **100,000 geocoding requests per month**
- No credit card required
- Perfect for small to medium applications

## 5. Features

### Interactive Map
- UK-focused view with street-level detail
- Custom amber-themed member markers
- Hover effects and smooth animations
- Navigation controls (zoom, pan)

### Geocoding
- Automatic address-to-coordinates conversion
- Smart caching to minimize API calls
- Batch processing with progress indicators
- UK postcode optimization

### Member Information
- Popup cards with member details
- Dog names, email addresses, membership dates
- Full address display
- Auto-fit bounds to show all members

### Data Sources (Priority Order)
1. **Behaviour Questionnaires** (most complete)
2. **Client profiles** (basic address)
3. **Behavioural briefs** (postcode only)

## 6. Performance Optimizations

### Caching Strategy
- localStorage caching of geocoded coordinates
- Cache keys based on normalized addresses
- Refresh cache functionality for updates

### Rate Limiting
- Respects Mapbox API rate limits
- Sequential geocoding to avoid throttling
- Progress indicators for user feedback

### Bundle Optimization
- Dynamic imports for SSR compatibility
- Lazy loading of map components
- Minimal bundle impact

## 7. Troubleshooting

### Map Not Loading
- Check if `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is set
- Verify token has correct permissions
- Check browser console for errors

### Geocoding Issues
- Ensure addresses are properly formatted
- Check API usage limits in Mapbox dashboard
- Clear cache if getting stale results

### Performance Issues
- Monitor API usage in Mapbox dashboard
- Consider implementing clustering for large datasets
- Use cache refresh sparingly

## 8. Security Notes

- Access token is public (starts with `pk.`)
- Restrict token to specific URLs in production
- Monitor usage to prevent abuse
- Rotate tokens periodically

## 9. Support

For issues or questions:
- Check Mapbox documentation: [docs.mapbox.com](https://docs.mapbox.com/)
- Review API limits: [mapbox.com/pricing](https://www.mapbox.com/pricing/)
- Contact support through Mapbox dashboard
