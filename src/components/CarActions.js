"use client";
// src/components/CarActions.js
// Save button + recently viewed tracker for car detail page

import { useState, useEffect } from "react";

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
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all duration-300 uppercase tracking-widest ${
        saved 
          ? "bg-orange-500/10 border border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.2)]" 
          : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20"
      } ${loading ? "cursor-wait" : "cursor-pointer"}`}
    >
      <span className="text-lg leading-none">{saved ? "❤️" : "🤍"}</span>
      {saved ? "Saved" : "Save car"}
    </button>
  );
}

// ── Recently Viewed Tracker ───────────────────────────────────
// Call this on every car detail page to track views in localStorage
export function TrackRecentView({ car }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const MAX   = 12;
      const KEY   = "motorke_recent";
      const entry = {
        id:       car.id,
        title:    `${car.year} ${car.make} ${car.model}`,
        price:    car.price,
        image:    car.image,
        viewedAt: new Date().toISOString(),
      };

      const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
      // Remove if already there, add to front
      const filtered = existing.filter(c => c.id !== car.id);
      const updated  = [entry, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {}
  }, [car.id]);

  return null; // renders nothing
}
