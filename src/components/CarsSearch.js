"use client";
// src/components/CarsSearch.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/constants";

export default function CarsSearch({ 
  initialSearch = "",
  initialMake = "",
  initialBodyType = "",
  initialFuelType = "",
  initialTransmission = "",
  initialCounty = "",
  initialMinPrice = "",
  initialMaxPrice = "",
  initialSort = "newest",
  allMakes = [],
  bodyTypeLabels = {},
  counties = []
}) {
  const [search, setSearch] = useState(initialSearch);
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState("");
  const [steering, setSteering] = useState("");
  const [minYOM, setMinYOM] = useState("");
  const [maxYOM, setMaxYOM] = useState("");
  const [bodyType, setBodyType] = useState(initialBodyType);
  const [fuelType, setFuelType] = useState(initialFuelType);
  const [transmission, setTransmission] = useState(initialTransmission);
  const [county, setCounty] = useState(initialCounty);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sort, setSort] = useState(initialSort);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const formRef = useRef(null);

  const { debouncedTerm } = useDebouncedSearch(search, 300);

  // Fetch suggestions when debounced term changes
  useEffect(() => {
    if (!debouncedTerm || debouncedTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const response = await fetch(`/api/search/suggestions?query=${encodeURIComponent(debouncedTerm)}`);
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(data.suggestions && data.suggestions.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedTerm]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (formRef.current && !formRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function buildParams(next = {}) {
    const finalState = {
      search,
      make,
      bodyType,
      fuelType,
      transmission,
      county,
      minPrice,
      maxPrice,
      sort,
      ...next,
    };

    const params = new URLSearchParams();
    if (finalState.search?.trim()) params.set("search", finalState.search.trim());
    if (finalState.make) params.set("make", finalState.make);
    if (finalState.model) params.set("model", finalState.model);
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

    return params;
  }

  function pushWith(next = {}) {
    const params = buildParams(next);
    const query = params.toString();
    setShowSuggestions(false);
    setMobileOpen(false); // Close mobile filters on push
    router.push(query ? `/cars?${query}` : "/cars");
  }

  function handleSubmit(e) {
    if (e) e.preventDefault();
    pushWith();
  }

  function clearFilters() {
    setSearch("");
    setMake("");
    setBodyType("");
    setFuelType("");
    setTransmission("");
    setCounty("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setShowSuggestions(false);
    router.push("/cars");
  }

  const hasFilters = search || make || bodyType || fuelType || transmission || county || minPrice || maxPrice || sort !== "newest";
  const activeCount = [search, make, bodyType, fuelType, transmission, county, minPrice, maxPrice, sort !== "newest" ? "sort" : ""].filter(Boolean).length;

  return (
    <div ref={formRef} className="w-full">
      <div className="lg:hidden sticky top-16 sm:top-20 z-40 -mx-6 px-6 py-4 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#EDF2F7] dark:border-slate-800 transition-all duration-300">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="w-full border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111111] px-6 py-4 inline-flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-white shadow-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <span className="inline-flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-[#38A169]" />
            Filter Inventory {activeCount > 0 ? `(${activeCount})` : ""}
          </span>
          <span className="text-[10px] text-[#718096]">{mobileOpen ? "Collapse" : "Expand"}</span>
        </button>
      </div>

      <aside className={`${mobileOpen ? "block" : "hidden"} lg:block bg-white dark:bg-transparent space-y-8 mt-8 lg:mt-0`}>
        <div className="mb-10 hidden lg:block border-b border-slate-100 dark:border-zinc-900 pb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#38A169] mb-2">Inventory</p>
          <h2 className="text-xl font-black tracking-tighter text-[#111827] dark:text-white uppercase italic">Refine Results</h2>
        </div>

        <form method="GET" onSubmit={handleSubmit} className="space-y-8">
          {/* Keyword Search */}
          <div className="space-y-3 relative">
            <input
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
              placeholder="Search by vehicle name"
              className="w-full bg-[#FAFAFA] dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-6 py-4 text-xs font-bold text-[#111827] dark:text-white outline-none focus:border-[#38A169] transition-all placeholder:text-[#A0AEC0] dark:placeholder:text-slate-600"
              style={{ borderRadius: '2px' }}
            />
          </div>

          {/* Filter by Budget Buttons */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter by budget</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "$0 - $10K", min: 0, max: 1300000 },
                { label: "$10K - $20K", min: 1300000, max: 2600000 },
                { label: "$20K - $30K", min: 2600000, max: 3900000 },
                { label: "$30K - $50K", min: 3900000, max: 6500000 },
                { label: "$50K - $75K", min: 6500000, max: 9750000 },
                { label: "$75K - $100K", min: 9750000, max: 13000000 },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => {
                    setMinPrice(btn.min);
                    setMaxPrice(btn.max);
                    pushWith({ minPrice: btn.min, maxPrice: btn.max });
                  }}
                  className={`py-3.5 border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                    minPrice === btn.min && maxPrice === btn.max
                      ? "bg-[#38A169] border-[#38A169] text-white"
                      : "border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-300 hover:border-[#38A169]"
                  }`}
                  style={{ borderRadius: '2px' }}
                >
                  {btn.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMinPrice(13000000);
                  setMaxPrice("");
                  pushWith({ minPrice: 13000000, maxPrice: "" });
                }}
                className={`col-span-1 py-3.5 border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  minPrice === 13000000 && !maxPrice
                    ? "bg-[#38A169] border-[#38A169] text-white"
                    : "border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-300 hover:border-[#38A169]"
                }`}
                style={{ borderRadius: '2px' }}
              >
                Above $100K
              </button>
            </div>
          </div>

          {/* Brand & Model Selects - Consolidated Style */}
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Brand & Model</label>
              <select
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-4 py-3.5 text-xs font-bold text-[#111827] dark:text-white outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer"
                style={{ borderRadius: '2px' }}
              >
                <option value="" className="dark:bg-[#0a0a0a]">Vehicle Brand</option>
                {allMakes.map((m) => <option key={m.make} value={m.make} className="dark:bg-[#0a0a0a]">{m.make}</option>)}
              </select>
            </div>

            <select
              disabled={!make}
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                pushWith({ model: e.target.value });
              }}
              className="w-full bg-[#FAFAFA] dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-4 py-3.5 text-xs font-bold text-[#111827] dark:text-white outline-none focus:border-[#38A169] transition-all appearance-none cursor-pointer disabled:opacity-50"
              style={{ borderRadius: '2px' }}
            >
              <option value="">Brand Model</option>
              {/* This would ideally fetch models for the make, but for now we'll allow it as a generic select or just a placeholder */}
            </select>
          </div>

          {/* Drive Type Toggles */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drive Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSteering("LHD");
                  pushWith({ steering: "LHD" });
                }}
                className={`py-3.5 border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  steering === "LHD"
                    ? "bg-[#38A169] border-[#38A169] text-white"
                    : "border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-300 hover:border-[#38A169]"
                }`}
                style={{ borderRadius: '2px' }}
              >
                Left Hand Drive
              </button>
              <button
                type="button"
                onClick={() => {
                  setSteering("RHD");
                  pushWith({ steering: "RHD" });
                }}
                className={`py-3.5 border text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  steering === "RHD"
                    ? "bg-[#38A169] border-[#38A169] text-white"
                    : "border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-slate-300 hover:border-[#38A169]"
                }`}
                style={{ borderRadius: '2px' }}
              >
                Right Hand Drive
              </button>
            </div>
          </div>

          {/* Year of Manufacture */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Year of Manufacture</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min YOM"
                value={minYOM}
                onChange={(e) => setMinYOM(e.target.value)}
                onBlur={() => pushWith({ minYOM })}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-4 py-3.5 text-xs font-bold text-[#111827] dark:text-white outline-none focus:border-[#38A169] transition-all placeholder:text-[#CBD5E0] dark:placeholder:text-slate-600"
                style={{ borderRadius: '2px' }}
              />
              <input
                type="number"
                placeholder="Max YOM"
                value={maxYOM}
                onChange={(e) => setMaxYOM(e.target.value)}
                onBlur={() => pushWith({ maxYOM })}
                className="w-full bg-[#FAFAFA] dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 px-4 py-3.5 text-xs font-bold text-[#111827] dark:text-white outline-none focus:border-[#38A169] transition-all placeholder:text-[#CBD5E0] dark:placeholder:text-slate-600"
                style={{ borderRadius: '2px' }}
              />
            </div>
          </div>


          {/* Actions */}
          <div className="pt-8 border-t border-[#EDF2F7] dark:border-slate-800 flex flex-col gap-4">
            <button
              type="submit"
              className="bg-[#111827] text-white dark:bg-white dark:!text-black text-[10px] font-bold uppercase tracking-widest py-4 transition-transform hover:scale-[0.98] active:scale-95"
              style={{ borderRadius: 'var(--radius)' }}
            >
              Apply Selection
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 text-[#718096] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white text-[10px] font-bold uppercase tracking-widest py-2 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}