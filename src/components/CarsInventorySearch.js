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

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      // Form onSubmit (handleSubmit) will handle the search for 'search' state
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <section
      ref={wrapRef}
      className="mb-6 sm:mb-8 border border-[var(--brand-faint)] bg-[var(--surface-overlay)] p-3 sm:p-5 shadow-sm"
      style={{ borderRadius: "20px" }}
      aria-label="Search inventory"
    >
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <p className="meta-label text-[var(--brand-primary)]">Global Search</p>
        <button
          type="button"
          onClick={requestLocation}
          className="meta-label text-slate-500 hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1.5"
        >
          <MapPin size={12} aria-hidden />
          {mergeFromUrl.lat && mergeFromUrl.lng ? "Location Active" : "Find Nearest"}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="relative flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              const current = (search || "").trim();
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
            placeholder="Search make, model, body, or color..."
            className="w-full border border-[var(--brand-faint)] bg-[var(--surface)] py-4 pl-11 pr-12 text-sm font-bold text-[var(--text-main)] outline-none placeholder:text-slate-400 focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/5 transition-all"
            style={{ borderRadius: "12px" }}
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                pushQuery({ search: "" });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
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
              className="left-0 right-0 top-[calc(100%+8px)] z-50 max-w-none min-w-0 sm:max-w-[min(100%,40rem)] shadow-[0_20px_50px_rgba(0,0,0,0.2)]"
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
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-[var(--brand-primary)] px-8 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-[var(--brand-primary)]/10"
          style={{ borderRadius: "12px" }}
        >
          <Search className="h-4 w-4" aria-hidden />
          Search
        </button>
      </form>
    </section>
  );
}
