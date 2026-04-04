"use client";
// src/components/CarsSearch.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X, ChevronDown, ArrowUpDown, SlidersHorizontal } from "lucide-react";
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

  function handleSubmit(e) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (transmission) params.set("transmission", transmission);
    if (county) params.set("county", county);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort && sort !== "newest") params.set("sort", sort);
    router.push(`/cars?${params.toString()}`);
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
    <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 py-4 shadow-sm">
      <div className="container mx-auto px-6 max-w-7xl">
        <div ref={formRef} className="relative">
          <form method="GET" onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary Search */}
              <div className="relative flex-1 min-w-[240px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white group-focus-within:text-[var(--brand)] transition-colors" />
                <input 
                  name="search" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                  placeholder="Search inventory (e.g. Toyota Prado)..." 
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-black outline-none focus:bg-white focus:border-[var(--brand-accent)]/30 transition-all placeholder:text-white shadow-sm"
                />
              </div>

              {/* Main Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={make}
                  onChange={e => { setMake(e.target.value); handleSubmit(); }}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:text-[var(--brand)] focus:border-[var(--brand-accent)]/30 transition-all cursor-pointer shadow-sm"
                >
                  <option value="">All Makes</option>
                  {allMakes.map(m => <option key={m.make} value={m.make}>{m.make}</option>)}
                </select>

                <select 
                  value={bodyType}
                  onChange={e => { setBodyType(e.target.value); handleSubmit(); }}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:text-[var(--brand)] focus:border-[var(--brand-accent)]/30 transition-all cursor-pointer shadow-sm"
                >
                  <option value="">All Types</option>
                  {Object.entries(bodyTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>

                <button 
                  type="button"
                  onClick={() => setShowMore(!showMore)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    showMore || fuelType || transmission || county || minPrice || maxPrice
                    ? "bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand-accent)]/20" 
                    : "bg-slate-50 border border-slate-100 text-white hover:text-[var(--brand)] shadow-sm"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  <ChevronDown className={`w-3 h-3 transition-transform ${showMore ? "rotate-180" : ""}`} />
                </button>

                <div className="w-px h-8 bg-white/5 mx-1 hidden md:block" />

                <select 
                  value={sort}
                  onChange={e => { setSort(e.target.value); handleSubmit(); }}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:text-[var(--brand)] focus:border-[var(--brand-accent)]/30 transition-all cursor-pointer shadow-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Lowest Price</option>
                  <option value="price_desc">Highest Price</option>
                  <option value="mileage_asc">Lowest Mileage</option>
                  <option value="year_desc">Newest Year</option>
                </select>

                <button type="submit" className="bg-[var(--brand)] hover:bg-[var(--brand-accent)] text-white px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-[var(--brand)]/10 active:scale-95">
                  Find
                </button>

                {hasFilters && (
                  <button 
                    type="button"
                    onClick={clearFilters}
                    className="p-3 bg-slate-50 hover:bg-slate-100 text-white hover:text-[var(--brand)] rounded-xl transition-all border border-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {showMore && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white pl-2">Fuel Type</label>
                  <select 
                    value={fuelType}
                    onChange={e => setFuelType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-bold text-black outline-none focus:border-[var(--brand-accent)]/30 transition-all"
                  >
                    <option value="">Any Fuel</option>
                    {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white pl-2">Transmission</label>
                  <select 
                    value={transmission}
                    onChange={e => setTransmission(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-bold text-black outline-none focus:border-[var(--brand-accent)]/30 transition-all"
                  >
                    <option value="">Any Gearbox</option>
                    {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white pl-2">Location</label>
                  <select 
                    value={county}
                    onChange={e => setCounty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-bold text-black outline-none focus:border-[var(--brand-accent)]/30 transition-all"
                  >
                    <option value="">Any County</option>
                    {counties.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white pl-2">Price Range (KES)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={e => setMinPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-bold text-black outline-none focus:border-[var(--brand-accent)]/30 transition-all placeholder:text-white"
                    />
                    <span className="text-white">—</span>
                    <input 
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={e => setMaxPrice(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-[11px] font-bold text-black outline-none focus:border-[var(--brand-accent)]/30 transition-all placeholder:text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                   <button 
                     type="button"
                     onClick={() => handleSubmit()}
                     className="w-full bg-slate-100 hover:bg-slate-200 text-black text-[11px] font-black uppercase tracking-widest h-10 rounded-xl transition-all"
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
              onSelect={(val) => { setSearch(val); setShowSuggestions(false); handleSubmit(); }}
              inputValue={search}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}