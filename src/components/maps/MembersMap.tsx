'use client';

import { useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import { GeocodedLocation } from '@/hooks/useGeocoding';

interface MembersMapProps {
  locations: GeocodedLocation[];
  isLoading?: boolean;
}

export default function MembersMap({ locations, isLoading }: MembersMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Dynamic import of Leaflet to avoid SSR issues
    const initializeMap = async () => {
      if (typeof window === 'undefined' || !mapRef.current) return;

      const L = await import('leaflet');
      
      // Fix for default markers in Leaflet with webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Initialize map if not already done
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([54.5, -2.0], 6);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current || typeof window === 'undefined') return;

      const L = await import('leaflet');

      // Clear existing markers
      markersRef.current.forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });
      markersRef.current = [];

      if (locations.length === 0) return;

      // Create custom icon
      const customIcon = L.divIcon({
        html: `
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
            font-size: 14px;
          ">
            👤
          </div>
        `,
        className: 'custom-member-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      // Add markers for each location
      locations.forEach((location) => {
        const marker = L.marker([location.latitude, location.longitude], {
          icon: customIcon
        }).addTo(mapInstanceRef.current);

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px; font-family: system-ui, -apple-system, sans-serif;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">
              ${location.clientName}
            </h3>
            ${location.dogName ? `
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 14px; color: #6b7280;">
                <span>🐕</span>
                <span>Dog: ${location.dogName}</span>
              </div>
            ` : ''}
            ${location.email ? `
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 14px; color: #6b7280;">
                <span>✉️</span>
                <span style="word-break: break-all;">${location.email}</span>
              </div>
            ` : ''}
            ${location.membershipDate ? `
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; font-size: 14px; color: #6b7280;">
                <span>📅</span>
                <span>Member since: ${new Date(location.membershipDate).toLocaleDateString('en-GB')}</span>
              </div>
            ` : ''}
            <div style="font-size: 12px; color: #9ca3af; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              ${location.address}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      });

      // Auto-fit bounds to show all markers
      if (locations.length > 0) {
        const group = new (L as any).featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    };

    updateMarkers();
  }, [locations]);

  if (isLoading) {
    return (
      <div className="relative w-full h-96 rounded-lg overflow-hidden bg-gray-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-800 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading member locations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Member Count Badge */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 border">
          <div className="flex items-center gap-2">
            <User size={16} className="text-amber-800" />
            <span className="text-sm font-medium text-gray-900">
              {locations.length} Active Member{locations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Leaflet CSS */}
      <style jsx global>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }

        .leaflet-popup-tip {
          background: white;
        }

        .leaflet-control-zoom {
          border-radius: 6px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .leaflet-control-zoom a {
          border-radius: 0;
        }

        .leaflet-control-zoom a:first-child {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
        }

        .leaflet-control-zoom a:last-child {
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        .custom-member-marker {
          background: transparent !important;
          border: none !important;
        }

        .leaflet-marker-icon:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
}
