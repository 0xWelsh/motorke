"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";

const PRICE_PRESETS = [
  { label: "Under 1M", minPrice: 0, maxPrice: 1000000 },
  { label: "1M-2M", minPrice: 1000000, maxPrice: 2000000 },
  { label: "2M-3M", minPrice: 2000000, maxPrice: 3000000 },
  { label: "3M-5M", minPrice: 3000000, maxPrice: 5000000 },
  { label: "Above 5M", minPrice: 5000000, maxPrice: 0 },
];

const asStr = (v) => (v != null && v !== "" ? String(v) : "");

function buildUrl(currentParams, updates) {
  const params = new URLSearchParams(currentParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (!value || value === "") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  params.delete("page");
  const qs = params.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

export default function CarsHorizontalFilters({ activeFilters, allMakes = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [make, setMake] = useState(asStr(activeFilters.make));
  const [transmission, setTransmission] = useState(asStr(activeFilters.transmission));
  const [pricePreset, setPricePreset] = useState(null);
  const [minPrice, setMinPrice] = useState(asStr(activeFilters.minPrice));
  const [maxPrice, setMaxPrice] = useState(asStr(activeFilters.maxPrice));

  const hasChanges =
    make !== asStr(activeFilters.make) ||
    transmission !== asStr(activeFilters.transmission) ||
    (pricePreset !== null) ||
    minPrice !== asStr(activeFilters.minPrice) ||
    maxPrice !== asStr(activeFilters.maxPrice);

  const applyFilters = useCallback(() => {
    const updates = {};
    if (make) updates.make = make;
    if (transmission) updates.transmission = transmission;
    if (pricePreset !== null) {
      const preset = PRICE_PRESETS[pricePreset];
      if (preset.minPrice > 0) updates.minPrice = String(preset.minPrice);
      if (preset.maxPrice > 0) updates.maxPrice = String(preset.maxPrice);
    } else {
      if (minPrice) updates.minPrice = minPrice;
      if (maxPrice) updates.maxPrice = maxPrice;
    }
    router.push(buildUrl(searchParams, updates));
  }, [make, transmission, pricePreset, minPrice, maxPrice, searchParams, router]);

  const resetFilters = useCallback(() => {
    setMake(""); setTransmission("");
    setPricePreset(null); setMinPrice(""); setMaxPrice("");
  }, []);

  const hasAnySelection = make || transmission || minPrice || maxPrice || pricePreset !== null;

  function toggleMake(value) {
    setMake((prev) => (prev === value ? "" : value));
  }

  return (
    <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 p-3 sm:p-4 space-y-3">
      {/* Brands */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">Brand</span>
        {allMakes.map((m) => (
          <button
            key={m.make}
            onClick={() => toggleMake(m.make)}
            className={`shrink-0 px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-all ${
              make === m.make
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/30"
                : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
            style={{ borderRadius: "6px" }}
          >
            {m.make}
          </button>
        ))}
      </div>

      {/* Price + Transmission */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">Price</span>
          {PRICE_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => { setPricePreset(i); setMinPrice(""); setMaxPrice(""); }}
              className={`shrink-0 px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-all ${
                pricePreset === i
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
              style={{ borderRadius: "4px" }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-slate-200 dark:bg-zinc-700 shrink-0" />

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">Trans</span>
          {["AUTO", "MANUAL"].map((t) => (
            <button
              key={t}
              onClick={() => setTransmission((prev) => (prev === t ? "" : t))}
              className={`shrink-0 px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-all ${
                transmission === t
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
              style={{ borderRadius: "4px" }}
            >
              {t === "AUTO" ? "Auto" : "Manual"}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-slate-200 dark:bg-zinc-700 shrink-0" />

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">Range</span>
          <input type="number" value={minPrice} placeholder="Min" onChange={(e) => { setMinPrice(e.target.value); setPricePreset(null); }} className="w-20 sm:w-24 px-2 py-1 text-[10px] sm:text-[11px] bg-transparent border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors" style={{ borderRadius: "4px" }} />
          <span className="text-slate-400 dark:text-zinc-500 text-[9px]">—</span>
          <input type="number" value={maxPrice} placeholder="Max" onChange={(e) => { setMaxPrice(e.target.value); setPricePreset(null); }} className="w-20 sm:w-24 px-2 py-1 text-[10px] sm:text-[11px] bg-transparent border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors" style={{ borderRadius: "4px" }} />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {hasAnySelection && (
            <button onClick={resetFilters} className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-600 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all" style={{ borderRadius: "4px" }}>
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          )}
          <button
            onClick={applyFilters}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-all ${
              hasChanges
                ? "border-brand-accent bg-brand-accent text-white hover:opacity-90 cursor-pointer"
                : "border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
            }`}
            style={{ borderRadius: "4px" }}
          >
            <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
