'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  isCurrent?: boolean;
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
const CACHE_EXPIRY_DAYS = 30;

export default function MembersMapModal({ isOpen, onClose }: MembersMapModalProps) {
  const { state } = useApp();
  const { clients, memberships } = state;

  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');
  const [fitBoundsKey, setFitBoundsKey] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);

  // Mapbox refs — initialised once, persist across filter changes and re-opens
  const [mapboxgl, setMapboxgl] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Persist geocoded locations across re-opens (avoid re-geocoding already-known members)
  const cachedLocations = useRef<MemberLocation[]>([]);
  const cachedMemberIds = useRef<Set<string>>(new Set());

  // Load Mapbox once
  useEffect(() => {
    const load = async () => {
      try {
        const mod = await import('mapbox-gl');
        const mgl = mod.default;
        mgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        setMapboxgl(mgl);
      } catch (e) {
        console.error('Failed to load Mapbox GL JS:', e);
      }
    };
    load();
  }, []);

  // Initialise map once mapboxgl is ready and container is in the DOM
  useEffect(() => {
    if (!mapboxgl || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-2.5, 54.5],
      zoom: 5.5,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.once('load', () => mapRef.current?.resize());

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // isOpen is included so the map re-initialises when the modal opens (mapContainerRef is null while closed)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapboxgl, isOpen]);

  // Resize map whenever modal opens (fixes sizing if container was hidden)
  useEffect(() => {
    if (isOpen && mapRef.current) {
      setTimeout(() => mapRef.current?.resize(), 50);
    }
  }, [isOpen]);

  // --- Geocoding helpers ---

  const loadCache = (): GeocodingCache => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return {};
      const cache: GeocodingCache = JSON.parse(cached);
      const now = Date.now();
      const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const valid: GeocodingCache = {};
      Object.entries(cache).forEach(([addr, data]) => {
        if (now - data.timestamp < expiryMs) valid[addr] = data;
      });
      return valid;
    } catch {
      return {};
    }
  };

  const saveCache = (cache: GeocodingCache) => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
  };

  const geocodeAddress = async (address: string, cache: GeocodingCache): Promise<{ lat: number; lng: number } | null> => {
    const key = address.trim().toLowerCase();
    if (cache[key]) return { lat: cache[key].lat, lng: cache[key].lng };
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.lat && data.lng) {
        cache[key] = { lat: data.lat, lng: data.lng, timestamp: Date.now() };
        saveCache(cache);
        return { lat: data.lat, lng: data.lng };
      }
      return null;
    } catch {
      return null;
    }
  };

  const extractPostcode = (address: string): string => {
    const ukMatch = address.match(/([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})$/i);
    if (ukMatch) return ukMatch[1];
    const usMatch = address.match(/(\d{5}(-\d{4})?)$/);
    if (usMatch) return usMatch[1];
    return address;
  };

  const isMemberCurrent = (membershipDate: string | undefined): boolean => {
    if (!membershipDate) return false;
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    return new Date(membershipDate) >= twoMonthsAgo;
  };

  // --- Load / update member locations ---

  const loadMemberLocations = useCallback(async () => {
    if (!clients || !memberships) return;

    const allMemberEmails = new Set(memberships.map(m => m.email?.toLowerCase()));

    const allMembers = clients.filter(client =>
      client.email &&
      allMemberEmails.has(client.email.toLowerCase()) &&
      client.address &&
      client.address.trim().length > 0
    );

    // Show already-geocoded locations immediately (no spinner for cached members)
    if (cachedLocations.current.length > 0) {
      setMemberLocations(cachedLocations.current);
    }

    // Only geocode members not already in cache
    const newMembers = allMembers.filter(c => !cachedMemberIds.current.has(c.id));

    if (newMembers.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const cache = loadCache();
    const usedCoords = new Map<string, number>();

    // Seed usedCoords from already-cached locations to avoid jitter overlap
    cachedLocations.current.forEach(loc => {
      const key = `${Math.round(loc.latitude * 100)},${Math.round(loc.longitude * 100)}`;
      usedCoords.set(key, (usedCoords.get(key) || 0) + 1);
    });

    const newLocations: MemberLocation[] = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < newMembers.length; i += BATCH_SIZE) {
      const batch = newMembers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(client => geocodeAddress(extractPostcode(client.address!), cache))
      );

      results.forEach((result, idx) => {
        const client = batch[idx];
        if (result.status !== 'fulfilled' || !result.value) return;

        let { lat, lng } = result.value;

        const coordKey = `${Math.round(lat * 100)},${Math.round(lng * 100)}`;
        const existing = usedCoords.get(coordKey) || 0;
        if (existing > 0) {
          const angle = (existing * 137.5) * (Math.PI / 180);
          lat += Math.cos(angle) * 0.0015;
          lng += Math.sin(angle) * 0.0015;
        }
        usedCoords.set(coordKey, existing + 1);

        const clientMemberships = memberships.filter(
          m => m.email?.toLowerCase() === client.email?.toLowerCase()
        );
        const mostRecent = clientMemberships.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];

        newLocations.push({
          id: client.id,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          dogName: client.dogName || '',
          email: client.email,
          membershipDate: mostRecent?.date,
          isCurrent: isMemberCurrent(mostRecent?.date),
          latitude: lat,
          longitude: lng,
          address: extractPostcode(client.address!),
        });

        cachedMemberIds.current.add(client.id);
      });
    }

    cachedLocations.current = [...cachedLocations.current, ...newLocations];
    setMemberLocations(cachedLocations.current);
    setIsLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, memberships]);

  useEffect(() => {
    if (isOpen) {
      loadMemberLocations();
      setFitBoundsKey(k => k + 1);
    }
  }, [isOpen, loadMemberLocations]);

  // --- Filtering ---

  const filteredLocations = memberLocations.filter(loc => {
    if (memberFilter === 'all') return true;
    if (memberFilter === 'current') return loc.isCurrent === true;
    if (memberFilter === 'past') return loc.isCurrent === false;
    return true;
  });

  const currentCount = memberLocations.filter(l => l.isCurrent === true).length;
  const pastCount = memberLocations.filter(l => l.isCurrent === false).length;

  const handleFilterChange = (f: MemberFilter) => {
    setMemberFilter(f);
    setFitBoundsKey(k => k + 1);
  };

  // --- Client modal ---

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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50">
        {/* Full-screen map */}
        <MembersMap
          locations={filteredLocations}
          onClientClick={handleClientClick}
          fitBoundsKey={fitBoundsKey}
          mapboxgl={mapboxgl}
          mapRef={mapRef}
          mapContainerRef={mapContainerRef}
        />

        {/* Floating top bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          {/* Left: title + filters */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-3 bg-white/85 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg">
              <span className="text-sm font-semibold text-gray-900">Members Map</span>

              {!isLoading && memberLocations.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleFilterChange('all')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      memberFilter === 'all'
                        ? 'bg-amber-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All ({memberLocations.length})
                  </button>
                  <button
                    onClick={() => handleFilterChange('current')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      memberFilter === 'current'
                        ? 'bg-amber-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Current ({currentCount})
                  </button>
                  <button
                    onClick={() => handleFilterChange('past')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      memberFilter === 'past'
                        ? 'bg-amber-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Past ({pastCount})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: close button */}
          <div className="pointer-events-auto">
            <button
              onClick={onClose}
              className="bg-white/85 backdrop-blur-sm hover:bg-white rounded-xl p-2.5 shadow-lg transition-colors"
            >
              <X size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && memberLocations.length === 0 && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-800 border-t-transparent" />
              <span className="text-sm text-gray-700 font-medium">Loading members...</span>
            </div>
          </div>
        )}

        {/* Background loading indicator (new members geocoding, existing shown) */}
        {isLoading && memberLocations.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-white/85 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-800 border-t-transparent" />
              <span className="text-xs text-gray-600">Updating locations…</span>
            </div>
          </div>
        )}
      </div>

      <ClientModal
        client={selectedClient}
        isOpen={showClientModal}
        onClose={handleCloseClientModal}
        onEditClient={handleEditClient}
      />

      <EditClientModal
        client={selectedClient}
        isOpen={showEditClientModal}
        onClose={handleCloseEditClientModal}
      />
    </>
  );
}
