"use client";
// src/components/CarsSearch.js
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Banknote
} from "lucide-react";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/utils";
import { clsx } from "clsx";

const BUDGET_RANGES = [
  { label: "0 - 1M",   min: 0,       max: 1000000 },
  { label: "1M - 2M",  min: 1000000, max: 2000000 },
  { label: "2M - 3M",  min: 2000000, max: 3000000 },
  { label: "3M - 5M",  min: 3000000, max: 5000000 },
  { label: "5M - 10M", min: 5000000, max: 10000000 },
  { label: "Above 10M", min: 10000000, max: undefined },
];

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef(null);
  
  const { debouncedTerm } = useDebouncedSearch(search, 300);

  // Sync state with URL params (especially for quick filters)
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setMake(searchParams.get("make") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
  }, [searchParams]);

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
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedTerm]);

  function handleSubmit(overrideParams = {}) {
    const params = new URLSearchParams(searchParams);
    
    // Default values from state
    const currentValues = {
      search, make, bodyType, fuelType, transmission, county, minPrice, maxPrice, sort
    };

    // Apply overrides or defaults
    const finalValues = { ...currentValues, ...overrideParams };

    Object.entries(finalValues).forEach(([key, value]) => {
      if (value && value !== "newest") params.set(key, value);
      else params.delete(key);
    });

    params.set("page", "1"); // Reset pagination on search
    router.push(`/cars?${params.toString()}`);
  }

  function handleBudgetClick(min, max) {
    handleSubmit({ minPrice: min?.toString() || "", maxPrice: max?.toString() || "" });
  }

  const labelCls = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2.5 block ml-1";
  const selectCls = "w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-[var(--brand)] transition-all cursor-pointer shadow-sm appearance-none";

  return (
    <div className="flex flex-col gap-10" ref={formRef}>
      {/* Search Input Section */}
      <section>
        <label className={labelCls}>Search Vehicle</label>
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-[var(--brand)] transition-colors" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="e.g. Land Cruiser V8..." 
            className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-900 outline-none focus:border-[var(--brand)] transition-all placeholder:text-slate-200 shadow-sm shadow-slate-100"
          />
          {showSuggestions && (
            <SearchSuggestions
              suggestions={suggestions}
              loading={loadingSuggestions}
              onSelect={(val) => { setSearch(val); setShowSuggestions(false); handleSubmit({ search: val }); }}
              inputValue={search}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            />
          )}
        </div>
      </section>

      {/* Budget Grid Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
           <Banknote size={14} className="text-emerald-500" />
           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Filter by Budget (KES)</label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_RANGES.map((range) => {
            const isActive = minPrice === range.min?.toString() && maxPrice === (range.max?.toString() || "");
            return (
              <button
                key={range.label}
                onClick={() => handleBudgetClick(range.min, range.max)}
                className={clsx(
                  "py-3.5 px-3 rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                  isActive 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                    : "bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600 shadow-sm"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Advanced Filters Trigger */}
      <section className="pt-6 border-t border-slate-50">
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full group py-2"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-900" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Advanced Search</span>
          </div>
          <ChevronDown size={14} className={clsx("text-slate-300 transition-transform duration-300", showAdvanced && "rotate-180")} />
        </button>

        {showAdvanced && (
          <div className="space-y-8 pt-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Make */}
            <div>
              <label className={labelCls}>Brand & Model</label>
              <div className="space-y-3">
                <div className="relative">
                  <select 
                    value={make}
                    onChange={e => { setMake(e.target.value); handleSubmit({ make: e.target.value }); }}
                    className={selectCls}
                  >
                    <option value="">Specific Brand</option>
                    {allMakes.map(m => <option key={m.make} value={m.make}>{m.make}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                
                <div className="relative">
                  <select 
                    value={bodyType}
                    onChange={e => { setBodyType(e.target.value); handleSubmit({ bodyType: e.target.value }); }}
                    className={selectCls}
                  >
                    <option value="">Vehicle Type</option>
                    {Object.entries(bodyTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Fuel & Transmission */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                <label className={labelCls}>Fuel</label>
                <div className="relative">
                  <select 
                    value={fuelType}
                    onChange={e => setFuelType(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Any</option>
                    {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className={labelCls}>Trans</label>
                <div className="relative">
                  <select 
                    value={transmission}
                    onChange={e => setTransmission(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Any</option>
                    {Object.entries(TRANSMISSION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Price Inputs (Manual) */}
            <div>
              <label className={labelCls}>Manual Price Range</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[var(--brand)] transition-all"
                />
                <span className="text-slate-200">/</span>
                <input 
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-[var(--brand)] transition-all"
                />
              </div>
            </div>

            {/* Apply Button */}
            <button 
              onClick={() => handleSubmit()}
              className="w-full bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all shadow-xl shadow-slate-950/10 active:scale-[0.98]"
            >
              Update Search
            </button>
          </div>
        )}
      </section>

      {/* Clear Filters */}
      {(search || make || minPrice || maxPrice || bodyType) && (
        <button 
          onClick={() => {
            router.push("/cars");
          }}
          className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-rose-500 transition-colors"
        >
          <X size={12} /> Clear all filters
        </button>
      )}
    </div>
  );
}