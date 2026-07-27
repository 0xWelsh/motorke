"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import CarCard from "@/components/CarCard";
import { carListingPath } from "@/lib/car-listing-url";

function BidgariLoader() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-black tracking-[0.15em] text-zinc-500">
        BIDGARI
      </span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "150ms" }} />
        <span className="w-1 h-1 rounded-full bg-zinc-500 animate-pulse" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}

export default function CarsInfiniteGrid({ initialCars, initialTotal, filters, noFiltersActive }) {
  const router = useRouter();
  const [cars, setCars] = useState(initialCars);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCars.length < initialTotal);
  const sentinelRef = useRef(null);
  const lastReqRef = useRef(0);

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

  const fetchResults = useCallback(async (pageNum = 1, append = false) => {
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
    if (filters.search) params.set("search", filters.search);

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

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    await fetchResults(nextPage, true);
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

  return (
    <div>
      {/* Result count */}
      <p className="text-[11px] font-bold text-zinc-400 mb-3">
        {total} {total === 1 ? "vehicle" : "vehicles"} found
      </p>

      {/* Grid */}
      {cars.length === 0 ? (
        <div className="py-20 text-center bg-[#0f0f0f] border border-white/[0.06] rounded-sm">
          <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
            <span className="text-lg font-black tracking-[0.2em] text-zinc-600">B</span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mb-2">No matches found</h2>
          <p className="text-zinc-400 font-medium mb-6">Try adjusting your filters or resetting your search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {cars.map((car, index) => (
              <CarCard key={car.id} car={car} priority={index < 2} />
            ))}
          </div>

          {/* Sentinel for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loading && <BidgariLoader />}
            </div>
          )}

          {!hasMore && cars.length > 0 && (
            <p className="text-center text-[10px] font-bold text-zinc-600 mt-6 uppercase tracking-wider">
              You've reached the end
            </p>
          )}
        </>
      )}
    </div>
  );
}
