"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Search, Share2, ArrowUpRight, Calculator } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { carsHubPathForDutyVehicle } from "@/lib/duty-vehicle-slug";
import TrackedLink from "@/components/TrackedLink";

function sessionKey() {
  if (typeof window === "undefined") return null;
  const key = "wmh-duty-session";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || String(Date.now());
    localStorage.setItem(key, id);
  }
  return id;
}

function useDebounced(value, ms = 280) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function DutyCalculator({ initialVehicle = null, pageSlug = null }) {
  const searchId = useId();
  const [query, setQuery] = useState(
    initialVehicle ? `${initialVehicle.year} ${initialVehicle.make} ${initialVehicle.model}` : "",
  );
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(initialVehicle);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const debouncedQuery = useDebounced(query);

  const runCalculate = useCallback(async (vehicle) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/duty/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          searchQuery: query,
          sessionKey: sessionKey(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calculation failed");
      setEstimate(data.estimate);
    } catch (e) {
      setError(e.message || "Could not calculate duty");
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (initialVehicle) {
      runCalculate(initialVehicle);
    }
  }, [initialVehicle, runCalculate]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1 || selected) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/duty/vehicles/search?q=${encodeURIComponent(debouncedQuery)}`);
        const data = await res.json();
        if (!cancelled) setSuggestions(data.vehicles || []);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, selected]);

  const pickVehicle = (vehicle) => {
    setSelected(vehicle);
    setQuery(vehicle.label);
    setSuggestions([]);
    runCalculate(vehicle);
  };

  const clearSelection = () => {
    setSelected(null);
    setEstimate(null);
    setQuery("");
    setError("");
  };

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const slug = selected?.slug || pageSlug;
    return slug ? `${window.location.origin}/duty/${slug}` : window.location.href;
  }, [selected?.slug, pageSlug]);

  const handleShare = async () => {
    const text = estimate
      ? `Import duty estimate for ${estimate.label}: ${formatPrice(estimate.breakdown.totalTaxes)} taxes (Welsh Motorhub)`
      : "Kenya import duty calculator — Welsh Motorhub";
    if (navigator.share) {
      try {
        await navigator.share({ title: "Import duty estimate", text, url: shareUrl });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const marketplaceHref = selected
    ? carsHubPathForDutyVehicle({ make: selected.make, model: selected.model })
    : "/cars";

  const breakdownRows = estimate
    ? [
        { label: "CRSP reference (KES)", value: formatPrice(estimate.crspKes) },
        { label: "Vehicle age", value: `${estimate.ageYears} yr` },
        { label: "Depreciated customs value", value: formatPrice(estimate.breakdown.customsValue) },
        {
          label: "Import declaration fee (IDF)",
          value: formatPrice(estimate.breakdown.idf),
        },
        { label: `Excise (${estimate.breakdown.exciseLabel})`, value: formatPrice(estimate.breakdown.excise) },
        { label: "VAT (16%)", value: formatPrice(estimate.breakdown.vat) },
        { label: "Railway development levy", value: formatPrice(estimate.breakdown.rdl) },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search vehicle
        </label>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected) setSelected(null);
            setEstimate(null);
          }}
          placeholder='Try "Mazda CX5 2018" or "Toyota Prado"'
          className="w-full h-12 pl-11 pr-4 text-sm font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white"
          style={{ borderRadius: "var(--radius)" }}
          autoComplete="off"
        />
        {selected && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Clear
          </button>
        )}
        {suggestions.length > 0 && !selected && (
          <ul
            className="absolute z-20 left-0 right-0 mt-1 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg max-h-64 overflow-y-auto"
            style={{ borderRadius: "var(--radius)" }}
          >
            {suggestions.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 last:border-0"
                  onClick={() => pickVehicle(v)}
                >
                  <span className="font-semibold text-slate-900 dark:text-white">{v.label}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {v.engineCC}cc · {FUEL_LABELS[v.fuelType] || v.fuelType} · CRSP {formatPrice(v.crspKes)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {searching && !selected && (
          <p className="absolute z-20 left-0 right-0 mt-1 px-4 py-2 text-xs text-slate-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
            Searching…
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Calculator className="w-4 h-4 animate-pulse" aria-hidden />
          Calculating estimate…
        </p>
      )}

      {estimate && !loading && (
        <div
          className="border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-5"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Estimate</p>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{estimate.label}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {estimate.engineCC}cc · {FUEL_LABELS[estimate.fuelType]} · {estimate.ageYears} years old
            </p>
          </div>

          <dl className="space-y-2 text-sm">
            {breakdownRows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-4 border-b border-slate-200/80 dark:border-zinc-800 pb-2"
              >
                <dt className="text-slate-600 dark:text-slate-400">{row.label}</dt>
                <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="pt-2 border-t border-slate-300 dark:border-zinc-700">
            <div className="flex justify-between items-baseline gap-4">
              <span className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">
                Total taxes (est.)
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-[#b91c1c] dark:text-red-400 tabular-nums">
                {formatPrice(estimate.breakdown.totalTaxes)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Indicative landed reference (CRSP + freight proxy + taxes):{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {formatPrice(estimate.breakdown.estimatedLanded)}
              </strong>
            </p>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            Estimates use KRA-style depreciation, excise bands, VAT, IDF, and RDL. CRSP values are illustrative until
            updated from official schedules. Not a binding KRA assessment.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-11 items-center justify-center gap-2 px-5 border border-slate-900 dark:border-white text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:!text-black transition-colors"
              style={{ borderRadius: "var(--radius)" }}
            >
              <Share2 className="w-4 h-4" aria-hidden />
              {copied ? "Link copied" : "Share result"}
            </button>
            <TrackedLink
              href={marketplaceHref}
              eventName="duty_calculator_marketplace_cta"
              eventPayload={{ make: estimate.make, model: estimate.model }}
              className="inline-flex h-11 items-center justify-center gap-2 px-5 bg-[#111827] dark:bg-white text-white dark:!text-black text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
              style={{ borderRadius: "var(--radius)" }}
            >
              See similar cars <ArrowUpRight className="w-4 h-4" />
            </TrackedLink>
          </div>
        </div>
      )}

      {!estimate && !loading && !selected && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Search for a common import (e.g. Toyota Prado 2018, Mazda CX-5 2018) to see an instant breakdown.
        </p>
      )}
    </div>
  );
}
