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

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50 transition-colors w-full";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-full mb-4">
          🧾 KRA rates · Estimate only — verify with a licensed clearing agent
        </div>
        <h1 className="text-4xl font-black">Import duty calculator</h1>
        <p className="text-white/40 mt-2">
          Estimate the Kenya Revenue Authority import duties on a used vehicle imported from Japan or the UK.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Inputs */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="font-black text-lg">Vehicle details</h2>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Purchase price (USD, CIF)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">$</span>
              <input type="number" value={cifUsd} onChange={e => setCifUsd(+e.target.value)}
                className={`${inputCls} pl-8`} min="500" step="500" />
            </div>
            <p className="text-xs text-white/20 mt-1">CIF = Cost + Insurance + Freight to Mombasa</p>
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              USD → KES exchange rate
            </label>
            <input type="number" value={exchangeRate} onChange={e => setExchangeRate(+e.target.value)}
              className={inputCls} min="50" step="1" />
            <p className="text-xs text-white/20 mt-1">
              CIF in KES: <strong className="text-white/40">{fmt(cifUsd * exchangeRate)}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Year of manufacture
            </label>
            <select value={year} onChange={e => setYear(+e.target.value)} className={inputCls}>
              {Array.from({ length: 20 }, (_, i) => currentYear - i).map(y => (
                <option key={y} value={y}>{y} ({currentYear - y} yr{currentYear - y !== 1 ? "s" : ""} old)</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
              Engine size (cc)
            </label>
            <select value={engineCC} onChange={e => setEngineCC(+e.target.value)} className={inputCls} disabled={isElectric}>
              {[660, 1000, 1200, 1300, 1500, 1600, 1800, 2000, 2400, 2700, 3000, 3500, 4000, 4500].map(cc => (
                <option key={cc} value={cc}>{cc}cc</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={isElectric} onChange={e => setIsElectric(e.target.checked)}
              className="w-4 h-4 accent-[#f97316]" />
            <span className="text-sm text-white/60">Electric vehicle (lower excise rate 10%)</span>
          </label>
        </div>

        {/* Summary */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h2 className="font-black text-lg mb-5">Duty breakdown</h2>
          <div className="space-y-3">
            {rows.map(({ label, value, note, highlight }) => (
              <div key={label}
                className={`flex justify-between items-start gap-4 py-2 ${
                  highlight
                    ? "border-t border-white/10 pt-3 mt-1"
                    : "border-b border-white/5"
                }`}>
                <div className="min-w-0">
                  <p className={`text-xs leading-snug ${highlight ? "font-bold text-white" : "text-white/50"}`}>
                    {label}
                  </p>
                  {note && <p className="text-[10px] text-white/20 mt-0.5">{note}</p>}
                </div>
                <p className={`text-sm whitespace-nowrap flex-shrink-0 ${
                  highlight ? "font-black text-[#f97316]" : "text-white/70"
                }`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-xs text-white/30 leading-relaxed">
        <p className="font-semibold text-white/50 mb-2">⚠️ Important disclaimer</p>
        <p>
          This calculator provides estimates based on publicly available KRA duty rates and the depreciation schedule for
          imported vehicles. Actual duties may vary based on the vehicle's specific classification, current exchange rates
          at the time of entry, and KRA assessments. Always consult a licensed clearing agent before importing a vehicle.
          Duty rates are subject to change in the annual Kenya Budget.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <p className="text-white/40 text-sm mb-4">Ready to find your car?</p>
        <a href="/cars"
          className="inline-flex items-center gap-2 bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold px-8 py-3 rounded-xl transition-colors">
          Browse available cars →
        </a>
      </div>
    </div>
  );
}
