"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import CarCard from "@/components/CarCard";
import { carListingPath } from "@/lib/car-listing-url";

const POPULAR_MAKES = ["Toyota", "Subaru", "BMW", "Mercedes", "Nissan", "Mazda", "Volkswagen", "Honda", "Mitsubishi", "Audi", "Lexus", "Suzuki", "Peugeot", "Ford", "Land Rover", "Jeep", "Hyundai", "Kia"];

function highlightText(text, query) {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? `<mark class="bg-emerald-400/30 text-white rounded-sm px-0.5">${part}</mark>`
      : part
  ).join("");
}

export default function CarsInfiniteGrid({ initialCars, initialTotal, filters, noFiltersActive }) {
  const router = useRouter();
  const [cars, setCars] = useState(initialCars);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCars.length < initialTotal);
  const [hasSearch, setHasSearch] = useState(!!filters.search);
  const sentinelRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const lastReqRef = useRef(0);

  const searchParam = filters.search || "";

  useEffect(() => {
    setCars(initialCars);
    setPage(1);
    setTotal(initialTotal);
    setHasMore(initialCars.length < initialTotal);
  }, [initialCars, initialTotal]);

  // Prefetch car detail pages for instant navigation
  useEffect(() => {
    const urls = initialCars.slice(0, 12).map((c) => carListingPath(c));
    urls.forEach((url) => router.prefetch(url));
  }, [initialCars, router]);

  const fetchResults = useCallback(async (query, pageNum = 1, append = false) => {
    const reqId = Date.now();
    lastReqRef.current = reqId;

    setLoading(true);
    const params = new URLSearchParams({ page: pageNum });
    if (filters.make) params.set("make", filters.make);
    if (filters.model) params.set("model", filters.model);
    if (filters.bodyType) params.set("bodyType", filters.bodyType);
    if (filters.fuelType) params.set("fuelType", filters.fuelType);
    if (filters.transmission) params.set("transmission", filters.transmission);
    if (filters.steering) params.set("steering", filters.steering);
    if (filters.county) params.set("county", filters.county);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.minYOM) params.set("minYOM", filters.minYOM);
    if (filters.maxYOM) params.set("maxYOM", filters.maxYOM);
    if (filters.vehicleType) params.set("vehicleType", filters.vehicleType);
    if (filters.condition) params.set("condition", filters.condition);
    if (query) params.set("search", query);

    try {
      const res = await fetch(`/api/cars/list?${params.toString()}`);
      if (lastReqRef.current !== reqId) return;
      const data = await res.json();
      if (lastReqRef.current !== reqId) return;
      if (append) {
        setCars(prev => [...prev, ...(data.cars || [])]);
        setPage(pageNum);
      } else {
        setCars(data.cars || []);
        setPage(1);
      }
      setTotal(data.total || 0);
      setHasMore(data.hasMore);
    } catch {
      // keep existing results on error
    } finally {
      if (lastReqRef.current === reqId) setLoading(false);
    }
  }, [filters]);

  const handleSearchInput = useCallback((e) => {
    const val = e.target.value;
    setHasSearch(val.trim().length > 0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        fetchResults(val.trim());
      } else {
        fetchResults("");
      }
    }, 150);
  }, [fetchResults]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Escape" && searchRef.current) {
      searchRef.current.value = "";
      setHasSearch(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      fetchResults("");
    }
  }, [fetchResults]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchResults(searchRef.current?.value?.trim() || "", nextPage, true);
  }, [page, loading, hasMore, fetchResults]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  function pushMake(make) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const params = new URLSearchParams(filters);
    if (params.get("make") === make) {
      params.delete("make");
    } else {
      params.set("make", make);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/cars?${qs}` : "/cars");
  }

  function clearSearch() {
    router.push("/cars");
  }

  function renderTitle(car) {
    const q = searchRef.current?.value?.trim();
    if (!q) return null;
    const yearStr = String(car.year);
    const makeHtml = highlightText(car.make, q);
    const modelHtml = highlightText(car.model, q);
    const variantHtml = car.variant ? highlightText(car.variant, q) : "";
    return `${yearStr} ${makeHtml} ${modelHtml}${variantHtml ? ` ${variantHtml}` : ""}`;
  }

  return (
    <div>
      {/* Sticky search bar */}
      <div className="sticky top-0 z-10 -mx-2.5 sm:-mx-0 px-2.5 sm:px-0 pt-2 pb-3 bg-[var(--surface)]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            ref={searchRef}
            type="text"
            defaultValue={searchParam}
            onInput={handleSearchInput}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search make, model, variant..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-10 py-3 text-sm font-medium text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-500 outline-none transition-shadow"
          />
          {hasSearch && (
            <button
              type="button"
              onClick={() => {
                if (searchRef.current) searchRef.current.value = "";
                setHasSearch(false);
                if (debounceRef.current) clearTimeout(debounceRef.current);
                fetchResults("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Brand quick filters */}
      <div className="flex flex-wrap gap-1.5 mb-4 overflow-x-auto pb-1">
        {POPULAR_MAKES.map((m) => {
          const active = filters.make === m;
          return (
            <button
              key={m}
              onClick={() => pushMake(m)}
              className={`shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-sm transition-all ${
                active
                  ? "bg-slate-900 text-white dark:bg-emerald-600"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>

      {/* Result count */}
      <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 mb-3">
        {total} {total === 1 ? "vehicle" : "vehicles"} found
      </p>

      {/* Grid */}
      {cars.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-sm">
          <Search className="w-10 h-10 text-slate-300 dark:text-zinc-700 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">No matches found</h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium mb-6">Try adjusting your filters or resetting your search.</p>
          <button onClick={clearSearch} className="inline-flex bg-slate-900 dark:bg-emerald-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all hover:brightness-110 active:scale-95">
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {cars.map((car, index) => (
              <CarCard key={car.id} car={car} priority={index < 2} titleHtml={renderTitle(car)} />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loading && <Loader2 className="w-6 h-6 animate-spin text-slate-400" />}
            </div>
          )}

          {!hasMore && cars.length > 0 && (
            <p className="text-center text-[10px] font-bold text-slate-300 dark:text-zinc-600 mt-6 uppercase tracking-wider">
              You've reached the end
            </p>
          )}
        </>
      )}
    </div>
  );
}
