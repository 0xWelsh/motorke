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
      style={{
        display:        "flex",
        alignItems:     "center",
        gap:            6,
        padding:        "10px 18px",
        borderRadius:   10,
        border:         saved ? "1.5px solid #E8490F" : "1.5px solid #E2E2E2",
        background:     saved ? "#fff0eb" : "#fff",
        color:          saved ? "#E8490F" : "#444",
        fontWeight:     600,
        fontSize:       14,
        cursor:         loading ? "wait" : "pointer",
        fontFamily:     "inherit",
        transition:     "all 0.15s",
      }}
    >
      <span style={{ fontSize: 16 }}>{saved ? "❤️" : "🤍"}</span>
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
