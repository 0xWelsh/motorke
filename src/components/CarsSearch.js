"use client";
// src/components/CarsSearch.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";

export default function CarsSearch({ 
  initialSearch = "",
  initialMake = "",
  initialBodyType = "",
  initialFuelType = "",
  initialCounty = "",
  allMakes = [],
  bodyTypeLabels = {},
  counties = []
}) {
  const [search, setSearch] = useState(initialSearch);
  const [make, setMake] = useState(initialMake);
  const [bodyType, setBodyType] = useState(initialBodyType);
  const [fuelType, setFuelType] = useState(initialFuelType);
  const [county, setCounty] = useState(initialCounty);
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
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (county) params.set("county", county);
    router.push(`/cars?${params.toString()}`);
  }

  function handleSuggestionSelect(value) {
    setSearch(value);
    setShowSuggestions(false);
    
    // Auto-submit after selecting suggestion
    const params = new URLSearchParams();
    params.set("search", value);
    if (make) params.set("make", make);
    if (bodyType) params.set("bodyType", bodyType);
    if (fuelType) params.set("fuelType", fuelType);
    if (county) params.set("county", county);
    router.push(`/cars?${params.toString()}`);
  }

  function clearFilters() {
    setSearch("");
    setMake("");
    setBodyType("");
    setFuelType("");
    setCounty("");
    router.push("/cars");
  }

  const hasFilters = search || make || bodyType || fuelType || county;

  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5 py-4 shadow-sm">
      <div className="container mx-auto px-6 max-w-7xl">
        <div ref={formRef} className="relative">
          <form method="GET" onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-white transition-colors" />
              <input 
                name="search" 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
                placeholder="Search inventory..." 
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-white outline-none focus:bg-surface focus:border-white/20 transition-all placeholder:text-white/30"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select 
                name="make" 
                value={make}
                onChange={e => setMake(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/50 outline-none focus:text-white focus:border-white/20 transition-all cursor-pointer"
              >
                <option value="">All Makes</option>
                {allMakes.map(m => <option key={m.make} value={m.make}>{m.make}</option>)}
              </select>

              <select 
                name="bodyType" 
                value={bodyType}
                onChange={e => setBodyType(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/50 outline-none focus:text-white focus:border-white/20 transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                {Object.entries(bodyTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>

              <select 
                name="county" 
                value={county}
                onChange={e => setCounty(e.target.value)}
                className="bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/50 outline-none focus:text-white focus:border-white/20 transition-all cursor-pointer"
              >
                <option value="">All Counties</option>
                {counties.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <button type="submit" className="bg-white/10 hover:bg-orange-600 text-pureWhite p-2.5 rounded-xl transition-all">
                <Filter className="w-4 h-4" />
              </button>

              {hasFilters && (
                <button 
                  type="button"
                  onClick={clearFilters}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <SearchSuggestions
              suggestions={suggestions}
              loading={loadingSuggestions}
              onSelect={handleSuggestionSelect}
              inputValue={search}
              className="mt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}