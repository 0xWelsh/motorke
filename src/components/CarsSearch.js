"use client";
// src/components/CarsSearch.js
// Filter sidebar only — keyword search lives in CarsInventorySearch.

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, SlidersHorizontal } from "lucide-react";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";
import { CARS_SORT_OPTIONS, normalizeCarsSort } from "@/lib/cars-inventory-sort";

export default function CarsSearch({
  currentSearch = "",
  currentModel = "",
  initialMake = "",
  initialSteering = "",
  initialMinYOM = "",
  initialMaxYOM = "",
  initialBodyType = "",
  initialFuelType = "",
  initialTransmission = "",
  initialCounty = "",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialSort = "newest",
  initialLat = "",
  initialLng = "",
  /** Keep non-default per-page when filters change (matches server default 14). */
  listPerPage = "",
  allMakes = [],
  bodyTypeLabels = {},
  counties = [],
}) {
  const RECENT_CAR_SEARCHES_KEY = "motorke:recent-car-searches";
  const [make, setMake] = useState(initialMake);
  const [steering, setSteering] = useState(initialSteering || "");
  const [minYOM, setMinYOM] = useState(initialMinYOM != null ? String(initialMinYOM) : "");
  const [maxYOM, setMaxYOM] = useState(initialMaxYOM != null ? String(initialMaxYOM) : "");
  const [bodyType, setBodyType] = useState(initialBodyType);
  const [fuelType, setFuelType] = useState(initialFuelType);
  const [transmission, setTransmission] = useState(initialTransmission);
  const [county, setCounty] = useState(initialCounty);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(() => normalizeCarsSort(initialSort));
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMake(initialMake);
    setSteering(initialSteering || "");
    setMinYOM(initialMinYOM != null ? String(initialMinYOM) : "");
    setMaxYOM(initialMaxYOM != null ? String(initialMaxYOM) : "");
    setBodyType(initialBodyType);
    setFuelType(initialFuelType);
    setTransmission(initialTransmission);
    setCounty(initialCounty);
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
    setSort(normalizeCarsSort(initialSort));
  }, [
    initialMake,
    initialSteering,
    initialMinYOM,
    initialMaxYOM,
    initialBodyType,
    initialFuelType,
    initialTransmission,
    initialCounty,
    initialMinPrice,
    initialMaxPrice,
    initialSort,
  ]);

  function buildParams(next = {}) {
    const finalState = {
      search: currentSearch?.trim() || "",
      make,
      model: currentModel,
      bodyType,
      fuelType,
      transmission,
      county,
      minPrice,
      maxPrice,
      sort,
      lat: initialLat,
      lng: initialLng,
      ...next,
    };

    const params = new URLSearchParams();
    if (finalState.search?.trim()) params.set("search", finalState.search.trim());
    if (finalState.make) params.set("make", finalState.make);
    if (finalState.model?.trim()) params.set("model", finalState.model.trim());
    if (finalState.steering) params.set("steering", finalState.steering);
    if (finalState.minYOM) params.set("minYOM", finalState.minYOM);
    if (finalState.maxYOM) params.set("maxYOM", finalState.maxYOM);
    if (finalState.bodyType) params.set("bodyType", finalState.bodyType);
    if (finalState.fuelType) params.set("fuelType", finalState.fuelType);
    if (finalState.transmission) params.set("transmission", finalState.transmission);
    if (finalState.county) params.set("county", finalState.county);
    if (finalState.minPrice) params.set("minPrice", finalState.minPrice);
    if (finalState.maxPrice) params.set("maxPrice", finalState.maxPrice);
    if (finalState.sort && finalState.sort !== "newest") params.set("sort", finalState.sort);
    if (finalState.lat) params.set("lat", finalState.lat);
    if (finalState.lng) params.set("lng", finalState.lng);
    const pp = finalState.listPerPage != null ? String(finalState.listPerPage) : String(listPerPage || "");
    if (pp && pp !== "14") params.set("perPage", pp);
    params.delete("page");
    return params;
  }

  function pushWith(next = {}) {
    const params = buildParams(next);
    const query = params.toString();
    const nextState = {
      search: currentSearch?.trim() || "",
      make,
      model: currentModel,
      bodyType,
      fuelType,
      transmission,
      county,
      minPrice,
      maxPrice,
      sort,
      ...next,
    };
    const hasMeaningfulFilter = Boolean(
      nextState.search ||
        nextState.make ||
        (typeof nextState.model === "string" && nextState.model.trim()) ||
        nextState.bodyType ||
        nextState.fuelType ||
        nextState.transmission ||
        nextState.county ||
        nextState.minPrice ||
        nextState.maxPrice ||
        (nextState.sort && nextState.sort !== "newest")
    );
    if (hasMeaningfulFilter && typeof window !== "undefined") {
      try {
        const prev = JSON.parse(window.localStorage.getItem(RECENT_CAR_SEARCHES_KEY) || "[]");
        const labelParts = [
          nextState.search || null,
          nextState.make || null,
          nextState.bodyType || null,
          nextState.fuelType || null,
          nextState.maxPrice ? `<= ${Number(nextState.maxPrice).toLocaleString()}` : null,
        ].filter(Boolean);
        const label = labelParts.join(", ") || "Custom cars search";
        const entry = { label, query, createdAt: Date.now() };
        const deduped = [entry, ...prev.filter((item) => item.query !== query)].slice(0, 6);
        window.localStorage.setItem(RECENT_CAR_SEARCHES_KEY, JSON.stringify(deduped));
      } catch {
        // ignore
      }
    }
    setMobileOpen(false);
    router.push(query ? `/cars?${query}` : "/cars");
  }

  function handleSubmit(e) {
    e.preventDefault();
    pushWith();
  }

  function clearFilters() {
    setMake("");
    setSteering("");
    setMinYOM("");
    setMaxYOM("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    setCounty("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    const params = new URLSearchParams();
    if (currentSearch?.trim()) params.set("search", currentSearch.trim());
    if (initialLat) params.set("lat", initialLat);
    if (initialLng) params.set("lng", initialLng);
    if (listPerPage && String(listPerPage) !== "14") params.set("perPage", String(listPerPage));
    const q = params.toString();
    router.push(q ? `/cars?${q}` : "/cars");
  }

  const filterOnlyCount = [
    make,
    bodyType,
    fuelType,
    transmission,
    county,
    minPrice,
    maxPrice,
    sort !== "newest" ? "sort" : "",
    initialLat && initialLng ? "loc" : "",
    steering,
    minYOM,
    maxYOM,
    currentModel,
  ].filter(Boolean).length;

  const hasFilters =
    make ||
    bodyType ||
    fuelType ||
    transmission ||
    county ||
    minPrice ||
    maxPrice ||
    sort !== "newest" ||
    steering ||
    minYOM ||
    maxYOM ||
    currentModel;

  const bodyEntries = Object.entries(bodyTypeLabels || {});

  return (
    <div className="w-full">
      <div className="sticky top-16 z-40 -mx-2.5 px-2.5 py-2 sm:-mx-0 sm:px-0 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm rounded-xl"
        >
          <span className="inline-flex w-full items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[var(--accent)]" />
              Filters {filterOnlyCount > 0 ? `(${filterOnlyCount})` : ""}
            </span>
            <span className="text-[10px] font-bold text-zinc-400">{mobileOpen ? "Hide" : "Show"}</span>
          </span>
        </button>
      </div>

      <aside className={`${mobileOpen ? "block" : "hidden"} lg:block lg:mt-0`}>
        <div className="mb-3 hidden border-b border-white/[0.06] pb-3 lg:block">
          <p className="mb-0.5 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--accent)]">Refine</p>
          <h2 className="text-base font-black uppercase tracking-tight text-white">Filters</h2>
        </div>

        <form method="GET" onSubmit={handleSubmit} className="space-y-6">
          {/* Budget */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Budget Range</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "≤1.3M", min: 0, max: 1300000 },
                { label: "1.3–2.6M", min: 1300000, max: 2600000 },
                { label: "2.6–3.9M", min: 2600000, max: 3900000 },
                { label: "3.9–6.5M", min: 3900000, max: 6500000 },
                { label: "6.5–9.8M", min: 6500000, max: 9750000 },
                { label: "9.8–13M", min: 9750000, max: 13000000 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => {
                    const min = String(btn.min);
                    const max = String(btn.max);
                    setMinPrice(min);
                    setMaxPrice(max);
                    pushWith({ minPrice: min, maxPrice: max });
                  }}
                  className={`border py-2.5 text-[10px] font-bold uppercase tracking-tight transition-all active:scale-[0.98] ${
                    String(minPrice) === String(btn.min) && String(maxPrice) === String(btn.max)
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                      : "border-white/[0.06] bg-[#0f0f0f] text-zinc-300 hover:border-[var(--accent)] rounded-xl"
                  }`}
                  style={{ borderRadius: "10px" }}
                >
                  {btn.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMinPrice("13000000");
                  setMaxPrice("");
                  pushWith({ minPrice: "13000000", maxPrice: "" });
                }}
                className={`border py-2.5 text-[10px] font-bold uppercase tracking-tight transition-all ${
                  minPrice === "13000000" && !maxPrice
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                    : "border-white/[0.06] bg-[#0f0f0f] text-zinc-300 hover:border-[var(--accent)] rounded-xl"
                }`}
                style={{ borderRadius: "10px" }}
              >
                13M+
              </button>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sort Priority</label>
            <select
              value={sort}
              onChange={(e) => {
                const next = normalizeCarsSort(e.target.value);
                setSort(next);
                pushWith({ sort: next });
              }}
              className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)] transition-colors rounded-xl"
            >
              {CARS_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Core Specs */}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Body Type</label>
              <select
                value={bodyType}
                onChange={(e) => {
                  setBodyType(e.target.value);
                  pushWith({ bodyType: e.target.value });
                }}
                className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)] rounded-xl"
              >
                <option value="">Any type</option>
                {bodyEntries.map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Fuel Preference</label>
              <select
                value={fuelType}
                onChange={(e) => {
                  setFuelType(e.target.value);
                  pushWith({ fuelType: e.target.value });
                }}
                className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)] rounded-xl"
              >
                <option value="">Any fuel</option>
                {Object.entries(FUEL_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Gearbox</label>
              <select
                value={transmission}
                onChange={(e) => {
                  setTransmission(e.target.value);
                  pushWith({ transmission: e.target.value });
                }}
                className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)] rounded-xl"
              >
                <option value="">Any transmission</option>
                {Object.entries(TRANSMISSION_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & Brand */}
          <div className="space-y-4 pt-2 border-t border-white/[0.06]">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Location (County)</label>
              <select
                value={county}
                onChange={(e) => {
                  setCounty(e.target.value);
                  pushWith({ county: e.target.value });
                }}
                className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)] rounded-xl"
              >
                <option value="">All Kenya</option>
                {counties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Specific Brand</label>
              <select
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  pushWith({ make: e.target.value });
                }}
                className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)] rounded-xl"
              >
                <option value="">All brands</option>
                {allMakes.map((m) => (
                  <option key={m.make} value={m.make}>
                    {m.make}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drive & year */}
          <div className="space-y-4 pt-2 border-t border-white/[0.06]">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Steering Side</label>
              <div className="grid grid-cols-2 gap-2">
                {["LHD", "RHD"].map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => {
                      setSteering(side);
                      pushWith({ steering: side });
                    }}
                    className={`border py-2.5 text-[10px] font-bold uppercase tracking-tight transition-all ${
                      steering === side
                        ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                        : "border-white/[0.06] bg-[#0f0f0f] text-zinc-300"
                    }`}
                    style={{ borderRadius: "10px" }}
                  >
                    {side === "LHD" ? "Left" : "Right"} Hand
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Year of Manufacture</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min Year"
                  value={minYOM}
                  onChange={(e) => setMinYOM(e.target.value)}
                  onBlur={() => pushWith({ minYOM })}
                  className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)]"
                  style={{ borderRadius: "10px" }}
                />
                <input
                  type="number"
                  placeholder="Max Year"
                  value={maxYOM}
                  onChange={(e) => setMaxYOM(e.target.value)}
                  onBlur={() => pushWith({ maxYOM })}
                  className="w-full border border-white/[0.06] bg-[#0f0f0f] px-3 py-3 text-xs font-bold text-white outline-none focus:border-[var(--accent)]"
                  style={{ borderRadius: "10px" }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-white/[0.06]">
            <button
              type="submit"
              className="bg-[var(--accent)] py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl rounded-xl"
            >
              Apply Filter
            </button>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-400 transition-colors bg-white/[0.03] border border-transparent hover:border-red-900/30 rounded-xl"
              >
                <X className="h-3.5 w-3.5" /> Clear All Filters
              </button>
            ) : null}
          </div>
        </form>
      </aside>
    </div>
  );
}
