'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useGeocoding, GeocodedLocation } from '@/hooks/useGeocoding';
import MembersMap from '@/components/maps/MembersMap';

interface MembersMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MembersMapModal({ isOpen, onClose }: MembersMapModalProps) {
  const { clients, memberships, behaviourQuestionnaires, behaviouralBriefs } = useAppContext();
  const { batchGeocode, isGeocoding, geocodingProgress, clearGeocodingCache } = useGeocoding();
  const [locations, setLocations] = useState<GeocodedLocation[]>([]);
  const [stats, setStats] = useState({
    totalActiveMembers: 0,
    membersWithAddresses: 0,
    mappedMembers: 0
  });

  // Get active members with addresses
  const getActiveMembersWithAddresses = () => {
    if (!clients || !memberships) return [];

    // Get recent membership payments (within last 2 months)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const recentMemberships = memberships.filter(membership => {
      const membershipDate = new Date(membership.date);
      return membershipDate >= twoMonthsAgo;
    });

    const recentMemberEmails = new Set(recentMemberships.map(m => m.email));

    // Filter active clients with membership and addresses
    const activeMembers = clients.filter(client => {
      return client.membership && recentMemberEmails.has(client.email);
    });

    // Extract addresses with priority system
    const membersWithAddresses = activeMembers.map(client => {
      let address = '';
      let dogName = '';

      // Priority 1: Behaviour Questionnaire (most complete address)
      const questionnaire = behaviourQuestionnaires?.find(q => q.email === client.email);
      if (questionnaire) {
        const addressParts = [
          questionnaire.address1,
          questionnaire.address2,
          questionnaire.city,
          questionnaire.state_province,
          questionnaire.zip_postal_code,
          questionnaire.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          address = addressParts.join(', ');
          dogName = questionnaire.dog_name || '';
        }
      }

      // Priority 2: Client address field
      if (!address && client.address) {
        address = client.address;
      }

      // Priority 3: Behavioural Brief postcode
      if (!address) {
        const brief = behaviouralBriefs?.find(b => b.email === client.email);
        if (brief?.postcode) {
          address = brief.postcode;
        }
      }

      return {
        ...client,
        address,
        dogName
      };
    }).filter(member => member.address); // Only include members with addresses

    return membersWithAddresses;
  };

  // Initialize geocoding when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const initializeMap = async () => {
      const membersWithAddresses = getActiveMembersWithAddresses();
      
      setStats({
        totalActiveMembers: clients?.filter(c => c.membership)?.length || 0,
        membersWithAddresses: membersWithAddresses.length,
        mappedMembers: 0
      });

      if (membersWithAddresses.length === 0) {
        setLocations([]);
        return;
      }

      // Prepare addresses for geocoding
      const addressesToGeocode = membersWithAddresses.map(member => ({
        id: member.id,
        address: member.address,
        clientName: `${member.first_name} ${member.last_name}`,
        dogName: member.dogName,
        email: member.email,
        membershipDate: member.created_at
      }));

      // Batch geocode all addresses
      const geocodedLocations = await batchGeocode(addressesToGeocode);
      setLocations(geocodedLocations);
      
      setStats(prev => ({
        ...prev,
        mappedMembers: geocodedLocations.length
      }));
    };

    initializeMap();
  }, [isOpen, clients, memberships, behaviourQuestionnaires, behaviouralBriefs, batchGeocode]);

  const handleRefreshCache = async () => {
    clearGeocodingCache();
    // Re-trigger the geocoding process
    const membersWithAddresses = getActiveMembersWithAddresses();
    if (membersWithAddresses.length > 0) {
      const addressesToGeocode = membersWithAddresses.map(member => ({
        id: member.id,
        address: member.address,
        clientName: `${member.first_name} ${member.last_name}`,
        dogName: member.dogName,
        email: member.email,
        membershipDate: member.created_at
      }));

      const geocodedLocations = await batchGeocode(addressesToGeocode);
      setLocations(geocodedLocations);
      
      setStats(prev => ({
        ...prev,
        mappedMembers: geocodedLocations.length
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-amber-800" />
            <h2 className="text-xl font-semibold text-gray-900">Active Members Map</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Statistics */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Active Members</p>
                <p className="text-lg font-semibold text-gray-900">{stats.totalActiveMembers}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Members with Addresses</p>
                <p className="text-lg font-semibold text-gray-900">{stats.membersWithAddresses}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-amber-800 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">📍</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Successfully Mapped</p>
                <p className="text-lg font-semibold text-gray-900">{stats.mappedMembers}</p>
              </div>
            </div>
          </div>

          {/* Warning for missing addresses */}
          {stats.totalActiveMembers > stats.membersWithAddresses && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-yellow-800">
                  <strong>{stats.totalActiveMembers - stats.membersWithAddresses}</strong> active members 
                  don't have address information and won't appear on the map.
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Addresses are sourced from behaviour questionnaires, client profiles, and behavioural briefs.
                </p>
              </div>
            </div>
          )}

          {/* Geocoding progress */}
          {isGeocoding && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm text-blue-800">Geocoding member addresses...</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${geocodingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-blue-700 mt-1">{geocodingProgress}% complete</p>
            </div>
          )}

          {/* Refresh cache button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleRefreshCache}
              disabled={isGeocoding}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isGeocoding ? 'animate-spin' : ''} />
              Refresh Locations
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 p-6">
          <MembersMap locations={locations} isLoading={isGeocoding} />
        </div>
      </div>
    </div>
  );
}
