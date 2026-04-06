"use client";
// src/components/CarsSearch.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronDown, SlidersHorizontal } from "lucide-react";
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
  const [showMore, setShowMore] = useState(false);
  
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
    router.push("/cars");
  }

  const hasFilters = search || make || bodyType || fuelType || transmission || county || minPrice || maxPrice || sort !== "newest";

  return (
    <div className="sticky top-[72px] z-30 bg-[#f5f3ef]/90 backdrop-blur-xl border-b border-[#e7e1d8] py-4">
      <div className="container mx-auto px-6 max-w-7xl">
        <div ref={formRef} className="relative">
          <form method="GET" onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Search */}
              <div className="relative flex-1 min-w-[240px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors" />
                <input 
                  name="search" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search cars, e.g. Prado, CX-5, X-Trail" 
                  className="w-full bg-white border border-[#e7e1d8] rounded-full pl-11 pr-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#ff5a2f]/35 focus:ring-4 focus:ring-[#ff5a2f]/10 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Main Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={make}
                  onChange={e => {
                    const next = e.target.value;
                    setMake(next);
                    pushWith({ make: next });
                  }}
                  className="bg-white border border-[#e7e1d8] rounded-full px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600 outline-none focus:border-[#ff5a2f]/35 transition-all cursor-pointer shadow-sm"
                >
                  <option value="">All Makes</option>
                  {allMakes.map(m => <option key={m.make} value={m.make}>{m.make}</option>)}
                </select>

                <select 
                  value={bodyType}
                  onChange={e => {
                    const next = e.target.value;
                    setBodyType(next);
                    pushWith({ bodyType: next });
                  }}
                  className="bg-white border border-[#e7e1d8] rounded-full px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600 outline-none focus:border-[#ff5a2f]/35 transition-all cursor-pointer shadow-sm"
                >
                  <option value="">All Types</option>
                  {Object.entries(bodyTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>

                <button 
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all ${
                    showMore || fuelType || transmission || county || minPrice || maxPrice
                    ? "bg-[#fff2e8] text-[#111111] border border-[#ff5a2f]/30" 
                    : "bg-white border border-[#e7e1d8] text-slate-600 hover:text-black shadow-sm"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? "rotate-180" : ""}`} />
                </button>

                <div className="w-px h-8 bg-[#e7e1d8] mx-1 hidden md:block" />

                <select 
                  value={sort}
                  onChange={e => {
                    const next = e.target.value;
                    setSort(next);
                    pushWith({ sort: next });
                  }}
                  className="bg-white border border-[#e7e1d8] rounded-full px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-600 outline-none focus:border-[#ff5a2f]/35 transition-all cursor-pointer shadow-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Lowest Price</option>
                  <option value="price_desc">Highest Price</option>
                  <option value="mileage_asc">Lowest Mileage</option>
                  <option value="year_desc">Newest Year</option>
                </select>

                <button type="submit" className="bg-[#111111] hover:bg-[#ff5a2f] text-white px-6 py-3 rounded-full transition-all text-xs font-extrabold uppercase tracking-[0.14em] shadow-lg shadow-black/10 active:scale-95">
                  Find
                </button>

                {hasFilters && (
                  <button 
                    type="button"
                    onClick={clearFilters}
                    className="p-3 bg-white hover:bg-[#faf7f2] text-slate-400 hover:text-[#111111] rounded-full transition-all border border-[#e7e1d8]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showMore && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-[#e7e1d8] animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 pl-2">Fuel</label>
                  <select 
                    value={fuelType}
                    onChange={e => setFuelType(e.target.value)}
                    className="w-full bg-white border border-[#e7e1d8] rounded-xl px-4 py-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-[#ff5a2f]/35 transition-all"
                  >
                    <option value="">Any Fuel</option>
                    {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 pl-2">Gearbox</label>
                  <select 
                    value={transmission}
                    onChange={e => setTransmission(e.target.value)}
                    className="w-full bg-white border border-[#e7e1d8] rounded-xl px-4 py-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-[#ff5a2f]/35 transition-all"
                  >
                    <option value="">Any Gearbox</option>
                    {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 pl-2">County</label>
                  <select 
                    value={county}
                    onChange={e => setCounty(e.target.value)}
                    className="w-full bg-white border border-[#e7e1d8] rounded-xl px-4 py-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-[#ff5a2f]/35 transition-all"
                  >
                    <option value="">Any County</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 pl-2">Price (KES)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className="w-full bg-white border border-[#e7e1d8] rounded-xl px-4 py-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-[#ff5a2f]/35 transition-all placeholder:text-slate-400"
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full bg-white border border-[#e7e1d8] rounded-xl px-4 py-2.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-[#ff5a2f]/35 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                   <button 
                     type="button"
                     onClick={() => handleSubmit()}
                     className="w-full bg-[#111111] hover:bg-[#ff5a2f] text-white text-[11px] font-extrabold uppercase tracking-[0.14em] h-10 rounded-xl transition-all"
                   >
                     Apply
                   </button>
                </div>
              </div>
            )}
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <SearchSuggestions
              suggestions={suggestions}
              loading={loadingSuggestions}
              onSelect={(val) => {
                setSearch(val);
                setShowSuggestions(false);
                pushWith({ search: val });
              }}
              inputValue={search}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}