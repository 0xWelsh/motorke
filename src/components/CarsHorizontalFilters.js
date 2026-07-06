"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, SlidersHorizontal, Search, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, VEHICLE_TYPE_LABELS } from "@/lib/constants";

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

function SelectFilter({ label, value, onChange, options, allLabel }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[11px] font-semibold bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white px-2 py-1.5 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-brand-accent cursor-pointer"
        style={{ borderRadius: "4px", backgroundImage: "none" }}
      >
        <option value="">{allLabel || "All"}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function CarsHorizontalFilters({ activeFilters, allMakes = [], bodyTypeLabels = {}, counties = [] }) {
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

    router.push(buildUrl(searchParams, updates));
    setMobileOpen(false);
  }, [make, model, bodyType, fuelType, transmission, steering, vehicleType, condition, county, pricePreset, minPrice, maxPrice, minYOM, maxYOM, searchParams, router]);

  const resetFilters = useCallback(() => {
    setMake(""); setModel(""); setBodyType(""); setFuelType("");
    setTransmission(""); setSteering(""); setVehicleType(""); setCondition("");
    setCounty(""); setPricePreset(null); setMinPrice(""); setMaxPrice("");
    setMinYOM(""); setMaxYOM("");
  }, []);

  const hasAnySelection = make || model || bodyType || fuelType || transmission || steering || vehicleType || condition || county || minPrice || maxPrice || minYOM || maxYOM || pricePreset !== null;

  /* ── Mobile drawer content (same toggle-chip style as old sidebar) ── */
  function toggleValue(setter, value) {
    setter((prev) => (prev === value ? "" : value));
  }

  const mobileContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Filters</h3>
        {hasAnySelection && (
          <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111] divide-y divide-slate-100 dark:divide-slate-800/50">
        {/* Make */}
        <div className="py-2 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">Make</p>
          <div className="max-h-[150px] overflow-y-auto space-y-0.5">
            <button onClick={() => setMake("")} className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${!make ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent" : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>All Makes</button>
            {allMakes.map((m) => (
              <button key={m.make} onClick={() => toggleValue(setMake, m.make)} className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${make === m.make ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent" : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>{m.make}</button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="py-2 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">Model</p>
          <input type="text" value={model} placeholder="e.g. Corolla" onChange={(e) => setModel(e.target.value)} className="mx-2.5 px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors" style={{ width: "calc(100% - 20px)" }} />
        </div>

        {/* Body Type, Fuel, Trans, Steering, Type, Condition */}
        {[
          { title: "Body Type", value: bodyType, setter: setBodyType, options: Object.entries(bodyTypeLabels) },
          { title: "Fuel", value: fuelType, setter: setFuelType, options: Object.entries(FUEL_LABELS) },
          { title: "Transmission", value: transmission, setter: setTransmission, options: Object.entries(TRANSMISSION_LABELS) },
          { title: "Steering", value: steering, setter: setSteering, options: Object.entries(STEERING_LABELS) },
          { title: "Type", value: vehicleType, setter: setVehicleType, options: Object.entries(VEHICLE_TYPE_LABELS) },
        ].map((section) => (
          <div key={section.title} className="py-2 space-y-1">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">{section.title}</p>
            {section.options.map(([value, label]) => (
              <button key={value} onClick={() => toggleValue(section.setter, value)} className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${section.value === value ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent" : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>{label}</button>
            ))}
          </div>
        ))}

        {/* Condition */}
        <div className="py-2 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">Condition</p>
          {["USED", "NEW"].map((c) => (
            <button key={c} onClick={() => toggleValue(setCondition, c)} className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${condition === c ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent" : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>{c === "NEW" ? "New" : "Used"}</button>
          ))}
        </div>

        {/* Price */}
        <div className="py-2 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">Price (KSh)</p>
          <div className="flex flex-wrap gap-1.5 px-2.5 pb-2">
            {PRICE_PRESETS.map((preset, i) => (
              <button key={i} onClick={() => { setPricePreset(i); setMinPrice(""); setMaxPrice(""); }} className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${pricePreset === i ? "border-brand-accent bg-brand-accent/10 text-brand-accent" : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"}`}>{preset.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 px-2.5">
            <input type="number" value={minPrice} placeholder="Min" onChange={(e) => { setMinPrice(e.target.value); setPricePreset(null); }} className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors" />
            <span className="text-[9px] text-slate-400 dark:text-zinc-400 shrink-0">—</span>
            <input type="number" value={maxPrice} placeholder="Max" onChange={(e) => { setMaxPrice(e.target.value); setPricePreset(null); }} className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors" />
          </div>
        </div>

        {/* Year */}
        <div className="py-2 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">Year</p>
          <div className="flex items-center gap-1.5 px-2.5">
            <input type="number" value={minYOM} placeholder="From" onChange={(e) => setMinYOM(e.target.value)} className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors" />
            <span className="text-[9px] text-slate-400 dark:text-zinc-400 shrink-0">—</span>
            <input type="number" value={maxYOM} placeholder="To" onChange={(e) => setMaxYOM(e.target.value)} className="w-full px-2 py-1.5 text-[11px] bg-transparent border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-brand-accent transition-colors" />
          </div>
        </div>

        {/* County */}
        <div className="py-2 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-400 px-2.5">County</p>
          <div className="max-h-[140px] overflow-y-auto space-y-0.5">
            <button onClick={() => setCounty("")} className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${!county ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent" : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>All Counties</button>
            {counties.map((c) => (
              <button key={c} onClick={() => toggleValue(setCounty, c)} className={`w-full text-left px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${county === c ? "bg-brand-accent/10 text-brand-accent border-l-2 border-brand-accent" : "text-slate-600 dark:text-zinc-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50"}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" onClick={applyFilters} disabled={!hasChanges} className={`w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider border transition-all ${hasChanges ? "border-brand-accent bg-brand-accent text-white hover:opacity-90 cursor-pointer" : "border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-400 dark:text-zinc-500 cursor-not-allowed"}`}>
        <Search className="w-3.5 h-3.5" aria-hidden />
        Apply Filters
      </button>
    </div>
  );

  /* ── Desktop horizontal bar ── */
  const makeOptions = allMakes.map((m) => ({ value: m.make, label: m.make }));
  const bodyOptions = Object.entries(bodyTypeLabels).map(([v, l]) => ({ value: v, label: l }));
  const fuelOptions = Object.entries(FUEL_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const transOptions = Object.entries(TRANSMISSION_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const steerOptions = Object.entries(STEERING_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const typeOptions = Object.entries(VEHICLE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));
  const countyOptions = counties.map((c) => ({ value: c, label: c }));

  return (
    <>
      {/* Mobile filter strip */}
      <div className="lg:hidden bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 p-3 space-y-2.5">
        {/* Row 1: Brand chips */}
        <div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            {allMakes.map((m) => (
              <button
                key={m.make}
                onClick={() => toggleValue(setMake, m.make)}
                className={`shrink-0 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  make === m.make
                    ? "border-brand-accent bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/30"
                    : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
                style={{ borderRadius: "4px" }}
              >
                {m.make}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Price presets + Transmission + More trigger */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">Price</span>
          {PRICE_PRESETS.slice(0, 4).map((preset, i) => (
            <button
              key={i}
              onClick={() => { setPricePreset(i); setMinPrice(""); setMaxPrice(""); }}
              className={`shrink-0 px-2 py-1 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                pricePreset === i
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
              style={{ borderRadius: "4px" }}
            >
              {preset.label}
            </button>
          ))}
          <span className="w-px h-4 bg-slate-200 dark:bg-zinc-700 shrink-0" />
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 shrink-0">Trans</span>
          {["AUTO", "MANUAL"].map((t) => (
            <button
              key={t}
              onClick={() => toggleValue(setTransmission, t)}
              className={`shrink-0 px-2 py-1 text-[9px] font-bold uppercase tracking-wider border transition-all ${
                transmission === t
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              }`}
              style={{ borderRadius: "4px" }}
            >
              {t === "AUTO" ? "Auto" : "Manual"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border border-slate-300 dark:border-zinc-600 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
            style={{ borderRadius: "4px" }}
          >
            More <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Row 3: Apply + Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={applyFilters}
            disabled={!hasChanges}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all ${
              hasChanges
                ? "border-brand-accent bg-brand-accent text-white hover:opacity-90 cursor-pointer"
                : "border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
            }`}
            style={{ borderRadius: "4px" }}
          >
            <Search className="w-3 h-3" />
            Apply Filters
          </button>
          {hasAnySelection && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-600 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
              style={{ borderRadius: "4px" }}
            >
              <RotateCcw className="w-2.5 h-2.5" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85vw] max-w-sm bg-white dark:bg-[#0a0a0a] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white dark:bg-[#0a0a0a] border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">All Filters</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-4 py-3">{mobileContent}</div>
          </div>
        </div>
      )}

      {/* Desktop horizontal bar */}
      <div className="hidden lg:block bg-white dark:bg-[#111] border border-slate-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <SelectFilter label="Make" value={make} onChange={setMake} options={makeOptions} allLabel="All Makes" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 shrink-0">Model</span>
            <input
              type="text"
              value={model}
              placeholder="e.g. Corolla"
              onChange={(e) => setModel(e.target.value)}
              className="w-28 px-2 py-1.5 text-[11px] font-semibold border border-slate-200 dark:border-zinc-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-accent"
              style={{ borderRadius: "4px" }}
            />
          </div>
          <SelectFilter label="Body" value={bodyType} onChange={setBodyType} options={bodyOptions} />
          <SelectFilter label="Fuel" value={fuelType} onChange={setFuelType} options={fuelOptions} />
          <SelectFilter label="Trans" value={transmission} onChange={setTransmission} options={transOptions} />
          <SelectFilter label="Steer" value={steering} onChange={setSteering} options={steerOptions} />
          <SelectFilter label="Type" value={vehicleType} onChange={setVehicleType} options={typeOptions} />
          <SelectFilter label="County" value={county} onChange={setCounty} options={countyOptions} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 shrink-0">Price</span>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => { setPricePreset(i); setMinPrice(""); setMaxPrice(""); }}
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
          <div className="flex items-center gap-1">
            <input type="number" value={minPrice} placeholder="Min" onChange={(e) => { setMinPrice(e.target.value); setPricePreset(null); }} className="w-20 px-2 py-1 text-[11px] border border-slate-200 dark:border-zinc-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-accent" style={{ borderRadius: "4px" }} />
            <span className="text-slate-400 dark:text-zinc-500 text-[11px]">—</span>
            <input type="number" value={maxPrice} placeholder="Max" onChange={(e) => { setMaxPrice(e.target.value); setPricePreset(null); }} className="w-20 px-2 py-1 text-[11px] border border-slate-200 dark:border-zinc-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-accent" style={{ borderRadius: "4px" }} />
          </div>

          <span className="w-px h-6 bg-slate-200 dark:bg-zinc-700 mx-1" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 shrink-0">Year</span>
            <input type="number" value={minYOM} placeholder="From" onChange={(e) => setMinYOM(e.target.value)} className="w-16 px-2 py-1 text-[11px] border border-slate-200 dark:border-zinc-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-accent" style={{ borderRadius: "4px" }} />
            <span className="text-slate-400 dark:text-zinc-500 text-[11px]">—</span>
            <input type="number" value={maxYOM} placeholder="To" onChange={(e) => setMaxYOM(e.target.value)} className="w-16 px-2 py-1 text-[11px] border border-slate-200 dark:border-zinc-700 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-accent" style={{ borderRadius: "4px" }} />
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              {["NEW", "USED"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition((prev) => (prev === c ? "" : c))}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    condition === c
                      ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                      : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {c === "NEW" ? "New" : "Used"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAnySelection && (
              <button onClick={resetFilters} className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-slate-300 dark:border-zinc-600 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
            <button
              onClick={applyFilters}
              disabled={!hasChanges}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider border transition-all ${
                hasChanges
                  ? "border-brand-accent bg-brand-accent text-white hover:opacity-90 cursor-pointer"
                  : "border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-[#111]/80 text-slate-400 dark:text-zinc-500 cursor-not-allowed"
              }`}
            >
              <Search className="w-3.5 h-3.5" aria-hidden />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
