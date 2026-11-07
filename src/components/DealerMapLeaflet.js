'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance } from '@/lib/geolocation';
import { createDealerDivIcon, escapeMapHtml } from '@/lib/map-pin';

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

    // Use OSM tiles for broader network compatibility.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
      const lat = Number(dealer.lat);
      const lng = Number(dealer.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const customIcon = createDealerDivIcon(L, {
        label: dealer.name,
        verified: dealer.verified,
        badge: dealer.distance ? formatDistance(dealer.distance) : undefined,
      });

      const popupContent = `
        <div class="space-y-2 min-w-[220px]">
          <h3 class="font-bold text-slate-900 text-sm">${escapeMapHtml(dealer.name)}</h3>
          <p class="text-xs text-slate-500">${escapeMapHtml(dealer.location || "")}</p>
          ${
            dealer.distance
              ? `<div class="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] bg-accent-wash px-2 py-1 rounded">
                   <span>📍</span> ${formatDistance(dealer.distance)}
                 </div>`
              : ''
          }
          ${
            dealer._count?.cars > 0
              ? `<p class="text-xs text-slate-500"><strong>${dealer._count.cars}</strong> car${dealer._count.cars !== 1 ? 's' : ''} available</p>`
              : ''
          }
          ${dealer.verified ? '<p class="text-xs text-[var(--accent)] font-semibold">✓ Verified Dealer</p>' : ''}
          <a href="/dealers/${dealer.slug}" class="inline-block mt-2 text-xs font-bold text-white bg-[var(--accent)] hover:brightness-110 px-3 py-1.5 rounded transition">
            View Profile
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng], {
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

    // FIX: Delay invalidateSize to ensure container is fully rendered
    setTimeout(() => {
      leafletMap.invalidateSize();
    }, 100);

    return () => {
      leafletMap.remove();
    };
  }, [dealers, userLocation]);

  return <div ref={mapRef} className="w-full h-full" />;
}
