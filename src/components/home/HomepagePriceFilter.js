"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const PRESETS = [
  { label: "Under KSh 1M", minPrice: 0, maxPrice: 1000000 },
  { label: "KSh 1M – 2M", minPrice: 1000000, maxPrice: 2000000 },
  { label: "KSh 2M – 3M", minPrice: 2000000, maxPrice: 3000000 },
  { label: "KSh 3M – 5M", minPrice: 3000000, maxPrice: 5000000 },
  { label: "Above KSh 5M", minPrice: 5000000, maxPrice: 0 },
];

export default function HomepagePriceFilter() {
  const router = useRouter();
  const [activePreset, setActivePreset] = useState(null);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const selectPreset = useCallback((index) => {
    setActivePreset(index);
    setCustomMin("");
    setCustomMax("");
  }, []);

  const selectCustom = useCallback(() => {
    setActivePreset(null);
  }, []);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (activePreset !== null) {
      const preset = PRESETS[activePreset];
      if (preset.minPrice > 0) params.set("minPrice", preset.minPrice);
      if (preset.maxPrice > 0) params.set("maxPrice", preset.maxPrice);
    } else if (customMin || customMax) {
      if (customMin) params.set("minPrice", parseInt(customMin, 10));
      if (customMax) params.set("maxPrice", parseInt(customMax, 10));
    }

    const qs = params.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  }, [activePreset, customMin, customMax, router]);

  const hasSelection = activePreset !== null || customMin || customMax;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 mb-3 text-center">
        Filter by budget
      </p>

      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => selectPreset(i)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider border transition-all ${
              activePreset === i
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent dark:text-emerald-400 dark:border-emerald-500"
                : "border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-center">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Min KSh"
            value={customMin}
            onClick={selectCustom}
            onChange={(e) => {
              setCustomMin(e.target.value);
              setActivePreset(null);
            }}
            className="w-28 sm:w-32 px-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-accent rounded-none"
          />
          <span className="text-slate-400 dark:text-zinc-500 text-xs font-medium">&ndash;</span>
          <input
            type="number"
            placeholder="Max KSh"
            value={customMax}
            onClick={selectCustom}
            onChange={(e) => {
              setCustomMax(e.target.value);
              setActivePreset(null);
            }}
            className="w-28 sm:w-32 px-3 py-1.5 text-xs border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-accent rounded-none"
          />
        </div>

        <button
          onClick={applyFilters}
          disabled={!hasSelection}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider border transition-all ${
            hasSelection
              ? "border-brand-accent bg-brand-accent text-white hover:opacity-90 cursor-pointer"
              : "border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
          }`}
        >
          <Search className="w-3 h-3" aria-hidden />
          Apply Filters
        </button>
      </div>
    </div>
  );
}
