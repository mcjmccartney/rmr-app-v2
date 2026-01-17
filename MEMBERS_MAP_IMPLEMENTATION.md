# Members Map Implementation Details

## Architecture Overview

The Members Map feature consists of several interconnected components that work together to display active members on an interactive Mapbox-powered map.

## Component Structure

### 1. MembersMapModal (`src/components/modals/MembersMapModal.tsx`)
**Purpose**: Main modal container that orchestrates the mapping functionality

**Key Features**:
- Filters active members based on recent membership payments (last 1 month)
- Prioritizes address data from multiple sources
- Manages geocoding state and progress
- Displays statistics dashboard
- Handles cache management

**Data Flow**:
```
Supabase Data → Active Member Filter → Address Extraction → Geocoding → Map Display
```

### 2. MembersMap (`src/components/maps/MembersMap.tsx`)
**Purpose**: Interactive Mapbox GL JS map component

**Key Features**:
- Dynamic Mapbox GL JS loading for SSR compatibility
- Custom amber-themed markers with hover effects
- Rich popup cards with member information
- Auto-fit bounds to display all members
- Refresh cache functionality

### 3. useGeocoding Hook (`src/hooks/useGeocoding.ts`)
**Purpose**: Handles address-to-coordinate conversion using Mapbox Geocoding API

**Key Features**:
- Batch geocoding with progress tracking
- localStorage caching to minimize API calls
- Error handling and retry logic
- UK-specific geocoding optimization

## Data Sources & Priority

### Address Resolution Priority
1. **Behaviour Questionnaires** (Highest Priority)
   - Complete address fields: `address1`, `address2`, `city`, `state_province`, `zip_postal_code`, `country`
   - Most reliable and complete data source

2. **Client Profiles** (Medium Priority)
   - Basic `address` field
   - Often contains full addresses but less structured

3. **Behavioural Briefs** (Lowest Priority)
   - Only `postcode` field available
   - Least precise but better than no location data

### Active Member Filtering
```typescript
// Members are considered active if:
// 1. They have membership = true in client record
// 2. They have a membership payment within last 1 month
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const activeMembers = clients.filter(client => {
  return client.membership &&
         client.email &&
         recentMemberEmails.has(client.email);
});
```

## Technical Implementation

### Mapbox Integration
```typescript
// Dynamic import for SSR compatibility
const mapboxModule = await import('mapbox-gl');
const mapboxgl = mapboxModule.default;

// Initialize map with UK-focused view
map.current = new mapboxgl.Map({
  container: mapContainer.current,
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-2.5, 54.5], // UK center
  zoom: 5.5
});
```

### Custom Markers
```typescript
// Amber-themed markers matching app design
const markerElement = document.createElement('div');
markerElement.innerHTML = `
  <div style="
    background-color: #92400e;
    color: white;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  ">👤</div>
`;
```

### Geocoding Cache Strategy
```typescript
// Cache key generation
const cacheKey = address.toLowerCase().replace(/\s+/g, '_');

// Cache storage
localStorage.setItem(`geocode_${cacheKey}`, JSON.stringify(result));

// Cache retrieval
const cached = localStorage.getItem(`geocode_${cacheKey}`);
```

## Performance Optimizations

### 1. Caching
- **localStorage**: Persistent caching across sessions
- **Normalized keys**: Consistent cache hits for similar addresses
- **Selective refresh**: Manual cache clearing when needed

### 2. Rate Limiting
- **Sequential processing**: Avoids API rate limits
- **Progress indicators**: User feedback during batch operations
- **Error handling**: Graceful degradation on API failures

### 3. Bundle Optimization
- **Dynamic imports**: Reduces initial bundle size
- **SSR compatibility**: Prevents server-side rendering issues
- **Lazy loading**: Map loads only when modal opens

## API Usage & Limits

### Mapbox Geocoding API
- **Endpoint**: `https://api.mapbox.com/geocoding/v5/mapbox.places/`
- **Rate Limit**: 600 requests per minute
- **Free Tier**: 100,000 requests per month
- **Optimization**: UK-specific with `country=gb` parameter

### Request Format
```
GET https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json
?access_token={token}
&country=gb
&limit=1
```

## Error Handling

### Geocoding Failures
- Individual address failures don't stop batch processing
- Console warnings for debugging
- Graceful degradation (members without coordinates simply don't appear)

### Map Loading Issues
- Loading spinner while Mapbox GL JS loads
- Error messages for missing access tokens
- Fallback UI for unsupported browsers

## Security Considerations

### Access Token
- Public token (starts with `pk.`) is safe for client-side use
- Should be restricted to specific URLs in production
- Regular rotation recommended

### Data Privacy
- No sensitive data sent to Mapbox
- Only addresses used for geocoding
- Results cached locally, not transmitted

## Future Enhancements

### Potential Improvements
1. **Clustering**: Group nearby markers for better performance
2. **Filtering**: Filter by membership type, date ranges, etc.
3. **Heatmaps**: Density visualization for member distribution
4. **Directions**: Route planning between member locations
5. **Offline Support**: Cache map tiles for offline viewing

### Scalability Considerations
- Current implementation handles hundreds of members efficiently
- For thousands of members, consider implementing clustering
- Monitor API usage and implement pagination if needed
