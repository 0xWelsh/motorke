'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { getUserLocation, formatDistance } from '@/lib/geolocation';

export default function NearbyDealersList() {
  const [dealers, setDealers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [radius, setRadius] = useState(50);
  const [savedLocation, setSavedLocation] = useState(null);
  const [locationSource, setLocationSource] = useState(null); // "saved" or "current"

  // Load buyer's saved location on mount
  useEffect(() => {
    async function loadSavedLocation() {
      try {
        const response = await fetch('/api/account/location');
        if (response.ok) {
          const data = await response.json();
          if (data.lat && data.lng) {
            setSavedLocation(data);
          }
        }
      } catch (err) {
        console.error('Failed to load saved location:', err);
      }
    }
    loadSavedLocation();
  }, []);

  async function handleFindNearby(source = 'current') {
    setLoading(true);
    setError(null);
    setDealers(null);
    setLocationSource(source);

    try {
      let location;
      
      if (source === 'saved' && savedLocation) {
        location = { lat: savedLocation.lat, lng: savedLocation.lng };
      } else {
        location = await getUserLocation();
        if (!location) {
          setError('Location access denied. Please enable geolocation in your browser settings.');
          setLoading(false);
          return;
        }
      }

      const response = await fetch(
        `/api/dealers/nearby?lat=${location.lat}&lng=${location.lng}&radius=${radius}`
      );

      if (!response.ok) throw new Error('Failed to fetch nearby dealers');

      const data = await response.json();
      setDealers(data.length === 0 ? [] : data);
      if (data.length === 0) {
        setError(`No dealers found within ${radius}km`);
      }
    } catch (err) {
      setError(err.message || 'Error fetching nearby dealers');
    } finally {
      setLoading(false);
    }
  }

  const btnBase =
    "inline-flex items-center justify-center gap-1.5 rounded-md border text-[10px] font-bold uppercase tracking-[0.1em] transition disabled:opacity-50";
  const btnPrimary = `${btnBase} border-[var(--accent)] bg-[var(--accent)] text-white hover:opacity-90`;
  const btnSecondary = `${btnBase} border-slate-300 bg-white text-slate-700 hover:bg-slate-100`;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <div className="w-full">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
            Search radius
          </label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            disabled={loading}
            className="w-full px-3 py-2 text-sm font-medium border border-slate-300 text-slate-900 bg-slate-50 disabled:opacity-50 outline-none rounded-xl"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </div>

        {/* Show both options if saved location exists */}
        {savedLocation ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleFindNearby("saved")}
              disabled={loading}
              className={`${btnSecondary} w-full py-2 px-3`}
            >
              {loading && locationSource === "saved" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Finding…
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Saved location
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleFindNearby("current")}
              disabled={loading}
              className={`${btnPrimary} w-full py-2 px-3`}
            >
              {loading && locationSource === "current" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Finding…
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  Near you
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleFindNearby("current")}
            disabled={loading}
            className={`${btnPrimary} w-full py-2 px-3`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Finding…
              </>
            ) : (
              <>
                <MapPin className="w-3.5 h-3.5" />
                Near you
              </>
            )}
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Results */}
      {dealers !== null && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-500">
            {dealers.length} dealer{dealers.length !== 1 ? "s" : ""} found
            {locationSource && ` · ${locationSource === "saved" ? "Saved" : "Current"} location`}
          </p>

          {dealers.length > 0 ? (
            <div className="space-y-2">
              {dealers.map((dealer) => (
                <Link
                  key={dealer.id}
                  href={`/dealers/${dealer.slug}`}
                  className="flex items-center justify-between gap-3 p-3 border border-slate-200 hover:border-[var(--accent)]/40 hover:bg-slate-100 transition rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{dealer.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{dealer.location}</p>
                    {dealer._count?.cars > 0 && (
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        {dealer._count.cars} car{dealer._count.cars !== 1 ? "s" : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] border border-[var(--accent)]/30 bg-[var(--accent)]/5">
                      <MapPin className="w-3 h-3" />
                      {formatDistance(dealer.distance)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
