"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X, ChevronRight, Car, Sparkles, AlertCircle } from "lucide-react";

export default function ModelSearch({ makes, makeModelPairs, counts }) {
  const [query, setQuery] = useState("");

  const filteredMakes = useMemo(() => {
    if (!query.trim()) return makes;
    const cleanQuery = query.toLowerCase().trim();
    return makes.filter((make) => make.toLowerCase().includes(cleanQuery));
  }, [makes, query]);

  const filteredModels = useMemo(() => {
    if (!query.trim() || query.trim().length < 2) return [];
    const cleanQuery = query.toLowerCase().trim();
    return makeModelPairs
      .filter(
        (pair) =>
          pair.model.toLowerCase().includes(cleanQuery) ||
          pair.make.toLowerCase().includes(cleanQuery) ||
          `${pair.make} ${pair.model}`.toLowerCase().includes(cleanQuery)
      )
      .slice(0, 12); // Limit to top 12 matches for clean UI
  }, [makeModelPairs, query]);

  const popularSearches = ["Toyota Harrier", "Subaru Forester", "Mazda Demio", "Toyota Prado", "Nissan X-Trail"];

  return (
    <div className="space-y-8">
      {/* Search Input Container */}
      <div className="relative mx-auto max-w-2xl">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-muted" />
          <input
            type="text"
            placeholder="Search make or model (e.g. Toyota Harrier, Subaru...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface-hover py-3.5 pl-12 pr-10 text-sm font-medium text-text shadow-sm transition-all placeholder:text-zinc-400 hover:border-border focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-accent-glow"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 rounded-full p-1 text-muted hover:bg-surface-overlay hover:text-text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Popular searches suggestions */}
        {!query && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="rounded-full bg-surface-hover px-2.5 py-1 font-semibold text-muted border border-border transition-all hover:bg-accent-wash hover:text-[var(--accent)] hover:border-accent-dim"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {query.trim().length >= 2 && filteredModels.length > 0 && (
        <div className="animate-fade-in rounded-2xl border border-border bg-surface-hover p-6">
          <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-muted">
            <Car className="h-4 w-4 text-[var(--accent)]" />
            Matching Models ({filteredModels.length})
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {filteredModels.map((item) => (
              <Link
                key={`${item.make}-${item.model}`}
                href={`/cars?make=${encodeURIComponent(item.make)}&model=${encodeURIComponent(item.model)}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface p-3 shadow-sm transition-all hover:border-accent-glow hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-muted uppercase tracking-wider">{item.make}</p>
                  <p className="truncate text-sm font-extrabold text-text group-hover:text-[var(--accent)]">
                    {item.model}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted group-hover:text-[var(--accent)] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Makes Grid */}
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          {query ? `Matching Brands (${filteredMakes.length})` : "Browse Brands"}
        </h2>
        {filteredMakes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {filteredMakes.map((make) => (
              <Link
                key={make}
                href={`/cars?make=${encodeURIComponent(make)}`}
                className="group rounded-xl border border-border bg-surface p-4 text-center transition-all hover:border-accent-glow hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-wash text-base font-black text-[var(--accent)] group-hover:bg-accent-dim transition-all">
                  {make[0]}
                </div>
                <p className="text-sm font-bold text-text group-hover:text-[var(--accent)]">
                  {make}
                </p>
                <p className="text-[10px] font-semibold text-muted">
                  {counts[make] || 0} {counts[make] === 1 ? "model" : "models"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted mb-3" />
            <h3 className="text-base font-bold text-text">No brands match your search</h3>
            <p className="mt-1 text-xs text-muted max-w-xs">
              We couldn't find any brands or models matching "{query}". Try clearing the search or typing a different keyword.
            </p>
            <button
              onClick={() => setQuery("")}
              className="mt-4 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-bold text-muted transition-all hover:bg-surface-overlay"
            >
              Reset Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
