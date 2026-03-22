"use client";
// src/components/LocationSearch.js
// Hero search bar with optional location detection

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LocationSearch() {
  const [search,   setSearch]   = useState("");
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null); // { lat, lng, label }
  const router = useRouter();

  function detectLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (location)      { params.set("lat", location.lat); params.set("lng", location.lng); }
    router.push(`/cars?${params.toString()}`);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{
        display: "flex", gap: 8, background: "rgba(255,255,255,0.97)",
        borderRadius: 14, padding: 8, maxWidth: 580,
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by make, model or keyword…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "10px 14px", fontSize: 15, color: "#1A1A1A", fontFamily: "inherit" }}
        />
        <button
          type="button"
          onClick={detectLocation}
          title="Use my location"
          style={{
            background: location ? "#e8eef4" : "transparent",
            border: "none", borderRadius: 10, padding: "10px 12px",
            cursor: "pointer", fontSize: 18, flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          {locating ? "⏳" : location ? "📍" : "🔍"}
        </button>
        <button type="submit" style={{
          background: "#E8490F", color: "white", border: "none",
          borderRadius: 10, padding: "10px 24px", fontWeight: 700,
          fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          flexShrink: 0,
        }}>
          Search
        </button>
      </form>

      {location && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 99, padding: "3px 12px" }}>
            📍 Searching near your location
          </span>
          <button onClick={() => setLocation(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>✕ Clear</button>
        </div>
      )}
    </div>
  );
}