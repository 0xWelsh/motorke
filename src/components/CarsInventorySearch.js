"use client";
// src/components/CarsInventorySearch.js
// Keyword search + inventory suggestions, separate from the filter sidebar.
// Merges with current URL filter params on submit so filters stay applied.

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2, X } from "lucide-react";
import useDebouncedSearch from "@/hooks/useDebouncedSearch";
import SearchSuggestions from "@/components/SearchSuggestions";

const RECENT_CAR_SEARCHES_KEY = "motorke:recent-car-searches";

function buildCarsQuery(searchTrim, mergeFromUrl, overrides = {}) {
  const params = new URLSearchParams();
  const q = overrides.search !== undefined ? String(overrides.search).trim() : searchTrim;
  if (q) params.set("search", q);

  const keys = [
    "make",
    "model",
    "steering",
    "minYOM",
    "maxYOM",
    "bodyType",
    "fuelType",
    "transmission",
    "county",
    "minPrice",
    "maxPrice",
    "sort",
    "lat",
    "lng",
    "perPage",
  ];
  for (const k of keys) {
    const v = overrides[k] !== undefined ? overrides[k] : mergeFromUrl[k];
    if (v == null || v === "") continue;
    if (k === "sort" && String(v) === "newest") continue;
    params.set(k, String(v));
  }
  params.delete("page");
  return params;
}

export default function CarsInventorySearch({ initialSearch = "", mergeFromUrl = {} }) {
  const [search, setSearch] = useState(initialSearch);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const wrapRef = useRef(null);

  const { debouncedTerm } = useDebouncedSearch(search, 220);

  useEffect(() => {
    setSearch(initialSearch || "");
  }, [initialSearch]);

  useEffect(() => {
    const t = debouncedTerm?.trim() || "";
    if (t.length < 1) {
      if (isFocused) {
        const recent = loadRecentSearches();
        const mapped = toRecentSuggestionItems(recent);
        setSuggestions(mapped);
        setShowSuggestions(mapped.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
      return;
    }

    setShowSuggestions(true);
    const ac = new AbortController();
    (async () => {
      try {
        setLoadingSuggestions(true);
        const u = `/api/search/suggestions?query=${encodeURIComponent(t)}&limit=14&includeCarListings=true`;
        const response = await fetch(u, { signal: ac.signal });
        const data = await response.json();
        const list = data.suggestions || [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch (e) {
        if (e.name === "AbortError") return;
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    })();

    return () => ac.abort();
  }, [debouncedTerm]);

  useEffect(() => {
    function onDocDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  function loadRecentSearches() {
    try {
      const raw = window.localStorage.getItem(RECENT_CAR_SEARCHES_KEY) || "[]";
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x.label === "string" && x.label.trim())
        .slice(0, 6);
    } catch {
      return [];
    }
  }

  function toRecentSuggestionItems(items) {
    // Shape compatible with SearchSuggestions component.
    return items.map((it) => ({
      type: "make",
      value: it.label,
    }));
  }

  function pushQuery(overrides = {}) {
    const params = buildCarsQuery(search.trim(), mergeFromUrl, overrides);
    const query = params.toString();
    const nextSearch = (overrides.search !== undefined ? overrides.search : search)?.trim?.() || "";

    if (nextSearch && typeof window !== "undefined") {
      try {
        const prev = JSON.parse(window.localStorage.getItem(RECENT_CAR_SEARCHES_KEY) || "[]");
        const entry = {
          label: nextSearch,
          query,
          createdAt: Date.now(),
        };
        const deduped = [entry, ...prev.filter((item) => item.query !== query)].slice(0, 6);
        window.localStorage.setItem(RECENT_CAR_SEARCHES_KEY, JSON.stringify(deduped));
      } catch {
        // ignore
      }
    }

    setShowSuggestions(false);
    router.push(query ? `/cars?${query}` : "/cars");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!search.trim()) {
      pushQuery({ search: "" });
      return;
    }

    const trimmed = search.trim();
    // Navigate immediately — don't block on geolocation (saves up to 5s on first search).
    pushQuery({ search: trimmed });

    if (!mergeFromUrl.lat && !mergeFromUrl.lng && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = String(position.coords.latitude);
          const lng = String(position.coords.longitude);
          const params = buildCarsQuery(trimmed, mergeFromUrl, { search: trimmed, lat, lng });
          const query = params.toString();
          router.replace(query ? `/cars?${query}` : "/cars", { scroll: false });
        },
        () => {},
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }

  function requestLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = String(position.coords.latitude);
        const lng = String(position.coords.longitude);
        pushQuery({ lat, lng });
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }

  return (
    <section
      ref={wrapRef}
      className="mb-4 sm:mb-5 border border-slate-200 dark:border-zinc-800 bg-[#FAFAFA] dark:bg-[#111111] p-2.5 sm:p-3"
      style={{ borderRadius: "var(--radius)" }}
      aria-label="Search inventory"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2F855A]">Search inventory</p>
        <button
          type="button"
          onClick={requestLocation}
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#2F855A] hover:text-[#276749] transition-colors"
        >
          <MapPin size={12} aria-hidden />
          {mergeFromUrl.lat && mergeFromUrl.lng ? "Nearest first (on)" : "Use location"}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              const current = (search || "").trim();
              // Before typing anything, show recent searches (if available).
              if (current.length < 1) {
                const recent = loadRecentSearches();
                const mapped = toRecentSuggestionItems(recent);
                setSuggestions(mapped);
                setShowSuggestions(mapped.length > 0);
                return;
              }
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            autoComplete="off"
            placeholder="Make, model, year, suggestions from live stock"
            className="w-full border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm font-semibold text-[#111827] outline-none placeholder:text-slate-400 focus:border-[#38A169] dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-slate-500"
            style={{ borderRadius: "var(--radius)" }}
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                pushQuery({ search: "" });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}

          {showSuggestions && (loadingSuggestions || suggestions.length > 0) ? (
            <SearchSuggestions
              suggestions={suggestions}
              loading={loadingSuggestions}
              inputValue={debouncedTerm || search}
              className="left-0 right-0 top-full z-50 mt-1.5 max-w-none min-w-0 sm:max-w-[min(100%,36rem)]"
              onClose={() => setShowSuggestions(false)}
              onSelect={(value) => {
                setSearch(value);
                setShowSuggestions(false);
                pushQuery({ search: value });
              }}
            />
          ) : null}
        </div>
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#111827] px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] text-white transition-transform hover:scale-[0.99] active:scale-[0.98] dark:bg-white dark:!text-black"
          style={{ borderRadius: "var(--radius)" }}
        >
          <Search className="h-4 w-4" aria-hidden />
          Search
        </button>
      </form>
    </section>
  );
}
