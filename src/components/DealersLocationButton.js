"use client";

import { useRef, useState } from "react";
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

  const locatingRef = useRef(false);

  function detectLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    // Guard with a ref instead of `disabled` so the button stays visually live
    // and focusable while a fix is pending — a disabled button for the length
    // of the browser's permission dialog reads as a dead click.
    if (locatingRef.current) return;
    locatingRef.current = true;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locatingRef.current = false;
        setLocating(false);
        applyLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        locatingRef.current = false;
        setLocating(false);
      },
      // `maximumAge: 0` + `enableHighAccuracy: true` forced a fresh GPS fix,
      // which can take 10s or hang. A cached city-level fix is accurate enough
      // to sort dealers by distance and normally returns instantly.
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={detectLocation}
        className="w-full inline-flex items-center justify-center gap-2 border border-[var(--accent-dim)] bg-accent-wash text-[var(--accent)] px-4 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-accent-dim transition-colors aria-busy:opacity-70 rounded-xl"
      >
        {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        {locating ? "Finding location..." : hasLocation ? "Refresh distance" : "Use my location"}
      </button>
      {hasLocation ? (
        <button
          type="button"
          onClick={clearLocation}
          className="w-full inline-flex items-center justify-center gap-2 border border-border bg-surface text-muted px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:text-text transition-colors rounded-xl"
        >
          <X className="w-3.5 h-3.5" />
          Clear location
        </button>
      ) : null}
    </div>
  );
}
