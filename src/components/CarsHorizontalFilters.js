"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCcw, X } from "lucide-react";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";

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

function toggleArrayValue(arr, value) {
  const set = new Set(arr.split(",").filter(Boolean));
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return Array.from(set).join(",");
}

export default function CarsHorizontalFilters({ activeFilters, allMakes = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [make, setMake] = useState(asStr(activeFilters.make));
  const [transmission, setTransmission] = useState(asStr(activeFilters.transmission));
  const [pricePreset, setPricePreset] = useState(null);
  const [minPrice, setMinPrice] = useState(asStr(activeFilters.minPrice));
  const [maxPrice, setMaxPrice] = useState(asStr(activeFilters.maxPrice));
  const [bodyTypes, setBodyTypes] = useState(asStr(activeFilters.bodyType || ""));
  const [fuelTypes, setFuelTypes] = useState(asStr(activeFilters.fuelType || ""));
  const [minYear, setMinYear] = useState(asStr(activeFilters.minYOM || ""));
  const [maxYear, setMaxYear] = useState(asStr(activeFilters.maxYOM || ""));

  const bodyArr = bodyTypes.split(",").filter(Boolean);
  const fuelArr = fuelTypes.split(",").filter(Boolean);

  const hasChanges =
    make !== asStr(activeFilters.make) ||
    transmission !== asStr(activeFilters.transmission) ||
    pricePreset !== null ||
    minPrice !== asStr(activeFilters.minPrice) ||
    maxPrice !== asStr(activeFilters.maxPrice) ||
    bodyTypes !== asStr(activeFilters.bodyType || "") ||
    fuelTypes !== asStr(activeFilters.fuelType || "") ||
    minYear !== asStr(activeFilters.minYOM || "") ||
    maxYear !== asStr(activeFilters.maxYOM || "");

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
    if (bodyTypes) updates.bodyType = bodyTypes;
    if (fuelTypes) updates.fuelType = fuelTypes;
    if (minYear) updates.minYOM = minYear;
    if (maxYear) updates.maxYOM = maxYear;
    router.push(buildUrl(searchParams, updates));
  }, [make, transmission, pricePreset, minPrice, maxPrice, bodyTypes, fuelTypes, minYear, maxYear, searchParams, router]);

  const resetFilters = useCallback(() => {
    setMake(""); setTransmission("");
    setPricePreset(null); setMinPrice(""); setMaxPrice("");
    setBodyTypes(""); setFuelTypes("");
    setMinYear(""); setMaxYear("");
    router.push("/cars");
  }, [router]);

  const hasAnySelection = make || transmission || minPrice || maxPrice || pricePreset !== null || bodyTypes || fuelTypes || minYear || maxYear;

  const filterCount = [make, transmission, bodyTypes, fuelTypes, minPrice || maxPrice ? "price" : "", minYear || maxYear ? "year" : ""].filter(Boolean).length;

  return (
    <div className="bg-white border border-slate-200 p-3 sm:p-4 space-y-3 rounded-xl shadow-sm">
      {/* Brands */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Brand</span>
        {allMakes.map((m) => (
          <button
            key={m.make}
            onClick={() => setMake((prev) => (prev === m.make ? "" : m.make))}
            className={`shrink-0 px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-all rounded-xl ${
              make === m.make
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/30"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {m.make}
          </button>
        ))}
      </div>

      {/* Price + Transmission */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Price</span>
          {PRICE_PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => { setPricePreset(i); setMinPrice(""); setMaxPrice(""); }}
              className={`shrink-0 px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-all rounded-xl ${
                pricePreset === i
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-slate-200 shrink-0" />

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Trans</span>
          {["AUTOMATIC", "MANUAL"].map((t) => (
            <button
              key={t}
              onClick={() => setTransmission((prev) => (prev === t ? "" : t))}
              className={`shrink-0 px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-all rounded-xl ${
                transmission === t
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t === "AUTOMATIC" ? "Auto" : "Manual"}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-slate-200 shrink-0" />

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Range</span>
          <input type="number" value={minPrice} placeholder="Min" onChange={(e) => { setMinPrice(e.target.value); setPricePreset(null); }} className="w-20 sm:w-24 px-2 py-1 text-[10px] sm:text-[11px] bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-accent focus:bg-white transition-colors rounded-xl" />
          <span className="text-slate-400 text-[9px]">\u2014</span>
          <input type="number" value={maxPrice} placeholder="Max" onChange={(e) => { setMaxPrice(e.target.value); setPricePreset(null); }} className="w-20 sm:w-24 px-2 py-1 text-[10px] sm:text-[11px] bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-accent focus:bg-white transition-colors rounded-xl" />
        </div>
      </div>

      {/* Body Type multi-select */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Body</span>
        {Object.entries(BODY_TYPE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setBodyTypes(toggleArrayValue(bodyTypes, key))}
            className={`shrink-0 px-2.5 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-all rounded-xl ${
              bodyArr.includes(key)
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/30"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Fuel Type multi-select + Year range */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Fuel</span>
          {Object.entries(FUEL_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFuelTypes(toggleArrayValue(fuelTypes, key))}
              className={`shrink-0 px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border transition-all rounded-xl ${
                fuelArr.includes(key)
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="w-px h-5 bg-slate-200 shrink-0" />

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Year</span>
          <input type="number" value={minYear} placeholder="From" onChange={(e) => setMinYear(e.target.value)} className="w-16 sm:w-20 px-2 py-1 text-[10px] sm:text-[11px] bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-accent focus:bg-white transition-colors rounded-xl" />
          <span className="text-slate-400 text-[9px]">\u2014</span>
          <input type="number" value={maxYear} placeholder="To" onChange={(e) => setMaxYear(e.target.value)} className="w-16 sm:w-20 px-2 py-1 text-[10px] sm:text-[11px] bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-accent focus:bg-white transition-colors rounded-xl" />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {hasAnySelection && (
            <button onClick={resetFilters} className="btn btn-neutral btn-sm">
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          )}
          <button
            onClick={applyFilters}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border transition-all relative rounded-xl ${
              hasChanges
                ? "border-brand-accent bg-brand-accent text-white hover:opacity-90 cursor-pointer"
                : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Apply
            {filterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-brand-accent px-1 text-[9px] font-bold text-white">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
