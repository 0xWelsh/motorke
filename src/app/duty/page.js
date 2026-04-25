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

  const [purchaseUsd, setPurchaseUsd] = useState(7500);
  const [exportUsd,   setExportUsd]   = useState(450);
  const [shippingUsd, setShippingUsd] = useState(2300);
  const [clearingKes, setClearingKes] = useState(200000);
  const [exchangeRate, setExchangeRate] = useState(135);
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

  const cifUsd = purchaseUsd + exportUsd + shippingUsd;
  const cifKes  = cifUsd * exchangeRate;
  const ageYears = getAgeYearsFromYear(year);
  const result = useMemo(
    () => calculateDutyBreakdown({ cifKes, ageYears, engineCC, isElectric, rates }),
    [cifKes, ageYears, engineCC, isElectric, rates]
  );
  const totalLandedCost = result.landed + clearingKes;

  const rows = [
    { label: "Purchase Price (FOB)", value: fmt(purchaseUsd * exchangeRate), note: `$${purchaseUsd}`, highlight: false },
    { label: "Vehicle & Export Costs", value: fmt(exportUsd * exchangeRate), note: `$${exportUsd}`, highlight: false },
    { label: "Shipping (to Mombasa)", value: fmt(shippingUsd * exchangeRate), note: `$${shippingUsd}`, highlight: false },
    { label: "Total CIF Value", value: fmt(cifKes), note: `$${cifUsd}`, highlight: true },
    { label: "Customs value after depreciation", value: fmt(result.customsValue), note: `${ageYears} year${ageYears !== 1 ? "s" : ""} old`, highlight: false },
    { label: `Import Declaration Fee (IDF) ${(rates.idfRate * 100).toFixed(2)}%`, value: fmt(result.idf), note: null, highlight: false },
    { label: `Excise Duty ${(result.exciseRate * 100).toFixed(0)}%`, value: fmt(result.excise), note: result.exciseLabel, highlight: false },
    { label: `VAT ${(rates.vatRate * 100).toFixed(0)}% (on customs + IDF + excise)`, value: fmt(result.vat), note: null, highlight: false },
    { label: "Railway Development Levy (RDL)", value: fmt(result.rdl), note: "flat rate", highlight: false },
    { label: "Total import duties", value: fmt(result.total), note: null, highlight: true },
    { label: "Clearing Agent, Registration & Other Fees", value: fmt(clearingKes), note: "IDF, NTSA, Agent etc.", highlight: false },
    { label: "Final Estimated Landed Cost", value: fmt(totalLandedCost), note: "depends on exact agent fees", highlight: true },
  ];

  const inputCls = "bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all w-full";

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-32 sm:py-40">
        
        {/* Header */}
        <div className="mb-20">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-8">
            <span>Terminal</span>
            <span>/</span>
            <span className="text-[#1A202C]">Import Duty Engine</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold text-[#1A202C] tracking-tight leading-[1.05] mb-8">
            Fiscal <br />
            <span className="editorial-heading text-[#718096]">Forecasting.</span>
          </h1>
          <p className="text-xl text-[#718096] font-medium max-w-2xl leading-relaxed">
            Direct integration with regional tax protocols. Estimate KRA import duties, 
            depreciation schedules, and final landed costs with architectural precision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-12">
            <div>
               <h2 className="text-[10px] font-bold text-[#1A202C] uppercase tracking-widest mb-8">Asset Parameters</h2>
               <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-4">
                      Purchase Price (USD, FOB)
                    </label>
                    <div className="relative group">
                      <span className="absolute left-0 bottom-3 text-[#1A202C] font-bold text-lg">$</span>
                      <input type="number" value={purchaseUsd} onChange={e => setPurchaseUsd(+e.target.value)}
                        className="w-full bg-transparent border-b-2 border-[#EDF2F7] focus:border-[#38A169] py-3 pl-6 text-2xl font-bold text-[#1A202C] outline-none transition-colors tabular-nums" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-4">Export Variable (USD)</label>
                      <input type="number" value={exportUsd} onChange={e => setExportUsd(+e.target.value)}
                        className="w-full bg-transparent border-b border-[#EDF2F7] focus:border-[#38A169] py-2 text-lg font-bold text-[#1A202C] outline-none transition-colors tabular-nums" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-4">Logistics (USD)</label>
                      <input type="number" value={shippingUsd} onChange={e => setShippingUsd(+e.target.value)}
                        className="w-full bg-transparent border-b border-[#EDF2F7] focus:border-[#38A169] py-2 text-lg font-bold text-[#1A202C] outline-none transition-colors tabular-nums" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-10">
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-4">FX Rate (USD:KES)</label>
                      <input type="number" value={exchangeRate} onChange={e => setExchangeRate(+e.target.value)}
                        className="w-full bg-transparent border-b border-[#EDF2F7] focus:border-[#38A169] py-2 text-lg font-bold text-[#1A202C] outline-none transition-colors tabular-nums" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-4">Asset Year</label>
                      <select value={year} onChange={e => setYear(+e.target.value)} 
                        className="w-full bg-transparent border-b border-[#EDF2F7] focus:border-[#38A169] py-2 text-lg font-bold text-[#1A202C] outline-none transition-colors">
                        {Array.from({ length: 20 }, (_, i) => currentYear - i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-6">
                    <label className="flex items-center gap-4 cursor-pointer group">
                      <div className={`w-6 h-6 border-2 transition-colors flex items-center justify-center ${isElectric ? 'bg-[#38A169] border-[#38A169]' : 'border-[#EDF2F7] group-hover:border-[#38A169]'}`} style={{ borderRadius: '4px' }}>
                        {isElectric && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <input type="checkbox" checked={isElectric} onChange={e => setIsElectric(e.target.checked)} className="hidden" />
                      <div className="space-y-0.5">
                        <span className="text-sm font-bold text-[#1A202C]">EV Protocol</span>
                        <p className="text-[10px] text-[#718096] font-bold uppercase tracking-widest">Reduced Excise (10%)</p>
                      </div>
                    </label>
                  </div>
               </div>
            </div>
          </div>

          {/* Breakdown List */}
          <div className="lg:col-span-7">
             <div className="bg-[#F7FAFC] border border-[#E2E8F0] p-10 sm:p-12" style={{ borderRadius: 'var(--radius)' }}>
                <h2 className="text-[10px] font-bold text-[#1A202C] uppercase tracking-widest mb-12">Fiscal Breakdown</h2>
                <div className="space-y-6">
                  {rows.map(({ label, value, note, highlight }) => (
                    <div key={label} className={`flex justify-between items-baseline gap-8 ${highlight ? 'pt-6 border-t border-[#E2E8F0] mt-6' : ''}`}>
                       <div className="space-y-1">
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${highlight ? 'text-[#1A202C]' : 'text-[#718096]'}`}>{label}</p>
                          {note && <p className="text-[10px] font-bold text-[#A0AEC0] uppercase">{note}</p>}
                       </div>
                       <p className={`text-xl font-bold tabular-nums ${highlight ? 'text-[#38A169] text-2xl' : 'text-[#1A202C]'}`}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-16 pt-12 border-t border-[#E2E8F0]">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-[#A0AEC0] uppercase tracking-widest mb-4">
                      <ShieldCheck className="w-3 h-3" /> Source: {ratesMeta.source || "central-index"} 
                   </div>
                   <p className="text-xs font-semibold text-[#718096] leading-relaxed">
                      Disclaimer: These values are generated as estimates based on current Central Revenue System schedules. 
                      Final port assessment may fluctuate based on unit-specific CRSP classification.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 pt-20 border-t border-[#EDF2F7] text-center">
           <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-8">Ready to originate an import?</h3>
           <Link href="/cars" className="inline-block bg-[#1A202C] text-white px-12 py-5 text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
              Explore Verified Inventory
           </Link>
        </div>
      </div>
    </div>
  );
}
