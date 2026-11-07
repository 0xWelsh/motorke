// src/components/compare/CompareSpecsMatrix.js
"use client";
import { Fragment } from "react";
import Image from "next/image";
import { X, Search, Check, Minus } from "lucide-react";
import { carListingPath } from "@/lib/car-listing-url";
import { formatCarPrice } from "@/lib/utils";
import { getThumbnailUrl } from "@/lib/image-transform";
import { isAllNA, isDifferent, isMissing, getBest, carPhotoUrl, importTone } from "./compare-utils";
import { SLOT_KEYS } from "./compare-config";

export default function CompareSpecsMatrix({
  fullComparedCars,
  comparedSlots,
  getInsights,
  specGroups,
  shouldShowSpec,
  removeFromCompare,
  setActiveSlot,
  setSearchQuery,
  setSearchSlotError,
  showDiffOnly,
  overallWinner,
  activeMobileSlot,
  setActiveMobileSlot,
}) {
  const mobileCar = comparedSlots[activeMobileSlot] || null;
  const mobileQuickSpecs = [
    { id: "price", label: "Price", rank: "min", pick: (c) => ({ value: formatCarPrice(c), raw: c?.price }) },
    { id: "annualTco", label: "Annual TCO", rank: "min", pick: (c) => ({ value: getInsights(c)?.tco?.annualTotal ? formatCarPrice({ price: getInsights(c).tco.annualTotal }) : "Not specified", raw: getInsights(c)?.tco?.annualTotal }) },
    { id: "road", label: "Road", rank: "max", pick: (c) => ({ value: `${getInsights(c)?.roadSuitabilityScore ?? "Not specified"}/100`, raw: getInsights(c)?.roadSuitabilityScore }) },
    { id: "import", label: "Imported", rank: "booltrue", pick: (c) => ({ value: c?.imported ? "Yes" : "No", raw: c?.imported }) },
  ];

  const mobileFilledSlots = [0, 1, 2].filter((idx) => comparedSlots[idx]);
  const mobileEmptySlots = [0, 1, 2].filter((idx) => !comparedSlots[idx]);

  const visibleSpecs = specGroups.flatMap((g) =>
    g.specs.filter((spec) => {
      if (!shouldShowSpec(spec)) return false;
      if (isAllNA(spec, fullComparedCars)) return false;
      if (showDiffOnly && !isDifferent(spec, fullComparedCars) && fullComparedCars.length > 1) return false;
      return true;
    })
  );
  const totalVisible = visibleSpecs.length;

  return (
    <div
      id="compare-specs"
      data-tour="specs"
      className="order-2 lg:order-6 scroll-mt-24 relative border border-slate-200 overflow-hidden bg-white mb-8 sm:mb-10 lg:mb-12 shadow-2xl"
      style={{ borderRadius: "var(--radius)" }}
    >
      {/* Mobile View */}
      {fullComparedCars.length > 0 && (
        <div className="lg:hidden no-print p-4 sm:p-5 space-y-4 border-b border-slate-200">
          <div className="sticky top-[5.25rem] z-30 -mx-4 px-4 py-2 bg-white/95 backdrop-blur border-b border-slate-200 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0 sm:mx-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 no-scrollbar">
              {mobileFilledSlots.map((idx) => {
                const c = comparedSlots[idx];
                if (!c) return null;
                const label = `${c.make} ${c.model}`.trim();
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMobileSlot(idx)}
                    className={`shrink-0 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-colors shadow-sm ${
                      activeMobileSlot === idx
                        ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                        : "bg-white border-slate-200 text-slate-500"
                    }`}
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {label.length > 24 ? `${label.slice(0, 22)}…` : label}
                  </button>
                );
              })}
              {mobileEmptySlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchSlotError("");
                    setActiveSlot(mobileEmptySlots[0]);
                  }}
                  className="shrink-0 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-dashed border-accent text-[var(--accent)] bg-accent-wash"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  + Add car
                </button>
              )}
            </div>
          </div>
          {mobileCar ? (
            <>
              <p className="text-[11px] font-semibold text-slate-500">
                Tap tabs to switch the full sheet. Quick side-by-side is below.
              </p>
              {fullComparedCars.length >= 2 && (
                <div className="border border-slate-200 bg-slate-50 p-2 sm:p-2.5" style={{ borderRadius: "var(--radius)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">At a glance</p>
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[420px]">
                      <div className="grid grid-cols-[minmax(88px,104px)_repeat(3,minmax(96px,1fr))] border border-slate-200 bg-white" style={{ borderRadius: "10px" }}>
                        <div className="px-1.5 py-1.5 border-r border-slate-200" />
                        {SLOT_KEYS.map((_, idx) => {
                          const c = comparedSlots[idx];
                          return (
                            <div key={idx} className={`px-1.5 py-1.5 border-r border-slate-200 last:border-r-0 min-w-0 ${idx === activeMobileSlot ? "bg-accent-dim" : ""}`}>
                              {c ? (
                                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500 truncate">
                                  {c.make} {c.model}
                                </p>
                              ) : (
                                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">—</p>
                              )}
                            </div>
                          );
                        })}
                        {mobileQuickSpecs.map((spec) => {
                          if (isAllNA(spec, fullComparedCars)) return null;
                          const best = getBest(spec, fullComparedCars);
                          return (
                            <Fragment key={spec.id}>
                              <div className="px-1.5 py-1.5 border-t border-r border-slate-200 text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-snug">
                                {spec.label}
                              </div>
                        {SLOT_KEYS.map((_, idx) => {
                                const c = comparedSlots[idx];
                                if (!c) {
                                  return <div key={`${spec.id}-${idx}`} className="px-1.5 py-1.5 border-t border-r border-slate-200 last:border-r-0 text-[10px] text-slate-400">—</div>;
                                }
                                const { value, raw } = spec.pick(c);
                                const isBest = best != null && raw === best;
                                const missing = isMissing(raw);
                                return (
                                  <div key={`${spec.id}-${idx}`} className={`px-1.5 py-1.5 border-t border-r border-slate-200 last:border-r-0 text-[10px] font-bold tabular-nums leading-snug min-w-0 ${missing ? "text-slate-400 italic" : isBest ? "text-slate-900" : "text-slate-500"}`}>
                                    {value}
                                  </div>
                                );
                              })}
                            </Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                {specGroups.map((group) => (
                  <div key={group.name} className="space-y-0">
                    <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-[0.18em] border-b border-slate-200 pb-1.5 mb-0.5">
                      {group.name}
                    </h4>
                    <div className="divide-y divide-slate-100">
                      {group.specs.map((spec) => {
                        if (!shouldShowSpec(spec)) return null;
                        if (isAllNA(spec, fullComparedCars)) return null;
                        const diff = isDifferent(spec, fullComparedCars);
                        if (showDiffOnly && !diff && fullComparedCars.length > 1) return null;
                        const { value, raw } = spec.pick(mobileCar);
                        return (
                          <div
                            key={spec.id}
                            className={`flex items-start justify-between gap-2 py-2 ${
                              diff ? "bg-accent-wash -mx-2 px-2 rounded-sm border-l-2 border-[var(--accent)]" : ""
                            }`}
                          >
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider min-w-0 max-w-[48%] leading-snug">
                              {spec.label}
                            </span>
                            <span className={`text-[11px] font-bold text-right tabular-nums break-words max-w-[52%] ${isMissing(raw) ? "text-slate-400 italic" : "text-slate-900"}`}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto no-scrollbar">
        <div className="min-w-[720px] sm:min-w-[880px]">
          {/* Header Row */}
          <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200">
            <div className="grid grid-cols-[minmax(112px,140px)_1fr_1fr_1fr] sm:grid-cols-[minmax(160px,220px)_1fr_1fr_1fr]">
              <div className="px-3 py-4 sm:px-4 sm:py-5 border-r border-slate-200 flex items-end justify-center bg-white sticky left-0 z-50">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em]">Specifications</span>
              </div>
              {SLOT_KEYS.map((_, idx) => {
                const car = comparedSlots[idx];
                const hydrated = !!(car && car.id);
                return (
                  <div key={idx} className="px-3 py-4 sm:px-4 sm:py-5 border-r border-slate-200 last:border-r-0 min-w-0">
                    {car ? (
                      <div className="relative group">
                        <button onClick={() => removeFromCompare(car.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-slate-200 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all hover:border-slate-400 z-10">
                          <X className="w-3 h-3 text-slate-500" />
                        </button>
                        <div className="aspect-[16/9] bg-slate-50 overflow-hidden mb-3 border border-slate-200" style={{ borderRadius: 'var(--radius)' }}>
                          {carPhotoUrl(car) ? <Image src={getThumbnailUrl(carPhotoUrl(car))} alt={car.model} fill className="object-cover" /> : null}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{car.year}</p>
                        <h3 className="text-sm sm:text-base font-bold font-sans text-slate-900 leading-snug line-clamp-2">
                          {car.make} {car.model}
                        </h3>
                        {overallWinner?.id === car.id && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 shadow-xl z-20 border border-white/20" style={{ borderRadius: '20px' }}>
                            Top Pick
                          </div>
                        )}
                        {hydrated && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-[7px] font-bold text-slate-500 uppercase tracking-widest" style={{ borderRadius: '4px' }}>ROAD {getInsights(car)?.roadSuitabilityScore}</span>
                            <span className={`px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-widest border ${importTone(car?.imported)}`} style={{ borderRadius: '4px' }}>
                              {car?.imported ? "IMPORTED" : "LOCAL"}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative group flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-300 transition-colors hover:border-accent-glow" style={{ borderRadius: 'var(--radius)' }}>
                        <button onClick={() => { setSearchSlotError(""); setActiveSlot(idx); }} className="w-12 h-12 bg-white border border-slate-200 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                          <Search className="w-4 h-4 text-slate-400" />
                        </button>
                        <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Data</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Matrix Rows */}
          <div className="divide-y divide-slate-100 border-t border-slate-200">
            {specGroups.map((group) => (
              <div key={group.name} className="border-b border-slate-200 last:border-b-0">
                <div className="grid grid-cols-[minmax(112px,140px)_1fr] sm:grid-cols-[minmax(160px,220px)_1fr] px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 items-center sticky left-0">
                  <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-[0.2em]">{group.name} System</h4>
                  <div className="h-px bg-slate-200 ml-4 sm:ml-6" />
                </div>
                <div className="divide-y divide-slate-100">
                  {group.specs.map((spec) => {
                    if (!shouldShowSpec(spec)) return null;
                    if (isAllNA(spec, fullComparedCars)) return null;
                    const diff = isDifferent(spec, fullComparedCars);
                    if (showDiffOnly && !diff && fullComparedCars.length > 1) return null;

                    return (
                      <div key={spec.label} className={`grid grid-cols-[minmax(112px,140px)_1fr_1fr_1fr] sm:grid-cols-[minmax(160px,220px)_1fr_1fr_1fr] transition-colors ${diff ? 'bg-accent-wash' : 'hover:bg-slate-50'}`}>
                        <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-r border-slate-200 flex items-center justify-between bg-white sticky left-0 z-30 min-w-0">
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-snug">{spec.label}</span>
                          {diff && <span className="w-1 h-1 shrink-0 bg-[var(--accent)] rounded-full" />}
                        </div>
                        {SLOT_KEYS.map((_, idx) => {
                          const car = comparedSlots[idx];
                          if (!car) return <div key={idx} className="px-3 py-2.5 sm:px-4 sm:py-3 border-r border-slate-200 last:border-r-0 min-w-0" />;
                          const { value, raw } = spec.pick(car);
                          const best = getBest(spec, fullComparedCars);
                          const isBest = best != null && raw === best;
                          const missing = isMissing(raw);
                          return (
                            <div key={idx} className="px-3 py-2.5 sm:px-4 sm:py-3 border-r border-slate-200 last:border-r-0 text-right font-bold tabular-nums min-w-0">
                              <span className={`text-[11px] sm:text-xs inline-block text-right leading-snug ${missing ? 'text-slate-400 italic' : isBest ? 'text-slate-900' : 'text-slate-500'}`}>{value}</span>
                              {isBest && <div className="mt-0.5 text-[7px] font-bold text-[var(--accent)] uppercase tracking-widest text-right">Optimized</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Coverage Footer */}
          {totalVisible > 0 && (
            <div className="border-t border-slate-200">
              <div className="grid grid-cols-[minmax(112px,140px)_1fr_1fr_1fr] sm:grid-cols-[minmax(160px,220px)_1fr_1fr_1fr] bg-slate-50">
                <div className="px-3 py-3 sm:px-4 sm:py-3 border-r border-slate-200 flex items-center bg-white sticky left-0 z-30">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Data coverage</span>
                </div>
                {SLOT_KEYS.map((_, idx) => {
                  const car = comparedSlots[idx];
                  if (!car) return <div key={idx} className="px-3 py-3 sm:px-4 sm:py-3 border-r border-slate-200 last:border-r-0" />;
                  const filled = visibleSpecs.filter((s) => !isMissing(s.pick(car).raw)).length;
                  const pct = totalVisible > 0 ? Math.round((filled / totalVisible) * 100) : 0;
                  return (
                    <div key={idx} className="px-3 py-3 sm:px-4 sm:py-3 border-r border-slate-200 last:border-r-0 text-right min-w-0">
                      <span className="text-[10px] font-bold tabular-nums text-slate-500">
                        {filled}/{totalVisible} <span className="text-[8px] font-normal text-slate-400">specs</span>
                      </span>
                      <div className="w-full bg-slate-200 h-1 mt-1.5 rounded-full overflow-hidden" style={{ borderRadius: "2px" }}>
                        <div
                          className="h-full rounded-full transition-all bg-[var(--accent)]"
                          style={{ width: `${pct}%`, borderRadius: "2px" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
