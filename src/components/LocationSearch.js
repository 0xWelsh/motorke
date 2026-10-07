"use client";
// src/components/LocationSearch.js
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2, X } from "lucide-react";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";

export default function LocationSearch() {
  const [search, setSearch] = useState("");
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const formRef = useRef(null);
  
  const { debouncedTerm } = useDebouncedSearch(search, 300);

  const locatingRef = useRef(null);

  function detectLocation() {
    if (!navigator.geolocation) return;
    // Reuse an in-flight fix instead of stacking duplicate permission prompts.
    if (locatingRef.current) return;
    setLocating(true);
    const request = {};
    locatingRef.current = request;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (locatingRef.current !== request) return;
        locatingRef.current = null;
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        if (locatingRef.current !== request) return;
        locatingRef.current = null;
        setLocating(false);
      },
      // Cached, low-accuracy fix — accurate enough to bias results and it
      // normally returns in a few ms instead of waiting on a fresh GPS lock.
      { timeout: 8000, enableHighAccuracy: false, maximumAge: 300000 }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (location) {
      params.set("lat", location.lat);
      params.set("lng", location.lng);
    }
    router.push(`/cars?${params.toString()}`);
  }

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

  function handleSuggestionSelect(value) {
    setSearch(value);
    setShowSuggestions(false);
    
    // Auto-submit after selecting suggestion
    const params = new URLSearchParams();
    params.set("search", value);
    if (location) {
      params.set("lat", location.lat);
      params.set("lng", location.lng);
    }
    router.push(`/cars?${params.toString()}`);
  }

  return (
    <div className="w-full max-w-2xl relative">
      <form 
        ref={formRef}
        onSubmit={handleSubmit} 
        className="flex flex-col sm:flex-row sm:items-center bg-[#1e1e1e] border border-slate-800 rounded-2xl p-2.5 sm:p-2 focus-within:border-[var(--brand-accent)]/30 transition-all duration-300"
      >
        <div className="flex-1 flex items-center px-3 sm:px-4 gap-3 min-w-0">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
            placeholder="Search by make, model or keyword…"
            className="w-full bg-transparent border-none outline-none py-3 text-sm sm:text-base text-slate-200 placeholder:text-slate-300 font-semibold"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2 sm:mt-0 sm:ml-2 sm:flex sm:items-center w-full sm:w-auto">
          <button
            type="button"
            onClick={detectLocation}
            className={`h-11 px-3 sm:px-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 group w-full sm:w-auto ${
              location ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-transparent border border-slate-800 hover:text-slate-900 text-white"
            }`}
            title="Use my location"
          >
            {locating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            )}
            {location && <span className="text-xs font-bold hidden sm:block">Near Me</span>}
          </button>

          <button 
            type="submit" 
            className="h-11 bg-[#ff5a2f] hover:bg-[#e54a1f] text-white px-5 sm:px-8 rounded-2xl font-black text-sm transition-all duration-300 w-full sm:w-auto"
          >
            Search
          </button>
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

      {location && (
        <div className="flex items-center gap-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-2xl border border-slate-800">
            <MapPin className="w-3 h-3 text-slate-500" />
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              Searching near you
            </span>
            <button 
              onClick={() => setLocation(null)} 
              className="hover:text-red-500 transition-colors ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
