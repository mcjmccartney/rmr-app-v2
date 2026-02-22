'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import MembersMap from '@/components/maps/MembersMap';
import ClientModal from '@/components/modals/ClientModal';
import EditClientModal from '@/components/modals/EditClientModal';
import { Client } from '@/types';

interface MemberLocation {
  id: string;
  clientId: string;
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

type MemberFilter = 'all' | 'current' | 'past';

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
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);

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

  // Extract postcode from address (UK postcode at end of address)
  const extractPostcode = (address: string): string => {
    // UK postcode pattern: matches postcodes like "SW1A 1AA", "M1 1AE", "EC1A 1BB"
    const postcodeMatch = address.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})$/i);
    return postcodeMatch ? postcodeMatch[1] : address;
  };

  // Get all members who've ever paid (current + past)
  const loadMemberLocations = async () => {
    if (!clients || !memberships) return;

    setIsLoading(true);

    // Load cache
    const cache = loadCache();

    // Get all unique emails from membership payments
    const allMemberEmails = new Set(memberships.map(m => m.email));

    // Get all clients who have ever paid for membership AND have an address
    const allMembers = clients.filter(client => {
      return client.email &&
             allMemberEmails.has(client.email) &&
             client.address &&
             client.address.trim().length > 0;
    });

    const locations: MemberLocation[] = [];

    for (let i = 0; i < allMembers.length; i++) {
      const client = allMembers[i];
      const address = client.address!;

      // Extract postcode from address
      const postcode = extractPostcode(address);
      const dogName = client.dogName || '';

      // Check if this will be cached
      const normalizedPostcode = postcode.trim().toLowerCase();
      const isCached = !!cache[normalizedPostcode];

      // Geocode the postcode (with caching)
      const coords = await geocodeAddress(postcode, cache);

      if (coords) {
        // Get most recent membership date for this client
        const clientMemberships = memberships.filter(m => m.email === client.email);
        const mostRecentMembership = clientMemberships.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        locations.push({
          id: `${client.id}-${i}`, // Unique ID for map marker
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          dogName,
          email: client.email,
          membershipDate: mostRecentMembership?.date,
          latitude: coords.lat,
          longitude: coords.lng,
          address: postcode
        });
      }

      // Only add delay for fresh API calls to avoid rate limiting
      if (!isCached && i < allMembers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setMemberLocations(locations);
    setIsLoading(false);
  };

  // Filter locations based on current filter
  const filteredLocations = memberLocations.filter(location => {
    if (memberFilter === 'all') return true;

    if (!location.membershipDate) return false;

    const membershipDate = new Date(location.membershipDate);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const isCurrent = membershipDate >= twoMonthsAgo;

    if (memberFilter === 'current') return isCurrent;
    if (memberFilter === 'past') return !isCurrent;

    return true;
  });

  // Handle client click from map
  const handleClientClick = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setShowClientModal(true);
    }
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientModal(false);
    setShowEditClientModal(true);
  };

  const handleCloseEditClientModal = () => {
    setShowEditClientModal(false);
    setSelectedClient(null);
  };

  // Load member locations when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMemberLocations();
    }
  }, [isOpen, clients, memberships]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Members Map</h2>

              {/* Filter buttons */}
              {!isLoading && memberLocations.length > 0 && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setMemberFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      memberFilter === 'all'
                        ? 'bg-amber-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({memberLocations.length})
                  </button>
                  <button
                    onClick={() => setMemberFilter('current')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      memberFilter === 'current'
                        ? 'bg-amber-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Current ({memberLocations.filter(l => {
                      if (!l.membershipDate) return false;
                      const twoMonthsAgo = new Date();
                      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                      return new Date(l.membershipDate) >= twoMonthsAgo;
                    }).length})
                  </button>
                  <button
                    onClick={() => setMemberFilter('past')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      memberFilter === 'past'
                        ? 'bg-amber-800 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Past ({memberLocations.filter(l => {
                      if (!l.membershipDate) return false;
                      const twoMonthsAgo = new Date();
                      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                      return new Date(l.membershipDate) < twoMonthsAgo;
                    }).length})
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            <MembersMap
              locations={filteredLocations}
              onClientClick={handleClientClick}
            />
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <ClientModal
        client={selectedClient}
        isOpen={showClientModal}
        onClose={handleCloseClientModal}
        onEditClient={handleEditClient}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        client={selectedClient}
        isOpen={showEditClientModal}
        onClose={handleCloseEditClientModal}
      />
    </>
  );
}
