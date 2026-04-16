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
        className="lg:hidden w-full mb-3 rounded-none border border-[#ddd4c8] bg-white px-4 py-3 inline-flex items-center justify-between text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-800"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters {activeCount > 0 ? `(${activeCount})` : ""}
        </span>
        <span>{mobileOpen ? "Hide" : "Show"}</span>
      </button>

      <aside className={`${mobileOpen ? "block" : "hidden"} lg:block rounded-none border border-[#ddd4c8] bg-white p-4 sm:p-5 shadow-none`}>
        <div className="mb-6 pb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Filter Inventory</p>
          <h2 className="text-xl font-black tracking-tight text-slate-900 mt-1">Find Your Match</h2>
        </div>

        <form method="GET" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                placeholder="Prado, CX-5, X-Trail"
                className="w-full bg-[#fbfcfd] border border-[#e2e8f0] rounded-none pl-10 pr-3 py-3 text-[13px] font-bold text-slate-900 outline-none focus:border-[#0f172a]/35 focus:ring-4 focus:ring-[#0f172a]/5 transition-all placeholder:text-slate-400 focus:bg-white"
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
                  className="w-full left-0 right-0"
                />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Make</label>
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all"
            >
              <option value="">All Makes</option>
              {allMakes.map((m) => <option key={m.make} value={m.make}>{m.make}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Body Type</label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all"
              >
                <option value="">All Types</option>
                {Object.entries(bodyTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Fuel</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all"
              >
                <option value="">Any Fuel</option>
                {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all"
              >
                <option value="">Any Gearbox</option>
                {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">County</label>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all"
              >
                <option value="">Any County</option>
                {counties.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Price Range (KES)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all placeholder:text-slate-400"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full bg-white border border-[#e7e1d8] rounded-none px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none focus:border-[#ff5a2f]/35 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Lowest Price</option>
              <option value="price_desc">Highest Price</option>
              <option value="mileage_asc">Lowest Mileage</option>
              <option value="year_desc">Newest Year</option>
            </select>
          </div>

          <div className="pt-2 border-t border-[#efe8df] grid grid-cols-2 gap-2">
            <button
              type="submit"
              className="bg-[#111111] hover:bg-[#ff5a2f] text-slate-900 text-[11px] font-extrabold uppercase tracking-[0.12em] py-2.5 rounded-none transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 bg-white border border-[#e7e1d8] text-slate-700 hover:text-black text-[11px] font-extrabold uppercase tracking-[0.12em] py-2.5 rounded-none transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {hasFilters && (
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 text-center">
              {activeCount} active filter{activeCount === 1 ? "" : "s"}
            </p>
          )}
        </form>
      </aside>
    </div>
  );
}