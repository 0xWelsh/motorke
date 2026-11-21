"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw } from "lucide-react";

const PRESETS = [
  { label: "Under 1M", minPrice: 0, maxPrice: 1000000 },
  { label: "1M–2M", minPrice: 1000000, maxPrice: 2000000 },
  { label: "2M–3M", minPrice: 2000000, maxPrice: 3000000 },
  { label: "3M–5M", minPrice: 3000000, maxPrice: 5000000 },
  { label: "Above 5M", minPrice: 5000000, maxPrice: 0 },
];

const MAKE_CHIPS = ["Toyota", "Nissan", "Subaru", "BMW", "Mercedes"];
const EXTRA_CHIPS = [
  { label: "SUV", param: "bodyType", value: "SUV" },
  { label: "Nairobi", param: "county", value: "Nairobi" },
];

export default function HomepagePriceFilter() {
  const router = useRouter();
  const [selectedMake, setSelectedMake] = useState(null);
  const [selectedExtra, setSelectedExtra] = useState({});
  const [activePreset, setActivePreset] = useState(null);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const toggleMake = useCallback((make) => {
    setSelectedMake((prev) => (prev === make ? null : make));
  }, []);

  const toggleExtra = useCallback((param, value) => {
    setSelectedExtra((prev) =>
      prev[param] === value ? { ...prev, [param]: undefined } : { ...prev, [param]: value }
    );
  }, []);

  const selectPreset = useCallback((index) => {
    setActivePreset(index);
    setCustomMin("");
    setCustomMax("");
  }, []);

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    if (selectedMake) params.set("make", selectedMake);
    Object.entries(selectedExtra).forEach(([key, val]) => {
      if (val) params.set(key, val);
    });

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
  }, [selectedMake, selectedExtra, activePreset, customMin, customMax, router]);

  const resetFilters = useCallback(() => {
    setSelectedMake(null);
    setSelectedExtra({});
    setActivePreset(null);
    setCustomMin("");
    setCustomMax("");
  }, []);

  const hasSelection = selectedMake || Object.values(selectedExtra).some(Boolean) || activePreset !== null || customMin || customMax;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Makes row */}
      <div className="flex flex-wrap gap-2 justify-center mb-2.5">
        {MAKE_CHIPS.map((make) => (
          <button
            key={make}
            onClick={() => toggleMake(make)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider border transition-all rounded-lg ${
              selectedMake === make
                ? "border-[var(--accent)] bg-accent-wash text-[var(--accent)]"
                : "border-border bg-surface text-muted hover:bg-surface-hover hover:border-border hover:text-text"
            }`}
          >
            {make}
          </button>
        ))}
        {EXTRA_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => toggleExtra(chip.param, chip.value)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider border transition-all rounded-lg ${
              selectedExtra[chip.param] === chip.value
                ? "border-[var(--accent)] bg-accent-wash text-[var(--accent)]"
                : "border-border bg-surface text-muted hover:bg-surface-hover hover:border-border hover:text-text"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Price presets */}
      <div className="flex flex-wrap gap-2 justify-center mb-2.5">
        {PRESETS.map((preset, i) => (
          <button
            key={i}
            onClick={() => selectPreset(i)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider border transition-all rounded-lg ${
              activePreset === i
                ? "border-[var(--accent)] bg-accent-wash text-[var(--accent)]"
                : "border-border bg-surface text-muted hover:bg-surface-hover hover:border-border hover:text-text"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom inputs + Apply + Reset */}
      <div className="flex items-center gap-2 justify-center flex-wrap">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="Min KES"
            value={customMin}
            onChange={(e) => {
              setCustomMin(e.target.value);
              setActivePreset(null);
            }}
            className="w-24 sm:w-28 px-2.5 py-1.5 text-xs border border-border bg-surface text-text placeholder:text-dim focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow rounded-lg transition-all"
          />
          <span className="text-dim text-xs font-medium">&ndash;</span>
          <input
            type="number"
            placeholder="Max KES"
            value={customMax}
            onChange={(e) => {
              setCustomMax(e.target.value);
              setActivePreset(null);
            }}
            className="w-24 sm:w-28 px-2.5 py-1.5 text-xs border border-border bg-surface text-text placeholder:text-dim focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow rounded-lg transition-all"
          />
        </div>

        <button
          onClick={applyFilters}
          disabled={!hasSelection}
          className={`btn btn-sm ${
            hasSelection ? "btn-primary cursor-pointer" : "btn-neutral cursor-not-allowed"
          }`}
        >
          <Search className="w-3 h-3" aria-hidden />
          Apply Filters
        </button>

        {hasSelection && (
          <button
            onClick={resetFilters}
            className="btn btn-neutral btn-sm"
          >
            <RotateCcw className="w-3 h-3" aria-hidden />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
