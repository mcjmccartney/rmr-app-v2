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

interface MapboxGeocodingResponse {
  features: Array<{
    center: [number, number];
    place_name: string;
  }>;
}

export const useGeocoding = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (address: string): Promise<{ lat: number; lng: number } | null> => {
    if (!address) {
      return null;
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!mapboxToken) {
      console.error('Mapbox access token not found');
      return null;
    }

    try {
      // Check cache first
      const cacheKey = address.toLowerCase().replace(/\s+/g, '_');
      const cached = localStorage.getItem(`geocode_${cacheKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { lat: parsed.lat, lng: parsed.lng };
      }

      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=gb&limit=1`
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data: MapboxGeocodingResponse = await response.json();

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const result = { lat, lng };

        // Cache the result
        localStorage.setItem(`geocode_${cacheKey}`, JSON.stringify(result));

        return result;
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }, []);

  const batchGeocode = useCallback(async (
    addresses: Array<{
      address: string;
      id: string;
      clientName: string;
      dogName?: string;
      email?: string;
      membershipDate?: string;
    }>
  ): Promise<GeocodedLocation[]> => {
    setIsGeocoding(true);
    setGeocodingProgress(0);
    setGeocodingError(null);

    const results: GeocodedLocation[] = [];

    try {
      for (let i = 0; i < addresses.length; i++) {
        const addressData = addresses[i];
        setGeocodingProgress(Math.round((i / addresses.length) * 100));

        try {
          const coords = await geocodeAddress(addressData.address);
          if (coords) {
            results.push({
              id: addressData.id,
              latitude: coords.lat,
              longitude: coords.lng,
              address: addressData.address,
              clientName: addressData.clientName,
              dogName: addressData.dogName,
              email: addressData.email,
              membershipDate: addressData.membershipDate
            });
          }
        } catch (e) {
          // Continue with next address if one fails
          console.warn(`Failed to geocode address for ${addressData.clientName}:`, addressData.address);
        }
      }

      setGeocodingProgress(100);
      return results;
    } catch (error) {
      setGeocodingError(error instanceof Error ? error.message : 'Geocoding failed');
      return results;
    } finally {
      setIsGeocoding(false);
    }
  }, [geocodeAddress]);

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
    batchGeocode,
    clearGeocodingCache,
    isGeocoding,
    geocodingProgress,
    geocodingError
  };
};
