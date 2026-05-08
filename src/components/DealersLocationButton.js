"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin, X } from "lucide-react";

export default function DealersLocationButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locating, setLocating] = useState(false);

  const hasLocation = Boolean(searchParams.get("lat") && searchParams.get("lng"));

  function applyLocation(lat, lng) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("lat", String(lat));
    params.set("lng", String(lng));
    router.push(`/dealers?${params.toString()}`);
  }

  function clearLocation() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lat");
    params.delete("lng");
    const query = params.toString();
    router.push(query ? `/dealers?${query}` : "/dealers");
  }

  function detectLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        applyLocation(position.coords.latitude, position.coords.longitude);
      },
      () => setLocating(false),
      // Force fresh device coordinates instead of cached location.
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={detectLocation}
        disabled={locating}
        className="w-full inline-flex items-center justify-center gap-2 border border-[#38A169]/40 bg-[#38A169]/10 text-[#2F855A] px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#38A169]/15 transition-colors disabled:opacity-60"
        style={{ borderRadius: "var(--radius)" }}
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {locating ? "Finding location..." : hasLocation ? "Refresh distance" : "Use my location"}
      </button>
      {hasLocation ? (
        <button
          type="button"
          onClick={clearLocation}
          className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-colors dark:border-slate-700 dark:bg-[#111111] dark:text-slate-300 dark:hover:text-white"
          style={{ borderRadius: "var(--radius)" }}
        >
          <X className="w-3.5 h-3.5" />
          Clear location
        </button>
      ) : null}
    </div>
  );
}
