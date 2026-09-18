"use client";
// src/components/CarActions.js
// Save button + recently viewed tracker for car detail page

import { useState, useEffect } from "react";
import {
  RECENT_COOKIE_KEY,
  RECENT_STORAGE_KEY,
  readRecentCarsFromStorage,
  writeJsonCookie,
} from "@/lib/personalization";

// Save Button
export function SaveButton({ carId, initialSaved = false, isLoggedIn, className = "" }) {
  const [saved,   setSaved]   = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    const method = saved ? "DELETE" : "POST";
    const res    = await fetch(`/api/saved/${carId}`, { method });
    const data   = await res.json();
    setSaved(data.saved);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={saved ? "Remove from saved" : "Save this car"}
      className={`btn ${
        saved ? "btn-primary" : "btn-neutral"
      } ${loading ? "cursor-wait opacity-50" : "cursor-pointer"} ${className}`}
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
        }).then((r) => r.json()).then((d) => {
          if (d?.recorded) {
            window.dispatchEvent(new CustomEvent("car-view-recorded"));
          }
        }).catch(() => {});
      } catch {}
    }, VIEW_DWELL_MS);

    return () => window.clearTimeout(timer);
  }, [car.id]);

  return null;
}
