"use client";

import { useState } from "react";
import { Calculator, ChevronDown, ChevronUp } from "lucide-react";

const FUEL_OPTIONS = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "LPG", label: "LPG" },
];

const currentYear = new Date().getFullYear();

export default function DutyCustomEstimate({ open: controlledOpen, onOpenChange, onSubmit, loading = false }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [year, setYear] = useState(String(currentYear - 2));
  const [engineCC, setEngineCC] = useState("2000");
  const [fuelType, setFuelType] = useState("PETROL");
  const [crspKes, setCrspKes] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    const y = parseInt(year, 10);
    const cc = parseInt(engineCC, 10);
    const crsp = parseInt(String(crspKes).replace(/\D/g, ""), 10);

    if (!make.trim() || !model.trim()) {
      setFormError("Make and model are required.");
      return;
    }
    if (!Number.isFinite(y) || y < 1980 || y > currentYear + 1) {
      setFormError("Enter a valid model year.");
      return;
    }
    if (!Number.isFinite(cc) || cc < 600 || cc > 8000) {
      setFormError("Engine CC should be between 600 and 8000.");
      return;
    }
    if (!Number.isFinite(crsp) || crsp <= 0) {
      setFormError("Enter the KRA CRSP value in KES (from your agent or KRA schedule).");
      return;
    }

    onSubmit?.({
      make: make.trim(),
      model: model.trim(),
      trim: trim.trim() || undefined,
      year: y,
      engineCC: cc,
      fuelType,
      crspKes: crsp,
    });
  };

  return (
    <div
      className="border border-dashed border-slate-300 dark:border-zinc-600 bg-slate-50/80 dark:bg-zinc-900/40"
      style={{ borderRadius: "var(--radius)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
          Can&apos;t find your car? Enter details manually
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
        )}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-3 border-t border-slate-200 dark:border-zinc-700">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-3 leading-relaxed">
            Use the CRSP from KRA or your clearing agent. We&apos;ll calculate taxes even if this exact variant is not
            in our catalog yet.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Make</span>
              <input
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota"
                className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ borderRadius: "var(--radius)" }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Model</span>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Wish"
                className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ borderRadius: "var(--radius)" }}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trim (optional)</span>
              <input
                value={trim}
                onChange={(e) => setTrim(e.target.value)}
                placeholder="e.g. TX, Premium"
                className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ borderRadius: "var(--radius)" }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Year</span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={1980}
                max={currentYear + 1}
                className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ borderRadius: "var(--radius)" }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Engine CC</span>
              <input
                type="number"
                value={engineCC}
                onChange={(e) => setEngineCC(e.target.value)}
                min={600}
                max={8000}
                className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ borderRadius: "var(--radius)" }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fuel</span>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ borderRadius: "var(--radius)" }}
              >
                {FUEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">KRA CRSP (KES)</span>
              <input
                value={crspKes}
                onChange={(e) => setCrspKes(e.target.value)}
                inputMode="numeric"
                placeholder="e.g. 2,400,000"
                className="h-10 px-3 text-sm border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                style={{ borderRadius: "var(--radius)" }}
              />
            </label>
          </div>

          {formError && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 px-5 bg-slate-900 dark:bg-white text-white dark:!text-black text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
            style={{ borderRadius: "var(--radius)" }}
          >
            <Calculator className="w-4 h-4" aria-hidden />
            {loading ? "Calculating…" : "Calculate from CRSP"}
          </button>
        </form>
      )}
    </div>
  );
}
