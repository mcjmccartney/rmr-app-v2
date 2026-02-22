'use client';

import { useEffect, useRef, useState } from 'react';

// Mapbox GL JS types
interface MapboxGL {
  Map: any;
  Marker: any;
  Popup: any;
  LngLatBounds: any;
  NavigationControl: any;
}

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

interface MembersMapProps {
  locations: MemberLocation[];
  onClientClick: (clientId: string) => void;
}

export default function MembersMap({ locations, onClientClick }: MembersMapProps) {
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
      // Create Google Maps-style pin marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'mapbox-marker';
      markerElement.innerHTML = `
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M16 0C7.163 0 0 7.163 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.163 24.837 0 16 0Z" fill="#5a6f54"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      `;

      // Add click handler to open client modal
      markerElement.addEventListener('click', () => {
        onClientClick(location.clientId);
      });

      // Create marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([location.longitude, location.latitude])
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
  }, [locations, mapboxgl, onClientClick]);

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
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}
