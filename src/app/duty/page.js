"use client";
// src/app/duty/page.js
// Full Kenya KRA import duty calculator
// Based on: CIF value → IDF (2.25%) → EX (20%) → Excise (25%) → VAT (16%) → RDL + IDF levy

import { useState } from "react";

const RATES = {
  idf:    0.0225,  // Import Declaration Fee
  ex:     0.20,    // Excise Duty (most cars)
  excise: 0.25,    // Excise Value Added
  vat:    0.16,    // VAT
  rdl:    10000,   // Railway Development Levy (flat KES)
};

// Depreciation schedule (KRA)
function depreciate(value, ageYears) {
  if (ageYears <= 1)  return value * 0.90;
  if (ageYears <= 2)  return value * 0.80;
  if (ageYears <= 3)  return value * 0.70;
  if (ageYears <= 4)  return value * 0.60;
  if (ageYears <= 5)  return value * 0.50;
  if (ageYears <= 6)  return value * 0.40;
  if (ageYears <= 7)  return value * 0.30;
  return value * 0.30; // minimum 30% of original
}

function fmt(n) {
  return "KSh " + Math.round(n).toLocaleString("en-KE");
}

function calcDuty({ cifKes, ageYears, engineCC, isElectric }) {
  const customsValue = depreciate(cifKes, ageYears);

  // Import Declaration Fee
  const idf = customsValue * RATES.idf;

  // Excise Duty — based on engine size
  let exciseRate = 0.20;
  if (isElectric)         exciseRate = 0.10;
  else if (engineCC > 3000) exciseRate = 0.30;
  else if (engineCC > 2000) exciseRate = 0.25;
  else if (engineCC > 1500) exciseRate = 0.20;
  else                    exciseRate = 0.15;

  const excise = customsValue * exciseRate;

  // VAT on (customs value + IDF + excise)
  const vatBase = customsValue + idf + excise;
  const vat = vatBase * RATES.vat;

  // Railway Development Levy
  const rdl = RATES.rdl;

  const total = idf + excise + vat + rdl;
  const landed = cifKes + total; // original purchase price + all duties

  return {
    customsValue,
    idf,
    excise,
    exciseRate,
    vat,
    rdl,
    total,
    landed,
  };
}

