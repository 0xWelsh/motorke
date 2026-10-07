"use client";
// src/components/CarActions.js
// Save button + recently viewed tracker for car detail page

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RECENT_COOKIE_KEY,
  RECENT_STORAGE_KEY,
  readRecentCarsFromStorage,
  writeJsonCookie,
} from "@/lib/personalization";

// Save Button
export function SaveButton({ carId, initialSaved = false, isLoggedIn, className = "" }) {
  const router = useRouter();
  const [saved,   setSaved]   = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);

  async function toggle() {
    if (inFlight.current) return;

    const method = saved ? "DELETE" : "POST";
    const next = !saved;

    // Optimistic: flip the heart on this frame. The old version waited for the
    // round trip before touching state, so the click looked like it did nothing.
    inFlight.current = true;
    setSaved(next);
    setLoading(true);

    let res = null;
    try {
      res  = await fetch(`/api/saved/${carId}`, { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Request failed");
      // Reconcile with the server's truth rather than assuming the guess.
      setSaved(typeof data.saved === "boolean" ? data.saved : next);
    } catch {
      setSaved(saved); // roll back
      // 401 is the authoritative "not signed in" signal. Gating on the
      // client-side session sent logged-in users to /login whenever they
      // clicked before `/api/auth/me` had resolved.
      if (res?.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/cars/${carId}`)}`);
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-busy={loading}
      aria-pressed={saved}
      title={saved ? "Remove from saved" : "Save this car"}
      className={`btn ${saved ? "btn-primary" : "btn-neutral"} ${loading ? "opacity-70" : ""} ${className}`}
    >
      <span className="text-base leading-none">{saved ? "❤️" : "🤍"}</span>
      {saved ? "Saved" : "Save car"}
    </button>
  );
}

// Recently Viewed Tracker
const VIEW_DWELL_MS = 2000;

export function TrackRecentView({ car }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const MAX   = 12;
      const entry = {
        id:       car.id,
        make:     car.make,
        model:    car.model,
        year:     car.year,
        title:    `${car.year} ${car.make} ${car.model}`,
        price:    car.price,
        image:    car.image,
        viewedAt: new Date().toISOString(),
      };

      const existing = readRecentCarsFromStorage();
      const filtered = existing.filter((c) => c.id !== car.id);
      const updated  = [entry, ...filtered].slice(0, MAX);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
      writeJsonCookie(RECENT_COOKIE_KEY, updated.slice(0, 6), 60 * 60 * 24 * 30);
    } catch {}

    const timer = window.setTimeout(() => {
      try {
        const referrer = typeof document !== "undefined" ? document.referrer : "";
        fetch("/api/cars/views", {
          method:      "POST",
          headers:     { "Content-Type": "application/json" },
          credentials: "include",
          keepalive:   true,
          body: JSON.stringify({
            carId:    car.id,
            referrer: referrer || null,
          }),
        }).catch(() => {});
      } catch {}
    }, VIEW_DWELL_MS);

    return () => window.clearTimeout(timer);
  }, [car.id]);

  return null;
}
