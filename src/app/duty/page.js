"use client";
// src/app/duty/page.js
// Kenya import duty calculator with online-rate fallback support

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Banknote, Car, ChevronRight, ShieldCheck } from "lucide-react";
import { calculateDutyBreakdown, getAgeYearsFromYear, getDefaultDutyRates } from "@/lib/duty";

function fmt(n) {
  return "KSh " + Math.round(n).toLocaleString("en-KE");
}

export default function DutyCalculatorPage() {
  const currentYear = new Date().getFullYear();
  const [rates, setRates] = useState(() => getDefaultDutyRates());
  const [ratesMeta, setRatesMeta] = useState({
    source: "local-default",
    effectiveFrom: null,
    lastUpdated: null,
    fallback: true,
    stale: false,
    error: null,
  });
  const [ratesLoading, setRatesLoading] = useState(true);

  const [cifUsd,      setCifUsd]      = useState(15000);
  const [exchangeRate, setExchangeRate] = useState(130);
  const [year,        setYear]        = useState(2020);
  const [engineCC,    setEngineCC]    = useState(2000);
  const [isElectric,  setIsElectric]  = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadRates() {
      try {
        const response = await fetch("/api/duty/rates", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to fetch online duty rates");

        const data = await response.json();
        if (!mounted) return;

        if (data?.rates) setRates(data.rates);
        if (data?.meta) setRatesMeta(data.meta);
      } catch (error) {
        if (!mounted) return;
        setRatesMeta((prev) => ({
          ...prev,
          fallback: true,
          stale: true,
          error: error?.message || "Unable to fetch online duty rates",
        }));
      } finally {
        if (mounted) setRatesLoading(false);
      }
    }

    loadRates();

    return () => {
      mounted = false;
    };
  }, []);

  const cifKes  = cifUsd * exchangeRate;
  const ageYears = getAgeYearsFromYear(year);
  const result = useMemo(
    () => calculateDutyBreakdown({ cifKes, ageYears, engineCC, isElectric, rates }),
    [cifKes, ageYears, engineCC, isElectric, rates]
  );

  const rows = [
    { label: "CIF value (purchase + freight + insurance)", value: fmt(cifKes), note: null, highlight: false },
    { label: "Customs value after depreciation", value: fmt(result.customsValue), note: `${ageYears} year${ageYears !== 1 ? "s" : ""} old`, highlight: false },
    { label: `Import Declaration Fee (IDF) ${(rates.idfRate * 100).toFixed(2)}%`, value: fmt(result.idf), note: null, highlight: false },
    { label: `Excise Duty ${(result.exciseRate * 100).toFixed(0)}%`, value: fmt(result.excise), note: result.exciseLabel, highlight: false },
    { label: `VAT ${(rates.vatRate * 100).toFixed(0)}% (on customs + IDF + excise)`, value: fmt(result.vat), note: null, highlight: false },
    { label: "Railway Development Levy (RDL)", value: fmt(result.rdl), note: "flat rate", highlight: false },
    { label: "Total import duties", value: fmt(result.total), note: null, highlight: true },
    { label: "Estimated landed cost", value: fmt(result.landed), note: "purchase price + all duties", highlight: true },
  ];

  const inputCls = "bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all w-full";

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-12 sm:mb-16 space-y-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest ${
            ratesMeta.error 
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : ratesMeta.fallback
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}>
            {ratesLoading ? "Updating rates..." : ratesMeta.fallback ? "Using fallback rates" : "Online rates active"}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Import Duty Calculator</h1>
          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-3xl leading-relaxed">
            Estimate Kenya Revenue Authority import duties for vehicles. Calculate landed costs from Japan, UK, and other markets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 mb-12">
        {/* Inputs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8 shadow-sm">
          <h2 className="font-black text-xl text-slate-900 flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
               <Car className="w-5 h-5" />
             </div>
             <span>Vehicle Details</span>
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                Purchase Price (USD, CIF)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input type="number" value={cifUsd} onChange={e => setCifUsd(+e.target.value)}
                  className={`${inputCls} pl-10`} min="500" step="500" />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-2 px-1">Includes purchase price, insurance, and freight to Mombasa.</p>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                USD → KES Exchange Rate
              </label>
              <input type="number" value={exchangeRate} onChange={e => setExchangeRate(+e.target.value)}
                className={inputCls} min="50" step="1" />
              <p className="text-xs text-slate-600 font-medium mt-2 px-1">
                Converted CIF: <span className="text-slate-900 font-black">{fmt(cifUsd * exchangeRate)}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  Year
                </label>
                <select value={year} onChange={e => setYear(+e.target.value)} className={inputCls}>
                  {Array.from({ length: 20 }, (_, i) => currentYear - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-widest mb-2">
                  Engine CC
                </label>
                <select value={engineCC} onChange={e => setEngineCC(+e.target.value)} className={inputCls} disabled={isElectric}>
                  {[660, 1000, 1200, 1300, 1500, 1600, 1800, 2000, 2400, 2700, 3000, 3500, 4000, 4500].map(cc => (
                    <option key={cc} value={cc}>{cc}cc</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
              <input type="checkbox" checked={isElectric} onChange={e => setIsElectric(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded" />
              <div className="space-y-0.5 flex-1">
                <span className="text-sm font-bold text-slate-900">Electric Vehicle</span>
                <p className="text-xs text-slate-500 font-medium">Excise duty reduced to 10%</p>
              </div>
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8 shadow-sm">
          <h2 className="font-black text-xl text-slate-900 flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
               <Banknote className="w-5 h-5" />
             </div>
             <span>Tax Breakdown</span>
          </h2>

          <div className="space-y-5">
            {rows.map(({ label, value, note, highlight }) => (
              <div key={label} className={`flex justify-between items-start gap-4 py-3 ${
                highlight
                  ? "border-t-2 border-slate-200 pt-4 mt-2"
                  : "border-b border-slate-100 pb-3"
              }`}>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-widest ${highlight ? "text-slate-900" : "text-slate-600"}`}>
                    {label}
                  </p>
                  {note && <p className="text-xs text-slate-500 font-medium">{note}</p>}
                </div>
                <p className={`text-base font-black tabular-nums text-right ${
                  highlight ? "text-slate-900 text-lg" : "text-slate-700"
                }`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 mb-12">
          <div className="flex items-center gap-2 text-slate-700 font-black text-xs uppercase tracking-widest">
             <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" /> Important Disclaimer
          </div>
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
            Rate source: {ratesMeta.source || "local-default"}
            {ratesMeta.effectiveFrom ? ` · effective ${ratesMeta.effectiveFrom}` : ""}
            {ratesMeta.lastUpdated ? ` · updated ${new Date(ratesMeta.lastUpdated).toLocaleString("en-KE")}` : ""}
          </p>
          {ratesMeta.error && (
            <p className="text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Online rates are unavailable. Using safe fallback values.
            </p>
          )}
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            This calculator provides estimates based on publicly available KRA duty rates and depreciation schedules. Actual duties may vary based on classification, CRSP values, and port assessment. Always consult a licensed clearing agent before importing.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center space-y-6">
          <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Ready to start your search?</p>
          <Link href="/cars"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-3.5 rounded-lg text-xs uppercase tracking-widest transition-colors">
            Browse Live Inventory <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
