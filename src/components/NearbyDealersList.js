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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
            Search radius
          </label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            disabled={loading}
            className="px-3 py-3 sm:py-2 border border-[#ddd4c8] dark:border-slate-800 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-[#111111] disabled:opacity-50"
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
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleFindNearby('saved')}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition"
            >
              {loading && locationSource === 'saved' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Saved Location
                </>
              )}
            </button>
            <button
              onClick={() => handleFindNearby('current')}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-[#ff5a2f] text-white dark:bg-white dark:!text-black rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition"
            >
              {loading && locationSource === 'current' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Current Location
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => handleFindNearby('current')}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 sm:py-2 bg-[#ff5a2f] text-white dark:bg-white dark:!text-black rounded-lg font-bold text-[10px] uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Find Nearby
              </>
            )}
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {dealers !== null && (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            {dealers.length} dealer{dealers.length !== 1 ? 's' : ''} found
            {locationSource && ` • Using ${locationSource === 'saved' ? 'saved' : 'current'} location`}
          </p>

          {dealers.length > 0 ? (
            <div className="space-y-2">
              {dealers.map((dealer) => (
                <Link
                  key={dealer.id}
                  href={`/dealers/${dealer.slug}`}
                  className="flex items-center justify-between p-5 border border-[#ddd4c8] dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:bg-white/5 transition shadow-sm"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white">{dealer.name}</h3>
                    <p className="text-sm text-slate-600">{dealer.location}</p>
                    {dealer._count?.cars > 0 && (
                      <p className="text-sm text-slate-500 mt-1">
                        {dealer._count.cars} car{dealer._count.cars !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-2xl text-sm font-medium">
                        <MapPin className="w-4 h-4" />
                        {formatDistance(dealer.distance)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
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
