'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import DealerMap from './DealerMap';
import { calculateDistance } from '@/lib/geolocation';

export default function DealersMapView({ dealers }) {
  const [userLocation, setUserLocation] = useState(null);
  const [dealersWithDistance, setDealersWithDistance] = useState(dealers);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserLocation() {
      try {
        // First, try to get saved location from profile
        const response = await fetch('/api/account/location', {
          method: 'GET',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.lat && data.lng) {
            setUserLocation(data);

            // Calculate distances for all dealers
            const withDistance = dealers.map((dealer) => ({
              ...dealer,
              distance: dealer.lat && dealer.lng
                ? calculateDistance(data.lat, data.lng, dealer.lat, dealer.lng)
                : null,
            }));

            setDealersWithDistance(withDistance);
          }
        }
      } catch (err) {
        console.error('Failed to load user location:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserLocation();
  }, [dealers]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0f0f0f]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-[#ff5a2f] animate-spin" />
          <p className="text-sm font-medium text-zinc-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <DealerMap
      dealers={dealersWithDistance}
      userLocation={userLocation}
    />
  );
}
