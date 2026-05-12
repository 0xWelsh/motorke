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

// ── Save Button ───────────────────────────────────────────────
export function SaveButton({ carId, initialSaved = false, isLoggedIn }) {
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
      className={`flex items-center gap-2 px-5 py-3 sm:py-2.5 rounded-2xl font-black text-[12px] transition-all duration-300 uppercase tracking-widest ${
        saved 
          ? "bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm" 
          : "bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-white shadow-sm"
      } ${loading ? "cursor-wait opacity-50" : "cursor-pointer active:scale-95"}`}
    >
      <span className="text-lg leading-none">{saved ? "❤️" : "🤍"}</span>
      {saved ? "Saved" : "Save car"}
    </button>
  );
}

// ── Recently Viewed Tracker ───────────────────────────────────
// Call this on every car detail page to:
//   1. Write the car into the "recently viewed" localStorage/cookie trail
//      (used for the homepage rail + on-site personalization).
//   2. Ping the server-side view counter, but only after the user has
//      stayed on the page for 2s, so accidental scrolls-and-aways don't
//      inflate dealer stats. We also send the document.referrer so the
//      server can attribute the view to Facebook / WhatsApp / Google /
//      etc.
const VIEW_DWELL_MS = 2000;

export function TrackRecentView({ car }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Local "recently viewed" trail – do this immediately, it's a UX
    //    thing and dwell time doesn't matter.
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

    // 2) Server-side counter – only after the dwell threshold. Cancel
    //    if the user navigates away first.
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
