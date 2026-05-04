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
// Call this on every car detail page to track views in localStorage + database
export function TrackRecentView({ car }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const MAX   = 12;
      const entry = {
        id:       car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        title:    `${car.year} ${car.make} ${car.model}`,
        price:    car.price,
        image:    car.image,
        viewedAt: new Date().toISOString(),
      };

      const existing = readRecentCarsFromStorage();
      // Remove if already there, add to front
      const filtered = existing.filter(c => c.id !== car.id);
      const updated  = [entry, ...filtered].slice(0, MAX);
      localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
      // Keep a short cookie trail for personalization before login/session restore.
      writeJsonCookie(RECENT_COOKIE_KEY, updated.slice(0, 6), 60 * 60 * 24 * 30);
    } catch {}

    // Also track in database for logged-in users
    try {
      fetch("/api/cars/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: car.id }),
      }).catch(() => {}); // Silent fail if offline
    } catch {}
  }, [car.id]);

  return null; // renders nothing
}
