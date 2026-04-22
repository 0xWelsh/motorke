"use client";
// src/components/CarsSearch.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/utils";

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
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="lg:hidden w-full mb-6 border border-[#E2E8F0] dark:border-slate-800 bg-white dark:bg-[#111111] px-6 py-4 inline-flex items-center justify-between text-xs font-bold uppercase tracking-widest text-[#111827] dark:text-white"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <span className="inline-flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-[#38A169]" />
          Filter Inventory {activeCount > 0 ? `(${activeCount})` : ""}
        </span>
        <span className="text-[10px] text-[#718096]">{mobileOpen ? "Collapse" : "Expand"}</span>
      </button>

      <aside className={`${mobileOpen ? "block" : "hidden"} lg:block bg-white dark:bg-transparent space-y-8`}>
        <div className="mb-8 hidden lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#38A169] mb-3">Refine Results</p>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-white">Filters</h2>
        </div>

        <form method="GET" onSubmit={handleSubmit} className="space-y-8">
          {/* Keyword Search */}
          <div className="space-y-3 relative">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Keywords</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CBD5E0] dark:text-slate-600" />
              <input
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                placeholder="Search make or model..."
                className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 pl-12 pr-4 py-4 text-sm font-medium text-[#111827] dark:text-white outline-none focus:border-[#111827] dark:focus:border-white transition-all placeholder:text-[#A0AEC0] dark:placeholder:text-slate-600"
                style={{ borderRadius: 'var(--radius)' }}
              />

              {showSuggestions && (
                <SearchSuggestions
                  suggestions={suggestions}
                  loading={loadingSuggestions}
                  onSelect={(val) => {
                    setSearch(val);
                    setShowSuggestions(false);
                    pushWith({ search: val });
                  }}
                  onClose={() => setShowSuggestions(false)}
                  inputValue={search}
                  className="w-full left-0 right-0 z-50 mt-1"
                />
              )}
            </div>
          </div>

          {/* Select Filters */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Manufacturer</label>
              <select
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 px-4 py-4 text-sm font-medium text-[#111827] dark:text-white outline-none focus:border-[#111827] dark:focus:border-white transition-all appearance-none cursor-pointer"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value="" className="dark:bg-[#0a0a0a]">All Manufacturers</option>
                {allMakes.map((m) => <option key={m.make} value={m.make} className="dark:bg-[#0a0a0a]">{m.make}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Category</label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 px-4 py-4 text-sm font-medium text-[#111827] dark:text-white outline-none focus:border-[#111827] dark:focus:border-white transition-all appearance-none cursor-pointer"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value="" className="dark:bg-[#0a0a0a]">All Categories</option>
                {Object.entries(bodyTypeLabels).map(([v, l]) => <option key={v} value={v} className="dark:bg-[#0a0a0a]">{l}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 px-4 py-4 text-sm font-medium text-[#111827] dark:text-white outline-none focus:border-[#111827] dark:focus:border-white transition-all appearance-none cursor-pointer"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value="" className="dark:bg-[#0a0a0a]">Any Transmission</option>
                {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v} className="dark:bg-[#0a0a0a]">{l}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Location / County</label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 px-4 py-4 text-sm font-medium text-[#111827] dark:text-white outline-none focus:border-[#111827] dark:focus:border-white transition-all appearance-none cursor-pointer"
                style={{ borderRadius: 'var(--radius)' }}
              >
                <option value="" className="dark:bg-[#0a0a0a]">Across Kenya</option>
                {counties.map((c) => <option key={c} value={c} className="dark:bg-[#0a0a0a]">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Price Window (KES)</label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="From"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 px-4 py-4 text-sm font-medium text-[#111827] dark:text-white outline-none focus:border-[#111827] dark:focus:border-white transition-all placeholder:text-[#CBD5E0] dark:placeholder:text-slate-600"
                style={{ borderRadius: 'var(--radius)' }}
              />
              <input
                type="number"
                placeholder="To"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-[#F7FAFC] dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 px-4 py-4 text-sm font-medium text-[#111827] dark:text-white outline-none focus:border-[#111827] dark:focus:border-white transition-all placeholder:text-[#CBD5E0] dark:placeholder:text-slate-600"
                style={{ borderRadius: 'var(--radius)' }}
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