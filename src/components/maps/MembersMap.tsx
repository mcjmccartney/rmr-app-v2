'use client';

import { useEffect, useRef, useState } from 'react';
import { GeocodedLocation } from '@/hooks/useGeocoding';

// Mapbox GL JS types
interface MapboxGL {
  Map: any;
  Marker: any;
  Popup: any;
  LngLatBounds: any;
  NavigationControl: any;
}

interface MembersMapProps {
  locations: GeocodedLocation[];
  onRefresh: () => void;
}

export default function MembersMap({ locations, onRefresh }: MembersMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapboxgl, setMapboxgl] = useState<MapboxGL | null>(null);
  const markersRef = useRef<any[]>([]);

  // Dynamically import Mapbox GL JS
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        const mapboxModule = await import('mapbox-gl');
        const mapboxgl = mapboxModule.default;
        
        // Set access token
        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
        
        setMapboxgl(mapboxgl);
      } catch (error) {
        console.error('Failed to load Mapbox GL JS:', error);
      }
    };

    loadMapbox();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapboxgl || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-2.5, 54.5], // Center on UK
      zoom: 5.5
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxgl]);

  // Add markers when locations change
  useEffect(() => {
    if (!map.current || !mapboxgl || !locations.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(location => {
      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'mapbox-marker';
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
          font-size: 14px;
          cursor: pointer;
          transform: scale(1);
          transition: transform 0.2s ease;
        ">👤</div>
      `;

      // Add hover effect
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.1)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Create popup content
      const popupContent = `
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #92400e;">
            ${location.clientName}
          </h3>
          ${location.dogName ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Dog:</strong> ${location.dogName}</p>` : ''}
          ${location.email ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${location.email}</p>` : ''}
          ${location.membershipDate ? `<p style="margin: 4px 0; font-size: 14px;"><strong>Member since:</strong> ${new Date(location.membershipDate).toLocaleDateString()}</p>` : ''}
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
            <strong>Address:</strong> ${location.address}
          </p>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([location.longitude, location.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);

      // Extend bounds
      bounds.extend([location.longitude, location.latitude]);
    });

    // Fit map to show all markers
    if (locations.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12
      });
    }
  }, [locations, mapboxgl]);

  if (!mapboxgl) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Refresh button */}
      <button
        onClick={onRefresh}
        className="absolute top-4 left-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors"
      >
        🔄 Refresh Cache
      </button>

      {/* Member count badge */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 border">
          <div className="flex items-center gap-2">
            <span className="text-amber-800">👤</span>
            <span className="text-sm font-medium text-gray-900">
              {locations.length} Active Member{locations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}
