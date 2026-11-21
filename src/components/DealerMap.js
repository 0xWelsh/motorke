'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import Leaflet to avoid SSR issues
const MapComponent = dynamic(() => import('./DealerMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl flex items-center justify-center bg-surface border border-[var(--border)]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
        <p className="text-sm font-medium text-muted">Loading map...</p>
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
      <div className="w-full h-full rounded-2xl flex items-center justify-center bg-surface border border-[var(--border)]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
          <p className="text-sm font-medium text-muted">Loading map...</p>
        </div>
      </div>
    );
  }

  return <MapComponent dealers={dealers} userLocation={userLocation} />;
}
