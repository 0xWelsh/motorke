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

  function detectLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
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
        className="flex items-center bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:border-slate-900 transition-all duration-300"
      >
        <div className="flex-1 flex items-center px-4 gap-3">
          <Search className="w-5 h-5 dark:text-slate-400 text-slate-600 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => debouncedTerm.length >= 2 && setShowSuggestions(true)}
            placeholder="Search by make, model or keyword…"
            className="w-full bg-transparent border-none outline-none py-3 text-base text-slate-900 placeholder:dark:text-slate-400 text-slate-600 font-medium"
          />
        </div>

        <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block" />

        <button
          type="button"
          onClick={detectLocation}
          className={`p-3 rounded-xl transition-all duration-200 flex items-center gap-2 group ${
            location ? "bg-orange-50 text-orange-600" : "bg-transparent dark:text-slate-400 text-slate-600 hover:text-slate-900"
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
          className="bg-slate-900 hover:bg-orange-600 text-pureWhite px-8 py-3 rounded-xl font-black text-sm transition-all duration-300 ml-2"
        >
          Search
        </button>
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
            <MapPin className="w-3 h-3 dark:text-slate-500 text-slate-600" />
            <span className="text-[10px] font-black dark:text-slate-500 text-slate-600 uppercase tracking-widest">
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
