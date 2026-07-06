"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, Search, RotateCcw } from "lucide-react";
import { FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, VEHICLE_TYPE_LABELS } from "@/lib/constants";

const PRICE_PRESETS = [
  { label: "Under 1M", minPrice: 0, maxPrice: 1000000 },
  { label: "1M–2M", minPrice: 1000000, maxPrice: 2000000 },
  { label: "2M–3M", minPrice: 2000000, maxPrice: 3000000 },
  { label: "3M–5M", minPrice: 3000000, maxPrice: 5000000 },
  { label: "Above 5M", minPrice: 5000000, maxPrice: 0 },
];

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
        active
          ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent"
          : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
      }`}
    >
      {label}
    </button>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">
        {title}
      </p>
      {children}
    </div>
  );
}

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

const asStr = (v) => (v != null && v !== "" ? String(v) : "");

export default function CarsSidebarFilters({ activeFilters, allMakes = [], bodyTypeLabels = {}, counties = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [make, setMake] = useState(asStr(activeFilters.make));
  const [model, setModel] = useState(asStr(activeFilters.model));
  const [bodyType, setBodyType] = useState(asStr(activeFilters.bodyType));
  const [fuelType, setFuelType] = useState(asStr(activeFilters.fuelType));
  const [transmission, setTransmission] = useState(asStr(activeFilters.transmission));
  const [steering, setSteering] = useState(asStr(activeFilters.steering));
  const [vehicleType, setVehicleType] = useState(asStr(activeFilters.vehicleType));
  const [condition, setCondition] = useState(asStr(activeFilters.condition));
  const [county, setCounty] = useState(asStr(activeFilters.county));
  const [pricePreset, setPricePreset] = useState(null);
  const [minPrice, setMinPrice] = useState(asStr(activeFilters.minPrice));
  const [maxPrice, setMaxPrice] = useState(asStr(activeFilters.maxPrice));
  const [minYOM, setMinYOM] = useState(asStr(activeFilters.minYOM));
  const [maxYOM, setMaxYOM] = useState(asStr(activeFilters.maxYOM));

  const toggleValue = useCallback((setter, value) => {
    setter((prev) => (prev === value ? "" : value));
  }, []);

  const selectPricePreset = useCallback((idx) => {
    setPricePreset(idx);
    setMinPrice("");
    setMaxPrice("");
  }, []);

  const hasChanges =
    make !== asStr(activeFilters.make) ||
    model !== asStr(activeFilters.model) ||
    bodyType !== asStr(activeFilters.bodyType) ||
    fuelType !== asStr(activeFilters.fuelType) ||
    transmission !== asStr(activeFilters.transmission) ||
    steering !== asStr(activeFilters.steering) ||
    vehicleType !== asStr(activeFilters.vehicleType) ||
    condition !== asStr(activeFilters.condition) ||
    county !== asStr(activeFilters.county) ||
    minPrice !== asStr(activeFilters.minPrice) ||
    maxPrice !== asStr(activeFilters.maxPrice) ||
    minYOM !== asStr(activeFilters.minYOM) ||
    maxYOM !== asStr(activeFilters.maxYOM) ||
    pricePreset !== null;

  const applyFilters = useCallback(() => {
    const updates = {};

    if (make) updates.make = make;
    if (model) updates.model = model;
    if (bodyType) updates.bodyType = bodyType;
    if (fuelType) updates.fuelType = fuelType;
    if (transmission) updates.transmission = transmission;
    if (steering) updates.steering = steering;
    if (vehicleType) updates.vehicleType = vehicleType;
    if (condition) updates.condition = condition;
    if (county) updates.county = county;

    if (pricePreset !== null) {
      const preset = PRICE_PRESETS[pricePreset];
      if (preset.minPrice > 0) updates.minPrice = String(preset.minPrice);
      if (preset.maxPrice > 0) updates.maxPrice = String(preset.maxPrice);
    } else {
      if (minPrice) updates.minPrice = minPrice;
      if (maxPrice) updates.maxPrice = maxPrice;
    }

    if (minYOM) updates.minYOM = minYOM;
    if (maxYOM) updates.maxYOM = maxYOM;

    const url = buildUrl(searchParams, updates);
    router.push(url);
    setMobileOpen(false);
  }, [make, model, bodyType, fuelType, transmission, steering, vehicleType, condition, county, pricePreset, minPrice, maxPrice, minYOM, maxYOM, searchParams, router]);

  const resetFilters = useCallback(() => {
    setMake("");
    setModel("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    setSteering("");
    setVehicleType("");
    setCondition("");
    setCounty("");
    setPricePreset(null);
    setMinPrice("");
    setMaxPrice("");
    setMinYOM("");
    setMaxYOM("");
  }, []);

  const hasAnySelection = make || model || bodyType || fuelType || transmission || steering || vehicleType || condition || county || minPrice || maxPrice || minYOM || maxYOM || pricePreset !== null;

  const sidebarContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
          Filters
        </h3>
        {hasAnySelection && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] divide-y divide-slate-100 dark:divide-slate-800/50">
        <div className="py-2 space-y-2">
          <FilterSection title="Make">
            <div className="max-h-[180px] overflow-y-auto space-y-0.5">
              <ToggleChip
                label="All Makes"
                active={!make}
                onClick={() => setMake("")}
              />
              {allMakes.map((m) => (
                <ToggleChip
                  key={m.make}
                  label={m.make}
                  active={make === m.make}
                  onClick={() => toggleValue(setMake, m.make)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Model">
            <input
              type="text"
              value={model}
              placeholder="e.g. Corolla"
              onChange={(e) => setModel(e.target.value)}
              className="w-full mx-2.5 px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              style={{ width: "calc(100% - 20px)" }}
            />
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Body Type">
            <div className="max-h-[160px] overflow-y-auto space-y-0.5">
              <ToggleChip
                label="All Types"
                active={!bodyType}
                onClick={() => setBodyType("")}
              />
              {Object.entries(bodyTypeLabels).map(([value, label]) => (
                <ToggleChip
                  key={value}
                  label={label}
                  active={bodyType === value}
                  onClick={() => toggleValue(setBodyType, value)}
                />
              ))}
            </div>
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Fuel">
            {Object.entries(FUEL_LABELS).map(([value, label]) => (
              <ToggleChip
                key={value}
                label={label}
                active={fuelType === value}
                onClick={() => toggleValue(setFuelType, value)}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Transmission">
            {Object.entries(TRANSMISSION_LABELS).map(([value, label]) => (
              <ToggleChip
                key={value}
                label={label}
                active={transmission === value}
                onClick={() => toggleValue(setTransmission, value)}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Steering">
            {Object.entries(STEERING_LABELS).map(([value, label]) => (
              <ToggleChip
                key={value}
                label={label}
                active={steering === value}
                onClick={() => toggleValue(setSteering, value)}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Type">
            {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
              <ToggleChip
                key={value}
                label={label}
                active={vehicleType === value}
                onClick={() => toggleValue(setVehicleType, value)}
              />
            ))}
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Condition">
            <ToggleChip
              label="Used"
              active={condition === "USED"}
              onClick={() => toggleValue(setCondition, "USED")}
            />
            <ToggleChip
              label="New"
              active={condition === "NEW"}
              onClick={() => toggleValue(setCondition, "NEW")}
            />
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Price (KSh)">
            <div className="flex flex-wrap gap-1.5 px-2.5 pb-2">
              {PRICE_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  onClick={() => selectPricePreset(i)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    pricePreset === i
                      ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                      : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 px-2.5">
              <input
                type="number"
                value={minPrice}
                placeholder="Min"
                onChange={(e) => { setMinPrice(e.target.value); setPricePreset(null); }}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
              <span className="text-[9px] text-slate-400 dark:text-zinc-400 shrink-0">—</span>
              <input
                type="number"
                value={maxPrice}
                placeholder="Max"
                onChange={(e) => { setMaxPrice(e.target.value); setPricePreset(null); }}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="Year">
            <div className="flex items-center gap-1.5 px-2.5">
              <input
                type="number"
                value={minYOM}
                placeholder="From"
                onChange={(e) => setMinYOM(e.target.value)}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
              <span className="text-[9px] text-slate-400 dark:text-zinc-400 shrink-0">—</span>
              <input
                type="number"
                value={maxYOM}
                placeholder="To"
                onChange={(e) => setMaxYOM(e.target.value)}
                className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </FilterSection>
        </div>

        <div className="py-2 space-y-2">
          <FilterSection title="County">
            <div className="max-h-[140px] overflow-y-auto space-y-0.5">
              <ToggleChip
                label="All Counties"
                active={!county}
                onClick={() => setCounty("")}
              />
              {counties.map((c) => (
                <ToggleChip
                  key={c}
                  label={c}
                  active={county === c}
                  onClick={() => toggleValue(setCounty, c)}
                />
              ))}
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Apply button */}
      <button
        type="button"
        onClick={applyFilters}
        disabled={!hasChanges}
        className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border transition-all ${
          hasChanges
            ? "border-brand-accent bg-brand-accent text-white hover:opacity-90 cursor-pointer"
            : "border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
        }`}
      >
        <Search className="w-3.5 h-3.5" aria-hidden />
        Apply Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => { setMobileOpen(true); }}
          className="inline-flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111] text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasAnySelection && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
          )}
        </button>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-white dark:bg-[#0a0a0a] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filters</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        {sidebarContent}
      </div>
    </>
  );
}
