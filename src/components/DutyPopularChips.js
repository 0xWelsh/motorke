"use client";

import { Calculator } from "lucide-react";

function vehicleDetail(vehicle) {
  const parts = [];
  if (vehicle.engineCC) parts.push(`${vehicle.engineCC}cc`);
  if (vehicle.fuelType) parts.push(vehicle.fuelType);
  if (vehicle.year) parts.push(`${vehicle.year}`);
  return parts.length ? parts.join(" · ") : null;
}

export default function DutyPopularChips({ vehicles = [], activeId = null, onSelect, disabled = false }) {
  if (!vehicles.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Popular estimates</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">Tap to calculate instantly</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {vehicles.map((vehicle) => {
          const isActive = activeId === vehicle.id;
          return (
            <button
              key={vehicle.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(vehicle)}
              className={`text-left flex items-center gap-3 px-4 py-3 border transition-all disabled:opacity-50 hover:scale-[0.98] active:scale-95 ${
                isActive
                  ? "border-slate-900 dark:border-white bg-slate-900 dark:bg-white"
                  : "border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:border-slate-400 dark:hover:border-zinc-500"
              }`}
              style={{ borderRadius: "var(--radius)" }}
            >
              <div className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                isActive ? "bg-red-600" : "bg-red-100 dark:bg-red-900/30"
              }`} style={{ borderRadius: "var(--radius)" }}>
                <Calculator className={`w-4 h-4 ${
                  isActive ? "text-white" : "text-red-600 dark:text-red-400"
                }`} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${
                  isActive ? "text-white" : "text-slate-900 dark:text-white"
                }`}>
                  {vehicle.label}
                </p>
                {vehicleDetail(vehicle) && (
                  <p className={`text-[10px] mt-0.5 truncate ${
                    isActive ? "text-slate-300" : "text-slate-500"
                  }`}>
                    {vehicleDetail(vehicle)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
