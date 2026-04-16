'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance } from '@/lib/geolocation';

// Fix Leaflet marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function DealerMapLeaflet({ dealers, userLocation }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Initialize map
    const center = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [-1.2921, 36.8219]; // Nairobi default

    const leafletMap = L.map(mapRef.current).setView(center, userLocation ? 12 : 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(leafletMap);

    // Track all markers for bounds
    const allMarkers = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
        radius: 8,
        fillColor: '#3B82F6',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
      })
        .bindPopup(
          L.popup({ autoClose: false }).setContent(
            '<div class="text-center"><p class="font-bold text-slate-900">📍 Your Location</p></div>'
          )
        )
        .addTo(leafletMap);

      allMarkers.push(userMarker);
    }

    // Add dealer markers
    dealers.forEach((dealer) => {
      if (!dealer.lat || !dealer.lng) return;

      const customIcon = L.divIcon({
        html: `
          <div class="flex flex-col items-center">
            <div class="bg-slate-900 text-slate-900 rounded-none font-bold text-xs shadow-lg border-2 border-white flex items-center justify-center w-9 h-9" style="line-height: 1;">
              ${dealer.name?.[0]?.toUpperCase() || '?'}
            </div>
            ${
              dealer.distance
                ? `<div class="text-slate-900 text-[10px] font-bold bg-#ff5a2f px-1.5 py-0.5 rounded-none mt-1 shadow-md whitespace-nowrap">
                     ${formatDistance(dealer.distance)}
                   </div>`
                : ''
            }
          </div>
        `,
        iconSize: [50, dealer.distance ? 60 : 45],
        iconAnchor: [25, dealer.distance ? 50 : 35],
        popupAnchor: [0, dealer.distance ? -35 : -20],
        className: 'leaflet-custom-marker',
      });

      const popupContent = `
        <div class="space-y-2 min-w-[220px]">
          <h3 class="font-bold text-slate-900 text-sm">${dealer.name}</h3>
          <p class="text-xs text-slate-600">${dealer.location}</p>
          ${
            dealer.distance
              ? `<div class="flex items-center gap-1.5 text-xs font-semibold text-#ff5a2f bg-blue-50 px-2 py-1 rounded">
                   <span>📍</span> ${formatDistance(dealer.distance)}
                 </div>`
              : ''
          }
          ${
            dealer._count?.cars > 0
              ? `<p class="text-xs text-slate-600"><strong>${dealer._count.cars}</strong> car${dealer._count.cars !== 1 ? 's' : ''} available</p>`
              : ''
          }
          ${dealer.verified ? '<p class="text-xs text-#ff5a2f font-semibold">✓ Verified Dealer</p>' : ''}
          <a href="/dealers/${dealer.slug}" class="inline-block mt-2 text-xs font-bold text-slate-900 bg-#ff5a2f hover:bg-blue-700 px-3 py-1.5 rounded transition">
            View Profile
          </a>
        </div>
      `;

      const marker = L.marker([dealer.lat, dealer.lng], {
        icon: customIcon,
        title: dealer.name,
      })
        .bindPopup(popupContent, {
          maxWidth: 260,
          maxHeight: 350,
          className: 'dealer-popup',
        })
        .on('mouseover', function () {
          this.openPopup();
        })
        .on('mouseout', function () {
          this.closePopup();
        })
        .addTo(leafletMap);

      allMarkers.push(marker);
    });

    // Fit bounds to show all markers
    if (allMarkers.length > 0) {
      const group = new L.featureGroup(allMarkers);
      leafletMap.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14 });
    }

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
    };
  }, [dealers, userLocation]);

  return <div ref={mapRef} className="w-full h-full" />;
}
