"use client";
// src/components/CompareSelector.js
// Lets users add a car to comparison from any car card.
// Stores up to 3 car IDs in localStorage and syncs to URL on /compare.

import { useState, useEffect } from "react";

const KEY = "motorke_compare";
const MAX = 3;

export function useCompare() {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) || "[]");
      setIds(stored.slice(0, MAX));
    } catch {}
  }, []);

  function toggle(id) {
    setIds((prev) => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter((i) => i !== id);
      } else if (prev.length < MAX) {
        next = [...prev, id];
      } else {
        // Replace oldest
        next = [...prev.slice(1), id];
      }
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  function clear() {
    setIds([]);
    try { localStorage.removeItem(KEY); } catch {}
  }

  function compareUrl() {
    return `/compare?${ids.map((id, i) => `${"abc"[i]}=${id}`).join("&")}`;
  }

  return { ids, toggle, clear, compareUrl };
}

// Floating compare bar — shows when 1+ cars are selected
export function CompareBar() {
  const { ids, clear, compareUrl } = useCompare();

  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/20 rounded-2xl px-5 py-3 shadow-xl shadow-black/50">
        <span className="text-sm text-white/60">
          {ids.length} car{ids.length > 1 ? "s" : ""} selected
        </span>
        <div className="flex gap-1">
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < ids.length ? "bg-[#f97316]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <a
          href={compareUrl()}
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white text-sm font-bold px-4 py-1.5 rounded-xl transition-colors"
        >
          Compare →
        </a>
        <button
          onClick={clear}
          className="text-white/30 hover:text-white text-sm transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Button to add/remove a single car from the compare list
export function CompareButton({ carId }) {
  const { ids, toggle } = useCompare();
  const selected = ids.includes(carId);

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(carId); }}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
        selected
          ? "bg-[#f97316]/20 border-[#f97316]/40 text-[#f97316]"
          : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"
      }`}
    >
      {selected ? "✓ Added" : "+ Compare"}
    </button>
  );
}
