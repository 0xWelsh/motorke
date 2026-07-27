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
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 0 }
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={detectLocation}
        disabled={locating}
        className="w-full inline-flex items-center justify-center gap-2 border border-[#38A169]/40 bg-[#38A169]/10 text-[var(--accent)] px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-[#38A169]/15 transition-colors disabled:opacity-60 rounded-xl"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {locating ? "Finding location..." : hasLocation ? "Refresh distance" : "Use my location"}
      </button>
      {hasLocation ? (
        <button
          type="button"
          onClick={clearLocation}
          className="w-full inline-flex items-center justify-center gap-2 border border-white/[0.08] bg-[#0f0f0f] text-zinc-400 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors rounded-xl"
        >
          <X className="w-3.5 h-3.5" />
          Clear location
        </button>
      ) : null}
    </div>
  );
}
