'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

export default function MembersMapModal({ isOpen, onClose }: MembersMapModalProps) {
  const { state } = useApp();
  const { clients, memberships } = state;
  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simple geocoding function using our API route
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
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
        return { lat: data.lat, lng: data.lng };
      }

      return null;
    } catch (error) {
      console.warn('Geocoding failed for address:', address);
      return null;
    }
  };

  // Get active members with addresses and geocode them
  const loadMemberLocations = async () => {
    if (!clients || !memberships) return;

    setIsLoading(true);

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
             client.address.trim().length > 0; // Ensure address exists and isn't empty
    });

    const locations: MemberLocation[] = [];

    for (const client of activeMembers) {
      // Use client address directly - no complex priority logic needed
      const address = client.address!; // We know it exists from the filter
      const dogName = client.dogName || ''; // Get dog name from client record

      // Geocode the address
      const coords = await geocodeAddress(address);
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

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setMemberLocations(locations);
    setIsLoading(false);
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
          <h2 className="text-xl font-semibold text-gray-900">Members Map</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-800">Loading member locations...</p>
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
