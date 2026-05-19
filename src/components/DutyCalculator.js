"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, Share2, ArrowUpRight, Calculator } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { carsHubPathForDutyVehicle } from "@/lib/duty-vehicle-slug";
import TrackedLink from "@/components/TrackedLink";
import DutyPopularChips from "@/components/DutyPopularChips";
import DutyTaxBreakdownChart from "@/components/DutyTaxBreakdownChart";

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

export default function DutyCalculator({
  initialVehicle = null,
  pageSlug = null,
  onVehicleChange = null,
  popularVehicles = [],
}) {
  const searchId = useId();
  const resultsRef = useRef(null);
  const [query, setQuery] = useState(initialVehicle?.label || "");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(initialVehicle);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const debouncedQuery = useDebounced(query);

  const runCalculate = useCallback(async (vehicle) => {
    if (!vehicle?.id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/duty/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          searchQuery: vehicle.label || query,
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

  const applyVehicle = useCallback(
    (vehicle) => {
      if (!vehicle?.id) return;
      setSelected(vehicle);
      setQuery(vehicle.label);
      setSuggestions([]);
      runCalculate(vehicle);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [runCalculate],
  );

  useEffect(() => {
    if (initialVehicle?.id) {
      applyVehicle(initialVehicle);
    }
  }, [initialVehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const vehicle = selected || initialVehicle;
    onVehicleChange?.(vehicle || null);
  }, [selected, initialVehicle, onVehicleChange]);

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
      ? `Import estimate for ${estimate.label}: about ${formatPrice(estimate.breakdown.totalToImport)} all-in (Welsh Motorhub)`
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

  const breakdownCards = estimate
    ? [
        { label: "KRA customs value (depreciated)", value: formatPrice(estimate.breakdown.customsValue) },
        {
          label: `Import duty (${Math.round((estimate.breakdown.importDutyRate || 0.35) * 100)}%)`,
          value: formatPrice(estimate.breakdown.importDuty),
        },
        { label: `Excise (${estimate.breakdown.exciseLabel})`, value: formatPrice(estimate.breakdown.excise) },
        { label: "VAT (16%)", value: formatPrice(estimate.breakdown.vat) },
        { label: "Import declaration fee (IDF)", value: formatPrice(estimate.breakdown.idf) },
        { label: "Railway development levy (RDL)", value: formatPrice(estimate.breakdown.rdl) },
      ]
    : [];

  const costLines = estimate
    ? [
        { label: "Vehicle reference (CRSP)", value: formatPrice(estimate.breakdown.vehicleReferenceKes) },
        { label: "Shipping & export estimate", value: formatPrice(estimate.breakdown.freightProxyKes) },
        { label: "Taxes & levies (total)", value: formatPrice(estimate.breakdown.totalTaxes), highlight: true },
      ]
    : [];

  const searchBlock = (
    <div className="relative">
      <label htmlFor={searchId} className="sr-only">
        Search vehicle to calculate import duty
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
        placeholder='Search e.g. "Mazda CX-5 2018" or "Toyota Prado"'
        className="w-full h-12 sm:h-14 pl-11 pr-4 text-sm sm:text-base font-medium border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white shadow-sm"
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
          className="absolute z-30 left-0 right-0 mt-1 border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl max-h-64 overflow-y-auto"
          style={{ borderRadius: "var(--radius)" }}
        >
          {suggestions.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 border-b border-slate-100 dark:border-zinc-800 last:border-0"
                onClick={() => applyVehicle(v)}
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
        <p className="absolute z-30 left-0 right-0 mt-1 px-4 py-2 text-xs text-slate-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">
          Searching…
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {searchBlock}

      {popularVehicles.length > 0 && (
        <DutyPopularChips
          vehicles={popularVehicles}
          activeId={selected?.id}
          disabled={loading}
          onSelect={applyVehicle}
        />
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-4" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-4">
          <Calculator className="w-4 h-4 animate-pulse" aria-hidden />
          Calculating estimate…
        </p>
      )}

      {!estimate && !loading && !selected && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
          Search or pick a popular estimate above for an instant breakdown.
        </p>
      )}

      <div ref={resultsRef}>
        {estimate && !loading && (
          <div
            className="mt-6 border-2 border-slate-900 dark:border-white bg-white dark:bg-zinc-950 p-5 sm:p-7 space-y-6 shadow-lg"
            style={{ borderRadius: "var(--radius)" }}
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600 dark:text-red-500 mb-1">
                  Your estimate
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{estimate.label}</h2>
                <p className="text-sm text-slate-500 mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-zinc-700">
                    {estimate.engineCC}cc
                  </span>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-zinc-700">
                    {FUEL_LABELS[estimate.fuelType]}
                  </span>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-zinc-700">
                    {estimate.ageYears} yrs
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">CRSP reference</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{formatPrice(estimate.crspKes)}</p>
              </div>
            </div>

            <div
              className="p-5 sm:p-6 bg-[#b91c1c] dark:bg-red-700 text-white"
              style={{ borderRadius: "var(--radius)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-100 mb-1">
                Estimated total to import
              </p>
              <p className="text-3xl sm:text-5xl font-bold tabular-nums leading-none">
                {formatPrice(estimate.breakdown.totalToImport)}
              </p>
              <p className="text-xs sm:text-sm text-red-100/90 mt-3 max-w-lg leading-relaxed">
                CRSP vehicle value + shipping estimate + all statutory taxes. Excludes clearing-agent fees, port
                handling, and your actual overseas purchase price if it differs from CRSP.
              </p>
            </div>

            <div
              className="grid gap-2 sm:grid-cols-3 border border-slate-200 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-900/30"
              style={{ borderRadius: "var(--radius)" }}
            >
              {costLines.map((line) => (
                <div key={line.label} className="flex flex-col gap-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{line.label}</p>
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      line.highlight ? "text-[#b91c1c] dark:text-red-400" : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {line.value}
                  </p>
                </div>
              ))}
            </div>

            <DutyTaxBreakdownChart breakdown={estimate.breakdown} />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {breakdownCards.map((card) => (
                <div
                  key={card.label}
                  className="p-3 border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <p className="text-[10px] text-slate-500 leading-snug mb-2 min-h-[2.5rem]">{card.label}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <TrackedLink
                href={marketplaceHref}
                eventName="duty_view_matching_stock"
                eventPayload={{ make: selected?.make, model: selected?.model }}
                className="flex-1 inline-flex h-12 items-center justify-center gap-2 px-5 bg-slate-900 dark:bg-white text-white dark:!text-black text-[10px] font-bold uppercase tracking-widest hover:opacity-95 transition-opacity"
                style={{ borderRadius: "var(--radius)" }}
              >
                View matching stock <ArrowUpRight className="w-4 h-4" aria-hidden />
              </TrackedLink>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex h-12 items-center justify-center gap-2 px-5 border border-slate-900 dark:border-white text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-widest"
                style={{ borderRadius: "var(--radius)" }}
              >
                <Share2 className="w-4 h-4" aria-hidden />
                {copied ? "Copied" : "Share"}
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Indicative only: import duty 35%, excise on (customs value + import duty), VAT 16% on the duty stack, IDF
              2.5%, RDL 2%. CRSP is from our reference table — confirm with KRA or your clearing agent before payment.
            </p>
          </div>
        )}
      </div>

      {estimate && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-3 sm:hidden safe-area-pb space-y-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Est. total to import{" "}
            <span className="text-[#b91c1c] dark:text-red-400 tabular-nums">
              {formatPrice(estimate.breakdown.totalToImport)}
            </span>
          </p>
          <TrackedLink
            href={marketplaceHref}
            eventName="duty_mobile_sticky_stock"
            eventPayload={{ make: selected?.make, model: selected?.model }}
            className="flex h-11 w-full items-center justify-center gap-2 bg-[#b91c1c] text-white text-[10px] font-bold uppercase tracking-widest"
            style={{ borderRadius: "var(--radius)" }}
          >
            View matching stock <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>
      )}
    </div>
  );
}
