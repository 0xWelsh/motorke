'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { formatDistance } from '@/lib/geolocation';

export default function DealerMap({ dealers, userLocation }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current) return;

    /* @ts-ignore */
    if (typeof google === 'undefined') {
      setError('Google Maps not loaded');
      return;
    }

    try {
      // Default center: Nairobi, Kenya
      const defaultCenter = { lat: -1.2921, lng: 36.8219 };
      
      /* @ts-ignore */
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: userLocation ? 12 : 6,
        center: userLocation
          ? { lat: userLocation.lat, lng: userLocation.lng }
          : defaultCenter,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      /* @ts-ignore */
      const newInfoWindow = new google.maps.InfoWindow();
      infoWindowRef.current = newInfoWindow;

      // Add user location marker if available
      if (userLocation) {
        /* @ts-ignore */
        new google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: newMap,
          title: 'Your Location',
          icon: {
            path: /* @ts-ignore */ google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });
      }

      // Add dealer markers
      dealers.forEach((dealer) => {
        if (!dealer.lat || !dealer.lng) return;

        const marker = /* @ts-ignore */ new google.maps.Marker({
          position: { lat: dealer.lat, lng: dealer.lng },
          map: newMap,
          title: dealer.name,
          icon: {
            path: /* @ts-ignore */ google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#0F172A',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            rotation: 0,
          },
        });

        // Info window content
        const content = document.createElement('div');
        content.className = 'p-3 bg-white rounded-lg shadow-lg max-w-xs';
        content.innerHTML = `
          <div class="space-y-2">
            <h3 class="font-bold text-slate-900 text-sm">${dealer.name}</h3>
            <p class="text-xs text-slate-600">${dealer.location}</p>
            ${
              dealer.distance
                ? `<div class="flex items-center gap-1 text-xs font-semibold text-blue-600">
                     <span>📍</span> ${formatDistance(dealer.distance)}
                   </div>`
                : ''
            }
            ${
              dealer._count?.cars > 0
                ? `<p class="text-xs text-slate-500">${dealer._count.cars} car${dealer._count.cars !== 1 ? 's' : ''}</p>`
                : ''
            }
            <a href="/dealers/${dealer.slug}" class="inline-block mt-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition">View Profile</a>
          </div>
        `;

        marker.addListener('click', () => {
          infoWindowRef.current?.close();
          /* @ts-ignore */
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.open(newMap, marker);
        });

        marker.addListener('mouseover', () => {
          marker.setIcon({
            path: /* @ts-ignore */ google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: 0,
          });
        });

        marker.addListener('mouseout', () => {
          marker.setIcon({
            path: /* @ts-ignore */ google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: '#0F172A',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            rotation: 0,
          });
        });

        markersRef.current.push(marker);
      });

      setMap(newMap);
      setLoading(false);
    } catch (err) {
      console.error('Map error:', err);
      setError('Failed to load map');
      setLoading(false);
    }
  }, [dealers, userLocation]);

  if (loading) {
    return (
      <div className="w-full h-full rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full rounded-lg flex items-center justify-center bg-red-50 border border-red-200">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 shadow-sm">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
