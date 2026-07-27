'use client';

import { useState } from 'react';
import { MapPin, Loader2, CheckCircle } from 'lucide-react';
import { getUserLocation, formatDistance } from '@/lib/geolocation';

export default function BuyerLocationSettings({ initialLat, initialLng }) {
  const [lat, setLat] = useState(initialLat || null);
  const [lng, setLng] = useState(initialLng || null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function handleUseCurrentLocation() {
    setLoading(true);
    setError(null);

    try {
      const location = await getUserLocation();
      if (!location) {
        setError('Location access denied. Please enable geolocation in your browser settings.');
        setLoading(false);
        return;
      }

      // Save to database
      const response = await fetch('/api/account/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: location.lat, lng: location.lng }),
      });

      if (!response.ok) throw new Error('Failed to save location');

      const data = await response.json();
      setLat(data.lat);
      setLng(data.lng);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Error saving location');
    } finally {
      setLoading(false);
    }
  }

  async function handleClearLocation() {
    setLoading(true);
    try {
      const response = await fetch('/api/account/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: null, lng: null }),
      });

      if (!response.ok) throw new Error('Failed to clear location');

      setLat(null);
      setLng(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Error clearing location');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 bg-[#111111] border border-white/[0.08] p-4 sm:p-6 rounded-xl">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-[#ff5a2f]" />
          Your Location
        </h3>
        <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
          Share your location to help us show you nearby dealerships. This is optional and you can update or remove it anytime.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-900/10 border border-red-900/40">
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-900/10 border border-emerald-900/40">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-xs font-medium text-emerald-300">Location saved successfully</p>
        </div>
      )}

      {lat && lng ? (
        <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase mb-2">Current Location</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase font-semibold">Latitude</p>
                  <p className="text-sm font-mono text-white">{lat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-zinc-400 uppercase font-semibold">Longitude</p>
                  <p className="text-sm font-mono text-white">{lng.toFixed(6)}</p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-emerald-900/30 text-emerald-300 px-2.5 py-1 text-[11px] font-bold uppercase rounded-xl">
              <MapPin className="w-3 h-3" />
              Set
            </span>
          </div>

          <button
            onClick={handleClearLocation}
            disabled={loading}
            className="w-full px-3 py-3 sm:py-2 text-xs font-bold text-red-300 bg-red-900/10 hover:bg-red-900/20 border border-red-900/40 transition disabled:opacity-50 rounded-xl"
          >
            Remove Location
          </button>
        </div>
      ) : (
        <button
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#ff5a2f] text-white font-bold text-sm hover:bg-[#e54a1f] disabled:opacity-50 transition rounded-xl"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding Location...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Use My Current Location
            </>
          )}
        </button>
      )}
    </div>
  );
}
