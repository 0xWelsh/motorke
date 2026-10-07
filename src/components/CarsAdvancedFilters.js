"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { BRANDS, BODY_TYPES } from "@/lib/browse-catalog";
import { FUEL_LABELS } from "@/lib/constants";

const TRANSMISSIONS = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "MANUAL", label: "Manual" },
];
const STEERING = ["RHD", "LHD"];
const CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "USED", label: "Used" },
];
const SEAT_OPTS = [2, 3, 4, 5, 6, 7, 8];

const FIELD_KEYS = [
  "make", "bodyType", "fuelType", "transmission", "steering", "condition",
  "color", "sunroof", "seats", "minYOM", "maxYOM",
];

function AdvancedInner({ colors = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(() => FIELD_KEYS.some((k) => searchParams.get(k)));

  const navigate = (patch) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v == null) p.delete(k);
      else p.set(k, String(v));
    }
    p.delete("page");
    const q = p.toString();
    router.push(q ? `/cars?${q}` : "/cars");
  };

  const activeCount = FIELD_KEYS.filter((k) => searchParams.get(k)).length;
  const val = (k) => searchParams.get(k) || "";

  // Free-text/number fields are typed locally and committed so navigation
  // never resets the field mid-keystroke; selects still apply instantly.
  const [minYVal, setMinYVal] = useState(val("minYOM"));
  const [maxYVal, setMaxYVal] = useState(val("maxYOM"));
  const commitRef = useRef(null);
  useEffect(() => () => clearTimeout(commitRef.current), []);
  useEffect(() => {
    setMinYVal(searchParams.get("minYOM") || "");
    setMaxYVal(searchParams.get("maxYOM") || "");
  }, [searchParams]);

  const commitSoon = (fn) => {
    clearTimeout(commitRef.current);
    // 400ms of dead time after the last keystroke made the year fields feel
    // broken. 250ms still collapses a burst of typing into one navigation.
    commitRef.current = setTimeout(fn, 250);
  };

  const selectCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-[var(--accent)]";
  const labelCls = "mb-1 block text-[10px] font-black uppercase tracking-widest text-slate-400";

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
      >
        <span className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          Advanced filters
          {activeCount > 0 && (
            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <label htmlFor="adv-make" className={labelCls}>Make</label>
              <select id="adv-make" className={selectCls} value={val("make")} onChange={(e) => navigate({ make: e.target.value })}>
                <option value="">Any make</option>
                {BRANDS.map((b) => (
                  <option key={b.name} value={b.make || b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adv-body" className={labelCls}>Body type</label>
              <select id="adv-body" className={selectCls} value={val("bodyType")} onChange={(e) => navigate({ bodyType: e.target.value })}>
                <option value="">Any body</option>
                {BODY_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adv-fuel" className={labelCls}>Fuel</label>
              <select id="adv-fuel" className={selectCls} value={val("fuelType")} onChange={(e) => navigate({ fuelType: e.target.value })}>
                <option value="">Any fuel</option>
                {Object.entries(FUEL_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adv-trans" className={labelCls}>Transmission</label>
              <select id="adv-trans" className={selectCls} value={val("transmission")} onChange={(e) => navigate({ transmission: e.target.value })}>
                <option value="">Any</option>
                {TRANSMISSIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adv-steer" className={labelCls}>Steering</label>
              <select id="adv-steer" className={selectCls} value={val("steering")} onChange={(e) => navigate({ steering: e.target.value })}>
                <option value="">Any</option>
                {STEERING.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adv-cond" className={labelCls}>Condition</label>
              <select id="adv-cond" className={selectCls} value={val("condition")} onChange={(e) => navigate({ condition: e.target.value })}>
                <option value="">Any</option>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adv-seats" className={labelCls}>Minimum seats</label>
              <select id="adv-seats" className={selectCls} value={val("seats")} onChange={(e) => navigate({ seats: e.target.value })}>
                <option value="">Any</option>
                {SEAT_OPTS.map((s) => (
                  <option key={s} value={s}>{s}+</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adv-year" className={labelCls}>Year</label>
              <div className="flex items-center gap-1.5">
                <input
                  id="adv-year-min"
                  type="number"
                  min={1980}
                  max={2030}
                  placeholder="From"
                  value={minYVal}
                  onChange={(e) => { setMinYVal(e.target.value); commitSoon(() => navigate({ minYOM: e.target.value })); }}
                  onBlur={() => navigate({ minYOM: minYVal })}
                  className={`${selectCls} w-full`}
                />
                <span className="text-slate-300">–</span>
                <input
                  id="adv-year-max"
                  type="number"
                  min={1980}
                  max={2030}
                  placeholder="To"
                  value={maxYVal}
                  onChange={(e) => { setMaxYVal(e.target.value); commitSoon(() => navigate({ maxYOM: e.target.value })); }}
                  onBlur={() => navigate({ maxYOM: maxYVal })}
                  className={`${selectCls} w-full`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="adv-color" className={labelCls}>Color</label>
              <select id="adv-color" className={selectCls} value={val("color")} onChange={(e) => navigate({ color: e.target.value })}>
                <option value="">Any color</option>
                {(colors.length ? colors : ["White", "Black", "Silver", "Grey", "Blue", "Red", "Brown", "Green", "Gold"]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-3 py-2">
              <input
                type="checkbox"
                checked={val("sunroof") === "1"}
                onChange={(e) => navigate({ sunroof: e.target.checked ? "1" : "" })}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-[13px] font-semibold text-slate-700">Has sunroof</span>
            </label>
          </div>

          {activeCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => navigate(Object.fromEntries(FIELD_KEYS.map((k) => [k, ""])))}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-[var(--accent)]"
              >
                <X className="h-3.5 w-3.5" /> Clear all advanced
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CarsAdvancedFilters({ colors = [] }) {
  return (
    <Suspense fallback={<div className="mb-4 h-11" />}>
      <AdvancedInner colors={colors} />
    </Suspense>
  );
}