"use client";

import { Calculator } from "lucide-react";

export default function DutyPopularChips({ vehicles = [], activeId = null, onSelect, disabled = false }) {
  if (!vehicles.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Popular estimates</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">Tap to calculate instantly</p>
      </div>
      <ul className="flex flex-wrap gap-2">
        {vehicles.map((vehicle) => {
          const isActive = activeId === vehicle.id;
          return (
            <li key={vehicle.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect?.(vehicle)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border transition-colors disabled:opacity-50 ${
                  isActive
                    ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:!text-black"
                    : "border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-slate-200 hover:border-slate-900 dark:hover:border-white"
                }`}
                style={{ borderRadius: "var(--radius)" }}
              >
                <Calculator className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                {vehicle.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
