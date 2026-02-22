'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import MembersMap from '@/components/maps/MembersMap';

interface MemberLocation {
  id: string;
  clientName: string;
  dogName?: string;
  email?: string;
  membershipDate?: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface MembersMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeocodingCache {
  [address: string]: {
    lat: number;
    lng: number;
    timestamp: number;
  };
}

const CACHE_KEY = 'mapbox_geocoding_cache';
const CACHE_EXPIRY_DAYS = 30; // Cache addresses for 30 days

export default function MembersMapModal({ isOpen, onClose }: MembersMapModalProps) {
  const { state } = useApp();
  const { clients, memberships } = state;
  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const [cacheStats, setCacheStats] = useState({ cached: 0, fresh: 0 });

  // Load cache from localStorage
  const loadCache = (): GeocodingCache => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return {};

      const cache: GeocodingCache = JSON.parse(cached);
      const now = Date.now();
      const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      // Filter out expired entries
      const validCache: GeocodingCache = {};
      Object.entries(cache).forEach(([address, data]) => {
        if (now - data.timestamp < expiryMs) {
          validCache[address] = data;
        }
      });

      return validCache;
    } catch (error) {
      console.warn('Failed to load geocoding cache:', error);
      return {};
    }
  };

  // Save cache to localStorage
  const saveCache = (cache: GeocodingCache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('Failed to save geocoding cache:', error);
    }
  };

  // Geocode with caching
  const geocodeAddress = async (address: string, cache: GeocodingCache): Promise<{ lat: number; lng: number } | null> => {
    // Normalize address for cache key
    const normalizedAddress = address.trim().toLowerCase();

    // Check cache first
    if (cache[normalizedAddress]) {
      return {
        lat: cache[normalizedAddress].lat,
        lng: cache[normalizedAddress].lng
      };
    }

    // Not in cache - make API call
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.lat && data.lng) {
        // Save to cache
        cache[normalizedAddress] = {
          lat: data.lat,
          lng: data.lng,
          timestamp: Date.now()
        };
        saveCache(cache);

        return { lat: data.lat, lng: data.lng };
      }

      return null;
    } catch (error) {
      console.warn('Geocoding failed for address:', address);
      return null;
    }
  };

  // Get active members with addresses and geocode them
  const loadMemberLocations = async (forceRefresh = false) => {
    if (!clients || !memberships) return;

    setIsLoading(true);
    setGeocodingProgress({ current: 0, total: 0 });
    setCacheStats({ cached: 0, fresh: 0 });

    // Load cache (or clear it if force refresh)
    const cache = forceRefresh ? {} : loadCache();
    let cachedCount = 0;
    let freshCount = 0;

    // Get recent membership payments (within last 2 months)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const recentMemberships = memberships.filter(membership => {
      const membershipDate = new Date(membership.date);
      return membershipDate >= twoMonthsAgo;
    });

    const recentMemberEmails = new Set(recentMemberships.map(m => m.email));

    // Filter active clients with membership AND address
    const activeMembers = clients.filter(client => {
      return client.membership &&
             client.email &&
             recentMemberEmails.has(client.email) &&
             client.address &&
             client.address.trim().length > 0;
    });

    setGeocodingProgress({ current: 0, total: activeMembers.length });

    const locations: MemberLocation[] = [];

    for (let i = 0; i < activeMembers.length; i++) {
      const client = activeMembers[i];
      const address = client.address!;
      const dogName = client.dogName || '';

      // Check if this will be cached or fresh
      const normalizedAddress = address.trim().toLowerCase();
      const isCached = !!cache[normalizedAddress];

      if (isCached) {
        cachedCount++;
      } else {
        freshCount++;
      }

      // Geocode the address (with caching)
      const coords = await geocodeAddress(address, cache);

      if (coords) {
        const membershipDate = recentMemberships.find(m => m.email === client.email)?.date;

        locations.push({
          id: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          dogName,
          email: client.email,
          membershipDate,
          latitude: coords.lat,
          longitude: coords.lng,
          address
        });
      }

      setGeocodingProgress({ current: i + 1, total: activeMembers.length });

      // Only add delay for fresh API calls to avoid rate limiting
      if (!isCached && i < activeMembers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setCacheStats({ cached: cachedCount, fresh: freshCount });
    setMemberLocations(locations);
    setIsLoading(false);
  };

  // Clear cache and reload
  const handleRefreshCache = () => {
    if (confirm('This will clear the geocoding cache and reload all addresses. Continue?')) {
      loadMemberLocations(true);
    }
  };

  // Load member locations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMemberLocations();
    }
  }, [isOpen, clients, memberships]);



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">Members Map</h2>
            {!isLoading && memberLocations.length > 0 && (
              <button
                onClick={handleRefreshCache}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Clear cache and reload all addresses"
              >
                <RefreshCw size={16} />
                Refresh Cache
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading indicator with progress */}
        {isLoading && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800">
                  {geocodingProgress.total > 0
                    ? `Geocoding addresses... ${geocodingProgress.current}/${geocodingProgress.total}`
                    : 'Loading member locations...'}
                </p>
              </div>
              {geocodingProgress.total > 0 && (
                <div className="text-xs text-blue-600">
                  {Math.round((geocodingProgress.current / geocodingProgress.total) * 100)}%
                </div>
              )}
            </div>
            {/* Progress bar */}
            {geocodingProgress.total > 0 && (
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Cache stats */}
        {!isLoading && memberLocations.length > 0 && (cacheStats.cached > 0 || cacheStats.fresh > 0) && (
          <div className="px-6 py-3 bg-green-50 border-b border-green-200">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-800">
                ✓ Loaded {memberLocations.length} member{memberLocations.length !== 1 ? 's' : ''}
              </span>
              {cacheStats.cached > 0 && (
                <span className="text-green-600">
                  📦 {cacheStats.cached} from cache
                </span>
              )}
              {cacheStats.fresh > 0 && (
                <span className="text-blue-600">
                  🌐 {cacheStats.fresh} geocoded
                </span>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1">
          <MembersMap locations={memberLocations} />
        </div>
      </div>
    </div>
  );
}
