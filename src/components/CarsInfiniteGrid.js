"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutGrid, List, Rows3 } from "lucide-react";
import CarCard from "@/components/CarCard";
import { carListingPath } from "@/lib/car-listing-url";
import { takePopTarget, clearPopTarget } from "@/lib/back-nav";
import { trackUiEvent } from "@/lib/analytics";

const CACHE_MAX_AGE_MS = 15 * 60 * 1000;
const CACHE_MAX_CARS = 200;

const VIEW_KEY = "wmh-cars-view";

function readViewPref() {
  if (typeof window === "undefined") return "grid";
  try {
    const saved = window.localStorage.getItem(VIEW_KEY);
    return saved === "list" || saved === "compact" ? saved : "grid";
  } catch {
    return "grid";
  }
}

function buildCacheKey(filters) {
  const q = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v != null && v !== "")
  );
  return `wmh-cars-grid:${q.toString()}`;
}

function readCache(key) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.cars?.length) return null;
    if (Date.now() - (data.savedAt || 0) > CACHE_MAX_AGE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(key, data) {
  if (typeof window === "undefined") return;
  try {
    if (data.cars.length > CACHE_MAX_CARS) {
      data.cars = data.cars.slice(0, CACHE_MAX_CARS);
    }
    window.sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    // quota / private mode – caching is best-effort
  }
}

function BidgariLoader() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-black tracking-[0.15em] text-slate-500">
        BIDGARI
      </span>
      <span className="flex gap-0.5">
        <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "150ms" }} />
        <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}

