// src/components/compare/CompareTcoSummary.js
"use client";
import { Info } from "lucide-react";
import { formatKesCompact } from "./compare-utils";

function TooltipLabel({ label, tip }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <span className="relative inline-flex group/tt">
        <button
          type="button"
          aria-label={`${label} info`}
          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-slate-200 text-slate-500 hover:text-slate-700"
        >
          <Info className="w-2.5 h-2.5" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-[calc(100%+6px)] z-30 w-48 p-2 text-[10px] font-semibold normal-case tracking-normal leading-relaxed text-slate-700 bg-white border border-slate-200 shadow-lg opacity-0 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 transition-opacity"
          style={{ borderRadius: "8px" }}
        >
          {tip}
        </span>
      </span>
    </span>
  );
}

export default function CompareTcoSummary({ 
  kenyaLensSummary, 
  fullComparedCars, 
  currentTutorialKey 
}) {
  if (!kenyaLensSummary) return null;

  const stats = [
    {
      label: "Annual TCO Gap",
      tip: "Difference between the highest and lowest yearly ownership cost in this set.",
      value: `${formatKesCompact(kenyaLensSummary.annualTcoSpread)}/yr`,
      sub: "Set Variance",
    },
    {
      label: "Top Road Score",
      tip: "Highest road-readiness score among the compared vehicles.",
      value: `${kenyaLensSummary.bestRoadScore}/100`,
      sub: "Highest Readiness",
    },
    {
      label: "Cars Compared",
      tip: "Total number of vehicles currently loaded in this comparison set.",
      value: `${fullComparedCars.length} Assets`,
      sub: "Current Set",
    }
  ];

  return (
    <div
      id="compare-summary"
      data-tour="summary"
      className={`order-3 lg:order-2 scroll-mt-24 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 ${currentTutorialKey === "summary" ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)] p-1" : ""}`}
      style={currentTutorialKey === "summary" ? { borderRadius: "var(--radius)" } : undefined}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-white border border-slate-200 p-4 sm:p-5 flex flex-col justify-between"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              <TooltipLabel label={stat.label} tip={stat.tip} />
            </p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {stat.value}
            </p>
          </div>
          <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
            {stat.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
