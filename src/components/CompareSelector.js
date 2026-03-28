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
      <div className="flex items-center gap-3 bg-surface/90 backdrop-blur-2xl border border-orange-500/20 rounded-2xl px-5 py-3 shadow-[0_0_30px_rgba(234,88,12,0.15)]">
        <span className="text-sm font-bold text-white/60">
          {ids.length} car{ids.length > 1 ? "s" : ""} selected
        </span>
        <div className="flex gap-1">
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < ids.length ? "bg-orange-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <a
          href={compareUrl()}
          className="bg-orange-600 hover:bg-orange-500 text-pureWhite text-sm font-black px-5 py-2 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,88,12,0.4)]"
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
      className={`text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all duration-300 border ${
        selected
          ? "bg-orange-500/10 border-orange-500/40 text-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.15)]"
          : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20 hover:bg-white/10"
      }`}
    >
      {selected ? "✓ Added" : "+ Compare"}
    </button>
  );
}
