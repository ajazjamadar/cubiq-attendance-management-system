'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  radiusMeters?: number;
  isInteractive?: boolean; // If true, clicking on map sets coordinates
  userLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  locationName?: string;
}

export default function MapPicker({
  initialLat = 12.9716,
  initialLng = 77.5946,
  radiusMeters = 100,
  isInteractive = false,
  userLocation,
  onLocationSelect,
  className = 'h-72 w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm',
  locationName = 'Site Location',
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const siteMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });

  useEffect(() => {
    setCurrentCoords({ lat: initialLat, lng: initialLng });
  }, [initialLat, initialLng]);

  useEffect(() => {
    // Dynamically load Leaflet on client side
    if (!mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      const L = (await import('leaflet')).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Fix icon issues
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Clear existing map instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 16);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Site center marker
      const siteIcon = L.divIcon({
        className: 'custom-site-marker',
        html: `
          <div style="background-color: #0f766e; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const marker = L.marker([initialLat, initialLng], { icon: siteIcon }).addTo(map);
      marker.bindPopup(`<b>${locationName}</b><br/>Allowed Radius: ${radiusMeters}m`);
      siteMarkerRef.current = marker;

      // Geofence Circle
      const circle = L.circle([initialLat, initialLng], {
        radius: radiusMeters,
        color: '#0d9488',
        fillColor: '#14b8a6',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '4, 6',
      }).addTo(map);
      radiusCircleRef.current = circle;

      // If user current location provided, show blue dot
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35); border: 2px solid white;"></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const uMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
        uMarker.bindPopup('<b>Your Current Location</b>');
        userMarkerRef.current = uMarker;
      }

      // Interactive click listener to pick new coordinates
      if (isInteractive) {
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          setCurrentCoords({ lat, lng });
          marker.setLatLng([lat, lng]);
          circle.setLatLng([lat, lng]);
          if (onLocationSelect) {
            onLocationSelect(lat, lng);
          }
        });
      }

      // Resize after render
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialLat, initialLng, radiusMeters, isInteractive, locationName]);

  // Update dynamic user marker if position updates
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    import('leaflet').then((L) => {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35); border: 2px solid white;"></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        const uMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(
          mapInstanceRef.current
        );
        uMarker.bindPopup('<b>Your Current Location</b>');
        userMarkerRef.current = uMarker;
      }
    });
  }, [userLocation]);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className={className} />
      {isInteractive && (
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 px-2.5 py-1 rounded shadow pointer-events-none z-[1000] border border-slate-200">
          Click map to set site center coordinates
        </div>
      )}
    </div>
  );
}
