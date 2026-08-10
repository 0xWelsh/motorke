"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, Share2, ArrowUpRight, Calculator, Printer } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { carsHubPathForDutyVehicle } from "@/lib/duty-vehicle-slug";
import { getSupportWhatsAppHref } from "@/lib/site-contact";
import TrackedLink from "@/components/TrackedLink";
import DutyPopularChips from "@/components/DutyPopularChips";
import DutyTaxBreakdownChart from "@/components/DutyTaxBreakdownChart";
import DutyImportEligibilityBanner from "@/components/DutyImportEligibilityBanner";
import DutyCustomEstimate from "@/components/DutyCustomEstimate";
import { getImportYearWindow } from "@/lib/duty-import-eligibility";

const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

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
  initialEstimate = null,
  pageSlug = null,
  onVehicleChange = null,
  popularVehicles = [],
}) {
  const importWindow = getImportYearWindow();
  const searchId = useId();
  const resultsRef = useRef(null);
  const manualEstimateRef = useRef(null);
  const onVehicleChangeRef = useRef(onVehicleChange);
  const lastEstimateRef = useRef(null);
  const calculateAbortRef = useRef(null);
  onVehicleChangeRef.current = onVehicleChange;
  const [query, setQuery] = useState(initialVehicle?.label || "");
  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(initialVehicle);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [freightPrice, setFreightPrice] = useState("");

  const debouncedQuery = useDebounced(query);
  const debouncedPurchase = useDebounced(purchasePrice, 400);
  const debouncedFreight = useDebounced(freightPrice, 400);

  const runEstimate = useCallback(
    async ({ vehicle, manual, purchaseOverride }) => {
      if (!vehicle?.id && !manual) return;

      calculateAbortRef.current?.abort();
      const controller = new AbortController();
      calculateAbortRef.current = controller;

      setLoading(true);
      setError("");
      try {
        const purchaseRaw = purchaseOverride ?? debouncedPurchase;
        const purchaseParsed = purchaseRaw ? parseInt(String(purchaseRaw).replace(/\D/g, ""), 10) : NaN;
        const purchaseField =
          Number.isFinite(purchaseParsed) && purchaseParsed > 0 ? { purchasePriceKes: purchaseParsed } : {};

        const freightRaw = debouncedFreight;
        const freightParsed = freightRaw ? parseInt(String(freightRaw).replace(/\D/g, ""), 10) : NaN;
        const freightField =
          Number.isFinite(freightParsed) && freightParsed > 0 ? { freightKes: freightParsed } : {};

        const body = vehicle?.id
          ? {
              vehicleId: vehicle.id,
              searchQuery: vehicle.label || query,
              sessionKey: sessionKey(),
              ...purchaseField,
              ...freightField,
            }
          : {
              make: manual.make,
              model: manual.model,
              trim: manual.trim,
              year: manual.year,
              engineCC: manual.engineCC,
              fuelType: manual.fuelType,
              crspKes: manual.crspKes,
              searchQuery: `${manual.year} ${manual.make} ${manual.model}`.trim(),
              sessionKey: sessionKey(),
              ...purchaseField,
              ...freightField,
            };

        const res = await fetch("/api/duty/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Calculation failed");
        if (controller.signal.aborted) return;
        setEstimate(data.estimate);
        lastEstimateRef.current = data.estimate;
        if (manual) {
          manualEstimateRef.current = manual;
          setSelected(null);
        } else {
          manualEstimateRef.current = null;
        }
      } catch (e) {
        if (e?.name === "AbortError") return;
        setError(e.message || "Could not calculate duty");
        setEstimate(null);
        lastEstimateRef.current = null;
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [query, debouncedPurchase, debouncedFreight],
  );

  const applyVehicle = useCallback(
    (vehicle) => {
      if (!vehicle?.id) return;
      setSelected(vehicle);
      setQuery(vehicle.label);
      setSuggestions([]);
      setCustomPanelOpen(false);
      manualEstimateRef.current = null;
      runEstimate({ vehicle });
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [runEstimate],
  );

  useEffect(() => {
    if (initialVehicle?.id) {
      if (initialEstimate) {
        setSelected(initialVehicle);
        setQuery(initialVehicle.label);
        setSuggestions([]);
        setCustomPanelOpen(false);
        manualEstimateRef.current = null;
        setEstimate(initialEstimate);
        lastEstimateRef.current = initialEstimate;
      } else {
        applyVehicle(initialVehicle);
      }
    }
  }, [initialVehicle?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const base = lastEstimateRef.current;
    if (!base) return;
    const raw = debouncedPurchase;
    const parsed = raw ? parseInt(String(raw).replace(/\D/g, ""), 10) : NaN;
    const purchase = Number.isFinite(parsed) && parsed > 0 ? parsed : null;

    const freightRaw = debouncedFreight;
    const freightParsed = freightRaw ? parseInt(String(freightRaw).replace(/\D/g, ""), 10) : NaN;
    const freightKes =
      Number.isFinite(freightParsed) && freightParsed > 0
        ? freightParsed
        : base.breakdown.freightProxyKes;
    const clearingEstimate = base.breakdown.totalTaxes + freightKes;

    setEstimate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        purchasePriceKes: purchase,
        breakdown: {
          ...prev.breakdown,
          freightProxyKes: freightKes,
          clearingEstimate,
          totalLandedWithPurchase: purchase ? purchase + clearingEstimate : null,
        },
      };
    });
  }, [debouncedPurchase, debouncedFreight]);

  useEffect(() => {
    if (selected) {
      onVehicleChangeRef.current?.(selected);
    } else if (estimate?.make) {
      onVehicleChangeRef.current?.({ make: estimate.make, model: estimate.model });
    } else {
      onVehicleChangeRef.current?.(null);
    }
  }, [selected, estimate?.make, estimate?.model]);

  useEffect(() => () => calculateAbortRef.current?.abort(), []);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1 || selected) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/duty/vehicles/search?q=${encodeURIComponent(debouncedQuery)}&limit=20`,
        );
        const data = await res.json();
        if (!cancelled) {
          const list = data.vehicles || [];
          setSuggestions(list);
          if (list.length === 0 && debouncedQuery.length >= 2) setCustomPanelOpen(true);
        }
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
    lastEstimateRef.current = null;
    setQuery("");
    setPurchasePrice("");
    setFreightPrice("");
    setError("");
    manualEstimateRef.current = null;
    setCustomPanelOpen(false);
  };

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const slug = selected?.slug || pageSlug;
    return slug ? `${window.location.origin}/duty/${slug}` : window.location.href;
  }, [selected?.slug, pageSlug]);

  const handleShare = async () => {
    const text = estimate
      ? `Import taxes for ${estimate.label}: ${formatPrice(estimate.breakdown.totalTaxes)} (BIDGARI)${
          estimate.breakdown.totalLandedWithPurchase
            ? `. All-in ~${formatPrice(estimate.breakdown.totalLandedWithPurchase)} with your purchase price`
            : ""
        }`
      : "Kenya import duty calculator, BIDGARI";
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

  const whatsappHref = useMemo(() => {
    if (!estimate) return null;
    const text =
      `Hi BIDGARI, I'd like an official quote to import a ${estimate.label}. ` +
      `My duty estimate is ${formatPrice(estimate.breakdown.totalTaxes)}` +
      (estimate.breakdown.totalLandedWithPurchase
        ? ` (all-in ~${formatPrice(estimate.breakdown.totalLandedWithPurchase)})`
        : "") +
      `. ${shareUrl}`;
    return getSupportWhatsAppHref(text);
  }, [estimate, shareUrl]);

  const stockMake = selected?.make ?? estimate?.make;
  const stockModel = selected?.model ?? estimate?.model;
  const marketplaceHref =
    stockMake ? carsHubPathForDutyVehicle({ make: stockMake, model: stockModel }) : "/cars";

  const breakdownCards = estimate
    ? [
        {
          label: estimate.breakdown.crspRatio
            ? `KRA customs value (depreciated CRSP × ${estimate.breakdown.crspRatio})`
            : "KRA customs value",
          value: formatPrice(estimate.breakdown.customsValue),
        },
        {
          label: `Import duty (${Math.round((estimate.breakdown.importDutyRate || 0.25) * 100)}% of CV)`,
          value: formatPrice(estimate.breakdown.importDuty),
        },
        {
          label: `Excise (${estimate.breakdown.exciseLabel}) on CV + duty`,
          value: formatPrice(estimate.breakdown.excise),
        },
        {
          label: "VAT (16%) on CV + duty + excise",
          value: formatPrice(estimate.breakdown.vat),
        },
        { label: "IDF (3.5% of CV)", value: formatPrice(estimate.breakdown.idf) },
        { label: "RDL (2% of CV)", value: formatPrice(estimate.breakdown.rdl) },
      ]
    : [];

  const costLines = estimate
    ? [
        {
          label: "CRSP (KRA tax benchmark only)",
          value: formatPrice(estimate.breakdown.crspReferenceKes),
          note: "Not paid to seller",
        },
        { label: "Shipping & export estimate", value: formatPrice(estimate.breakdown.freightProxyKes) },
        {
          label: "Statutory taxes & levies",
          value: formatPrice(estimate.breakdown.totalTaxes),
          highlight: true,
        },
      ]
    : [];

  const searchBlock = (
    <div className="relative duty-print-hide">
      <label htmlFor={searchId} className="sr-only">
        Search vehicle to calculate import duty
      </label>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" aria-hidden />
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
        className="w-full h-12 sm:h-14 pl-11 pr-4 text-sm sm:text-base font-medium bg-slate-50 border border-slate-300 text-slate-900 focus:border-[var(--accent)] outline-none rounded-xl"
        autoComplete="off"
      />
      {selected && (
        <button
          type="button"
          onClick={clearSelection}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900"
        >
          Clear
        </button>
      )}
      {suggestions.length > 0 && !selected && (
        <ul
          className="absolute z-30 left-0 right-0 mt-1 border border-slate-200 bg-white shadow-xl max-h-64 overflow-y-auto rounded-xl"
        >
          {suggestions.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-0"
                onClick={() => applyVehicle(v)}
              >
                  <span className="font-semibold text-slate-900">{v.label}</span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {v.engineCC}cc, {FUEL_LABELS[v.fuelType] || v.fuelType}, CRSP {formatPrice(v.crspKes)}
                    {v.importEligibility?.status === "ineligible" && (
                      <span className="ml-2 text-red-500 font-bold">· Over 8yr limit</span>
                    )}
                  </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {searching && !selected && (
        <p className="absolute z-30 left-0 right-0 mt-1 px-4 py-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl">
          Searching…
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {searchBlock}

      <p className="text-[11px] text-slate-500 leading-relaxed duty-print-hide">
        Kenya&apos;s <strong className="font-semibold text-slate-700">8-year import rule</strong>
        : for {importWindow.referenceYear}, model year{" "}
        <strong className="font-semibold text-slate-700">
          {importWindow.oldestImportableYear} or newer
        </strong>{" "}
        is typically registrable.
      </p>

      {!searching && query.trim().length >= 2 && !selected && suggestions.length === 0 && (
        <p
          className="text-xs text-amber-900 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl duty-print-hide"
        >
          No catalog match for &ldquo;{query.trim()}&rdquo;. Enter your vehicle manually below.
        </p>
      )}

      <div className="duty-print-hide">
        <DutyCustomEstimate
          open={customPanelOpen}
          onOpenChange={setCustomPanelOpen}
          loading={loading}
          onSubmit={(manual) => {
            const label = `${manual.year} ${manual.make} ${manual.model}${manual.trim ? ` ${manual.trim}` : ""}`;
            setQuery(label);
            setSuggestions([]);
            setCustomPanelOpen(false);
            runEstimate({ manual });
            requestAnimationFrame(() => {
              resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
          }}
        />
      </div>

      {(selected || estimate) && (
        <div className="space-y-3 duty-print-hide">
          <div className="space-y-2">
            <label htmlFor="purchase-price" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Your overseas purchase price (optional)
            </label>
            <input
              id="purchase-price"
              type="text"
              inputMode="numeric"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="e.g. 1,500,000, what you pay abroad (CIF/FOB)"
              className="w-full h-11 px-4 text-sm font-medium bg-slate-50 border border-slate-300 text-slate-900 rounded-xl"
            />
            <p className="text-[11px] text-slate-500">
              CRSP is only used by KRA to calculate tax. Enter what you will actually pay for the car to see a realistic
              all-in total.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="freight-price" className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Shipping &amp; export to Mombasa (KES, optional)
            </label>
            <input
              id="freight-price"
              type="text"
              inputMode="numeric"
              value={freightPrice}
              onChange={(e) => setFreightPrice(e.target.value)}
              placeholder="e.g. 371,250, leave blank for our estimate"
              className="w-full h-11 px-4 text-sm font-medium bg-slate-50 border border-slate-300 text-slate-900 rounded-xl"
            />
            <p className="text-[11px] text-slate-500">
              Freight, insurance and port charges vary. Leave blank to use our average proxy.
            </p>
          </div>
        </div>
      )}

      {popularVehicles.length > 0 && (
        <div className="duty-print-hide">
          <DutyPopularChips
            vehicles={popularVehicles}
            activeId={selected?.id}
            disabled={loading}
            onSelect={applyVehicle}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 font-medium mt-4 duty-print-hide" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-sm text-slate-500 flex items-center gap-2 mt-4 duty-print-hide">
          <Calculator className="w-4 h-4 animate-pulse" aria-hidden />
          Calculating estimate…
        </p>
      )}

      {!estimate && !loading && !selected && (
        <p className="text-sm text-slate-500 mt-4 duty-print-hide">
          Search or pick a popular estimate above for an instant breakdown.
        </p>
      )}

      <div ref={resultsRef}>
        {estimate && !loading && (
          <div
            className="mt-6 border-2 border-slate-200 p-5 sm:p-7 space-y-6 shadow-lg bg-white rounded-xl"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 mb-1">
                  Your estimate
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{estimate.label}</h2>
                <p className="text-sm text-slate-500 mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {estimate.engineCC}cc
                  </span>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {FUEL_LABELS[estimate.fuelType]}
                  </span>
                  <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                    {estimate.ageYears} yrs
                  </span>
                </p>
              </div>
              <div className="shrink-0 text-left sm:text-right max-w-[200px]">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">CRSP (tax benchmark)</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">
                  {formatPrice(estimate.breakdown.crspReferenceKes)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Not paid to the seller</p>
              </div>
            </div>

            <DutyImportEligibilityBanner eligibility={estimate.importEligibility} />

            <div
              className={`p-5 sm:p-6 ${
                estimate.importEligibility?.status === "ineligible"
                  ? "bg-zinc-600"
                  : "bg-[#b91c1c]"
              } text-white rounded-xl`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mb-1">
                {estimate.importEligibility?.status === "ineligible"
                  ? "Tax estimate only, not registrable"
                  : "Estimated taxes & levies (KRA)"}
              </p>
              <p
                className={`text-3xl sm:text-5xl font-bold tabular-nums leading-none ${
                  estimate.importEligibility?.status === "ineligible" ? "line-through opacity-75" : ""
                }`}
              >
                {formatPrice(estimate.breakdown.totalTaxes)}
              </p>
              <p className="text-xs sm:text-sm text-white/90 mt-3 max-w-lg leading-relaxed">
                {estimate.importEligibility?.status === "ineligible"
                  ? "Duties may still apply at customs, but NTSA will not register this vehicle for Kenyan roads."
                  : "Import duty, excise, VAT, IDF & RDL, compounded per KRA. CRSP is not included (it is only used to derive customs value)."}
              </p>
            </div>

            {estimate.breakdown.totalLandedWithPurchase && (
              <div
                className="p-4 sm:p-5 border-2 border-slate-200 bg-slate-50 rounded-xl"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
                  Your estimated all-in cost
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                  {formatPrice(estimate.breakdown.totalLandedWithPurchase)}
                </p>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Purchase price + shipping ({formatPrice(estimate.breakdown.freightProxyKes)}) + taxes (
                  {formatPrice(estimate.breakdown.totalTaxes)}). Excludes clearing-agent fees.
                </p>
              </div>
            )}

            <div
              className="grid gap-2 sm:grid-cols-3 border border-slate-200 p-4 bg-slate-50 rounded-xl"
            >
              {costLines.map((line) => (
                <div key={line.label} className="flex flex-col gap-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">{line.label}</p>
                  <p
                    className={`text-sm font-bold tabular-nums ${
                      line.highlight ? "text-red-500" : "text-slate-900"
                    }`}
                  >
                    {line.value}
                  </p>
                  {line.note && (
                    <p className="text-[10px] text-slate-500">{line.note}</p>
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-1 sm:col-span-3 pt-2 border-t border-slate-200">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                  Taxes + shipping (excl. vehicle purchase)
                </p>
                <p className="text-sm font-bold tabular-nums text-slate-900">
                  {formatPrice(estimate.breakdown.clearingEstimate)}
                </p>
              </div>
            </div>

            <DutyTaxBreakdownChart breakdown={estimate.breakdown} />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {breakdownCards.map((card) => (
                <div
                  key={card.label}
                  className="p-3 border border-slate-200 bg-slate-50 rounded-xl"
                >
                  <p className="text-[10px] text-slate-500 leading-snug mb-2 min-h-[2.5rem]">{card.label}</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 no-print">
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn btn-success btn-lg"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={WHATSAPP_ICON_PATH} />
                  </svg>
                  Get official quote
                </a>
              )}
              <TrackedLink
                href={marketplaceHref}
                eventName="duty_view_matching_stock"
                eventPayload={{ make: stockMake, model: stockModel }}
                className="flex-1 btn btn-primary btn-lg"
              >
                View matching stock <ArrowUpRight className="w-4 h-4" aria-hidden />
              </TrackedLink>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 btn btn-neutral btn-lg"
              >
                <Printer className="w-4 h-4" aria-hidden />
                Print / Save
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 btn btn-neutral btn-lg"
              >
                <Share2 className="w-4 h-4" aria-hidden />
                {copied ? "Copied" : "Share"}
              </button>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500">
              Indicative only: customs value = depreciated CRSP × schedule ratio, then import duty (25%, 35% for
              large-engined vehicles), excise on (CV + duty), VAT 16%, IDF 3.5%, RDL 2%. CRSP is from our reference
              table. Confirm with KRA or your clearing agent before payment.
            </p>
          </div>
        )}
      </div>

      {estimate && !loading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-md p-3 sm:hidden safe-area-pb space-y-2 duty-print-hide">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Est. KRA taxes{" "}
            <span className="text-red-500 tabular-nums">
              {formatPrice(estimate.breakdown.totalTaxes)}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <TrackedLink
              href={marketplaceHref}
              eventName="duty_mobile_sticky_stock"
              eventPayload={{ make: stockMake, model: stockModel }}
              className="w-full btn btn-primary btn-lg"
            >
              View stock <ArrowUpRight className="w-4 h-4" />
            </TrackedLink>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full btn btn-success btn-lg"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={WHATSAPP_ICON_PATH} />
                </svg>
                Quote
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
