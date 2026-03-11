'use client';

import { useEffect, useRef } from 'react';

// Mapbox GL JS types
interface MapboxGL {
  Map: any;
  Marker: any;
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
  isCurrent?: boolean;
  latitude: number;
  longitude: number;
  address: string;
}

interface MembersMapProps {
  locations: MemberLocation[];
  onClientClick: (clientId: string) => void;
  fitBoundsKey?: number;
  mapboxgl: MapboxGL | null;
  mapRef: React.MutableRefObject<any>;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
}

export default function MembersMap({ locations, onClientClick, fitBoundsKey, mapboxgl, mapRef, mapContainerRef }: MembersMapProps) {
  const markersRef = useRef<any[]>([]);
  const prevFitBoundsKey = useRef<number | undefined>(undefined);

  // Add markers when locations change
  useEffect(() => {
    if (!mapRef.current || !mapboxgl || !locations.length) return;

    const addMarkers = () => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      const bounds = new mapboxgl.LngLatBounds();

      locations.forEach(location => {
        const isCurrent = location.isCurrent !== false; // default to current styling if not specified
        const pinColor = isCurrent ? '#4e6749' : '#9ca3af';

        const markerElement = document.createElement('div');
        markerElement.className = 'mapbox-marker';
        markerElement.style.cursor = 'pointer';
        markerElement.innerHTML = `
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25)); transition: transform 0.1s;">
            <path d="M18 0C8.059 0 0 8.059 0 18C0 31.5 18 46 18 46C18 46 36 31.5 36 18C36 8.059 27.941 0 18 0Z" fill="${pinColor}"/>
            <circle cx="18" cy="18" r="7" fill="white"/>
          </svg>
        `;

        markerElement.addEventListener('mouseenter', () => {
          const svg = markerElement.querySelector('svg') as SVGElement;
          if (svg) svg.style.transform = 'scale(1.15)';
        });
        markerElement.addEventListener('mouseleave', () => {
          const svg = markerElement.querySelector('svg') as SVGElement;
          if (svg) svg.style.transform = 'scale(1)';
        });
        markerElement.addEventListener('click', () => {
          onClientClick(location.clientId);
        });

        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([location.longitude, location.latitude])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
        bounds.extend([location.longitude, location.latitude]);
      });

      // Re-fit bounds when fitBoundsKey changes or on first load
      const shouldFit = fitBoundsKey !== prevFitBoundsKey.current;
      if (shouldFit) {
        mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 12, duration: 800 });
        prevFitBoundsKey.current = fitBoundsKey;
      }
    };

    if (mapRef.current.isStyleLoaded()) {
      addMarkers();
    } else {
      mapRef.current.once('load', addMarkers);
    }
  }, [locations, mapboxgl, onClientClick, fitBoundsKey, mapRef]);

  // Clear markers when locations become empty
  useEffect(() => {
    if (!locations.length) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    }
  }, [locations]);

  return (
    <div ref={mapContainerRef} className="w-full h-full" />
  );
}
