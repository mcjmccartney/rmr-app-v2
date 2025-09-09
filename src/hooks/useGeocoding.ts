import { useState, useCallback } from 'react';

export interface GeocodedLocation {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  clientName: string;
  dogName?: string;
  email?: string;
  membershipDate?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
}

export const useGeocoding = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address) {
      return null;
    }

    try {
      // Use Nominatim (OpenStreetMap's geocoding service) - completely free
      const encodedAddress = encodeURIComponent(address.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=gb&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'RaisingMyRescue/1.0 (contact@raisingmyrescue.co.uk)' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data: NominatimResponse[] = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return { 
          lat: parseFloat(result.lat), 
          lng: parseFloat(result.lon) 
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error for address:', address, error);
      return null;
    }
  }, []);

  const geocodeAddressWithCache = useCallback(async (address: string, cacheKey: string): Promise<{ lat: number; lng: number } | null> => {
    // Check localStorage cache first
    const cacheData = localStorage.getItem(`geocode_${cacheKey}`);
    if (cacheData) {
      try {
        const parsed = JSON.parse(cacheData);
        if (parsed.lat && parsed.lng) {
          return parsed;
        }
      } catch (e) {
        // Invalid cache data, continue with geocoding
      }
    }

    // Geocode the address
    const result = await geocodeAddress(address);
    
    // Cache the result if successful
    if (result) {
      localStorage.setItem(`geocode_${cacheKey}`, JSON.stringify(result));
    }

    return result;
  }, [geocodeAddress]);

  const batchGeocode = useCallback(async (
    addresses: Array<{ address: string; id: string; clientName: string; dogName?: string; email?: string; membershipDate?: string }>
  ): Promise<GeocodedLocation[]> => {
    setIsGeocoding(true);
    setGeocodingProgress(0);
    setGeocodingError(null);

    const results: GeocodedLocation[] = [];
    const total = addresses.length;

    for (let i = 0; i < addresses.length; i++) {
      const item = addresses[i];
      
      try {
        const coords = await geocodeAddressWithCache(item.address, item.id);
        
        if (coords) {
          results.push({
            id: item.id,
            latitude: coords.lat,
            longitude: coords.lng,
            address: item.address,
            clientName: item.clientName,
            dogName: item.dogName,
            email: item.email,
            membershipDate: item.membershipDate
          });
        }

        // Update progress
        setGeocodingProgress(Math.round(((i + 1) / total) * 100));

        // Rate limiting: wait 1 second between requests to be respectful to Nominatim
        // Nominatim usage policy: max 1 request per second
        if (i < addresses.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to geocode address for ${item.clientName}:`, error);
      }
    }

    setIsGeocoding(false);
    return results;
  }, [geocodeAddressWithCache]);

  const clearGeocodingCache = useCallback(() => {
    // Clear all geocoding cache entries
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('geocode_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);

  return {
    geocodeAddress,
    geocodeAddressWithCache,
    batchGeocode,
    clearGeocodingCache,
    isGeocoding,
    geocodingProgress,
    geocodingError
  };
};