export default function CarsInfiniteGrid({
  initialCars,
  initialTotal,
  filters,
  noFiltersActive,
  initialLoading = false,
}) {
  const router = useRouter();
  const [cars, setCars] = useState(initialCars);
  const [page, setPage] = useState(initialLoading ? 0 : 1);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(initialLoading);
  const [hasMore, setHasMore] = useState(initialLoading ? true : initialCars.length < initialTotal);
  const [view, setView] = useState("grid");
  const sentinelRef = useRef(null);
  const lastReqRef = useRef(0);
  const trackedRef = useRef("");

  useEffect(() => {
    setView(readViewPref());
  }, []);

  function changeView(next) {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_KEY, next);
    } catch {
      // best-effort persistence
    }
  }

  const cacheKey = buildCacheKey(filters);
  const scrollYRef = useRef(0);
  const scrollTargetRef = useRef(null);
  const popTargetRef = useRef(null);
  const stateRef = useRef({ cars: initialCars, total: initialTotal, page: 1, hasMore: initialCars.length < initialTotal });
  stateRef.current = { cars, total, page, hasMore };

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
    if (filters.sort) params.set("sort", filters.sort);
    if (filters.featured === "1") params.set("featured", "1");
    if (filters.color) params.set("color", filters.color);
    if (filters.sunroof === "1") params.set("sunroof", "1");
    if (filters.seats) params.set("seats", filters.seats);

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

  // Restore the previous browse session for this filter set (back-nav) or
  // load the filtered first page from the (CDN-cached) listing API.
  useEffect(() => {
    const restored = readCache(cacheKey);
    if (restored?.cars?.length) {
      // Only restore the scroll position when this render was actually a
      // back/forward navigation back to this exact URL. `popTargetRef`
      // covers pops observed while this instance stayed mounted; the module
      // marker covers re-mounts after a router-cache eviction.
      const here = `${window.location.pathname}${window.location.search}`;
      const popTarget = takePopTarget() || popTargetRef.current;
      popTargetRef.current = null;
      if (popTarget === here) {
        scrollTargetRef.current = restored.scrollY;
        scrollYRef.current = restored.scrollY;
      }
      setCars(restored.cars);
      setPage(restored.page);
      setTotal(restored.total);
      setHasMore(restored.hasMore);
      setLoading(false);
      return;
    }
    takePopTarget(); // drop any stale marker so it can't leak into a later mount
    if (!noFiltersActive) {
      // Static page markup always carries the unfiltered first page. For a
      // filtered URL, drop it and fetch the matching page from the cacheable
      // listing API instead of flashing unrelated cars.
      setCars([]);
      setPage(0);
      setTotal(0);
      setHasMore(true);
      setLoading(true);
      fetchResults(1, false);
      return;
    }
    setCars(initialCars);
    setPage(1);
    setTotal(initialTotal);
    setHasMore(initialCars.length < initialTotal);
    setLoading(false);
  }, [cacheKey, initialCars, initialTotal, noFiltersActive, fetchResults]);

  // If this instance is alive when a pop happens (route restored from the
  // router cache), Next.js handles scroll restoration itself – just record
  // the target and discard the module marker so it can't linger.
  useEffect(() => {
    const onPop = () => {
      popTargetRef.current = window.location.pathname + window.location.search;
      clearPopTarget();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Keep track of the live scroll position for caching.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        scrollYRef.current = window.scrollY;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Persist the loaded list + scroll so Back can restore it exactly.
  useEffect(() => {
    if (cars === initialCars) return; // only server-provided data, nothing extra to save
    writeCache(cacheKey, {
      cars,
      total,
      page,
      hasMore,
      scrollY: scrollYRef.current,
      savedAt: Date.now(),
    });
  }, [cars, page, total, hasMore, cacheKey, initialCars]);

  // Flush the latest state + scroll on unmount (e.g. user left mid-scroll).
  useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s.cars === initialCars) return;
      writeCache(cacheKey, {
        cars: s.cars,
        total: s.total,
        page: s.page,
        hasMore: s.hasMore,
        scrollY: scrollYRef.current,
        savedAt: Date.now(),
      });
    };
  }, [cacheKey, initialCars]);

  // Apply the restored scroll once the cached list is rendered.
  useEffect(() => {
    if (scrollTargetRef.current == null) return;
    const target = scrollTargetRef.current;
    scrollTargetRef.current = null;
    requestAnimationFrame(() => window.scrollTo(0, target));
  }, [cars]);

  // Prefetch car detail pages for instant navigation. Uses the current list so
  // filtered results (not just the static unfiltered page) get prefetched.
  useEffect(() => {
    const urls = cars.slice(0, 12).map((c) => carListingPath(c));
    urls.forEach((url) => router.prefetch(url));
  }, [cars, router]);

  // One analytics event per filter combination, once the result count is known.
  useEffect(() => {
    if (loading) return;
    if (trackedRef.current === cacheKey) return;
    trackedRef.current = cacheKey;
    trackUiEvent("cars_listing_view", {
      search: filters.search || "",
      make: filters.make || "",
      body_type: filters.bodyType || "",
      fuel_type: filters.fuelType || "",
      transmission: filters.transmission || "",
      county: filters.county || "",
      sort: filters.sort || "newest",
      result_count: total,
    });
  }, [cacheKey, loading, total, filters]);

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
      {/* Result count + view toggle */}
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold text-slate-400">
          {loading && total === 0
            ? "Loading vehicles…"
            : `${total} ${total === 1 ? "vehicle" : "vehicles"} found`}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={
              view === "grid"
                ? "flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-white transition-colors"
                : "flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300"
            }
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => changeView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={
              view === "list"
                ? "flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-white transition-colors"
                : "flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300"
            }
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => changeView("compact")}
            aria-label="Compact view"
            aria-pressed={view === "compact"}
            className={
              view === "compact"
                ? "flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-white transition-colors"
                : "flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-300"
            }
          >
            <Rows3 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {cars.length === 0 && loading ? (
        <div className="flex justify-center py-20">
          <BidgariLoader />
        </div>
      ) : cars.length === 0 ? (
        <div className="py-20 text-center bg-white border border-slate-200 rounded-xl">
          <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center">
            <span className="text-lg font-black tracking-[0.2em] text-slate-300">B</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
            {noFiltersActive ? "New stock lands here" : "No matches found"}
          </h2>
          <p className="text-slate-500 font-medium mb-6">
            {noFiltersActive
              ? "Dealers are uploading inventory now. Tell us the car you want and we'll source it."
              : "Try adjusting your filters or resetting your search."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {noFiltersActive ? (
              <>
                <Link href="/request-car" className="btn btn-primary btn-sm">
                  Request a car
                </Link>
                <Link href="/dealers" className="btn btn-neutral btn-sm">
                  Browse dealers
                </Link>
              </>
            ) : (
              <>
                <Link href="/cars" className="btn btn-primary btn-sm">
                  Browse all cars
                </Link>
                <Link href="/newad" className="btn btn-neutral btn-sm">
                  List your car instead
                </Link>
                {!noFiltersActive && (
                  <Link href="/cars" className="btn btn-neutral btn-sm">
                    Clear filters
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {view === "compact" ? (
            <div className="flex flex-col gap-1.5">
              {cars.map((car, index) => (
                <CarCard key={car.id} car={car} layout="compact" priority={index < 2} />
              ))}
            </div>
          ) : view === "list" ? (
            <div className="flex flex-col gap-2">
              {cars.map((car, index) => (
                <CarCard key={car.id} car={car} layout="list" priority={index < 2} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
              {cars.map((car, index) => (
                <CarCard key={car.id} car={car} priority={index < 2} />
              ))}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {loading && <BidgariLoader />}
            </div>
          )}

          {!hasMore && cars.length > 0 && (
            <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-wider">
              You've reached the end
            </p>
          )}
        </>
      )}
    </div>
  );
}