export default function DutyCalculatorPage() {
  const currentYear = new Date().getFullYear();

  const [cifUsd,      setCifUsd]      = useState(15000);
  const [exchangeRate, setExchangeRate] = useState(130);
  const [year,        setYear]        = useState(2020);
  const [engineCC,    setEngineCC]    = useState(2000);
  const [isElectric,  setIsElectric]  = useState(false);

  const cifKes  = cifUsd * exchangeRate;
  const ageYears = currentYear - year;
  const result  = calcDuty({ cifKes, ageYears, engineCC, isElectric });

  const rows = [
    { label: "CIF value (purchase + freight + insurance)", value: fmt(cifKes), note: null, highlight: false },
    { label: "Customs value after depreciation", value: fmt(result.customsValue), note: `${ageYears} year${ageYears !== 1 ? "s" : ""} old`, highlight: false },
    { label: "Import Declaration Fee (IDF) 2.25%", value: fmt(result.idf), note: null, highlight: false },
    { label: `Excise Duty ${(result.exciseRate * 100).toFixed(0)}%`, value: fmt(result.excise), note: isElectric ? "EV rate" : engineCC > 3000 ? ">3000cc" : engineCC > 2000 ? ">2000cc" : engineCC > 1500 ? ">1500cc" : "≤1500cc", highlight: false },
    { label: "VAT 16% (on customs + IDF + excise)", value: fmt(result.vat), note: null, highlight: false },
    { label: "Railway Development Levy (RDL)", value: fmt(result.rdl), note: "flat rate", highlight: false },
    { label: "Total import duties", value: fmt(result.total), note: null, highlight: true },
    { label: "Estimated landed cost", value: fmt(result.landed), note: "purchase price + all duties", highlight: true },
  ];

  const inputCls = "bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 outline-none focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/5 transition-all w-full shadow-sm";

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 bg-brand-light border border-brand-accent/20 text-brand text-xs font-extrabold px-4 py-2 rounded-xl uppercase tracking-widest shadow-sm">
          🧾 KRA Rates · 2026 Estimate
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Import Duty Calculator</h1>
        <p className="text-lg text-slate-500 font-medium max-w-2xl leading-relaxed">
          Accurately estimate Kenya Revenue Authority import duties for vehicles from Japan, UK, and other global markets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Inputs */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-xl shadow-slate-200/50">
          <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
               <Car className="w-4 h-4" />
             </div>
             Vehicle Details
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                Purchase Price (USD, CIF)
              </label>
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">$</span>
                <input type="number" value={cifUsd} onChange={e => setCifUsd(+e.target.value)}
                  className={`${inputCls} pl-10`} min="500" step="500" />
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-2 italic px-1">CIF includes purchase price, insurance, and freight to Mombasa.</p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                USD → KES Exchange Rate
              </label>
              <input type="number" value={exchangeRate} onChange={e => setExchangeRate(+e.target.value)}
                className={inputCls} min="50" step="1" />
              <p className="text-[11px] text-slate-500 font-bold mt-2 px-1">
                Converted CIF: <span className="text-brand font-extrabold">{fmt(cifUsd * exchangeRate)}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                  Year of Manufacture
                </label>
                <select value={year} onChange={e => setYear(+e.target.value)} className={inputCls}>
                  {Array.from({ length: 20 }, (_, i) => currentYear - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                  Engine Size (CC)
                </label>
                <select value={engineCC} onChange={e => setEngineCC(+e.target.value)} className={inputCls} disabled={isElectric}>
                  {[660, 1000, 1200, 1300, 1500, 1600, 1800, 2000, 2400, 2700, 3000, 3500, 4000, 4500].map(cc => (
                    <option key={cc} value={cc}>{cc}cc</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-accent/30 transition-all">
              <input type="checkbox" checked={isElectric} onChange={e => setIsElectric(e.target.checked)}
                className="w-5 h-5 accent-brand rounded-lg" />
              <div className="space-y-0.5">
                <span className="text-sm font-extrabold text-slate-900">Electric Vehicle</span>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Excise Rate reduced to 10%</p>
              </div>
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-900 rounded-[2.5rem] p-10 space-y-10 shadow-2xl shadow-slate-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-3xl -mr-32 -mt-32 rounded-full" />
          
          <h2 className="font-extrabold text-xl text-white relative z-10 flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-brand">
               <Banknote className="w-4 h-4" />
             </div>
             Tax Breakdown
          </h2>

          <div className="space-y-6 relative z-10">
            {rows.map(({ label, value, note, highlight }) => (
              <div key={label}
                className={`flex justify-between items-start gap-6 py-2 ${
                  highlight
                    ? "border-t border-white/10 pt-6 mt-4"
                    : "border-b border-white/5 pb-4"
                }`}>
                <div className="space-y-1">
                  <p className={`text-xs font-extrabold uppercase tracking-widest ${highlight ? "text-brand" : "text-slate-400"}`}>
                    {label}
                  </p>
                  {note && <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest">{note}</p>}
                </div>
                <p className={`text-lg font-extrabold tabular-nums ${
                  highlight ? "text-white text-2xl" : "text-white/80"
                }`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 text-brand font-extrabold text-xs uppercase tracking-widest">
           <ShieldCheck className="w-4 h-4" /> Important Disclaimer
        </div>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">
          This calculator provides estimates based on publicly available KRA duty rates and depreciation schedules. 
          Actual duties may vary based on specific classification, CRSP values, and assessment at the port of entry. 
          Always consult a licensed clearing agent before proceeding with an import.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center space-y-6">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Ready to start your search?</p>
        <Link href="/cars"
          className="inline-flex items-center gap-3 bg-brand text-white font-extrabold px-12 py-5 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all hover:bg-brand-accent shadow-xl shadow-brand/20 active:scale-95">
          Browse Live Inventory <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
