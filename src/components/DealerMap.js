'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import Leaflet to avoid SSR issues
const MapComponent = dynamic(() => import('./DealerMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl flex items-center justify-center bg-[#fbfcfe] bg-[#111111] border border-[#ddd4c8] border-slate-800">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-[#ff5a2f] animate-spin" />
        <p className="text-sm font-medium text-slate-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function DealerMap({ dealers, userLocation }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full rounded-2xl flex items-center justify-center bg-[#fbfcfe] bg-[#111111] border border-[#ddd4c8] border-slate-800">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-[#ff5a2f] animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <MapComponent dealers={dealers} userLocation={userLocation} />;
}
