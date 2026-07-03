"use client";
import { useState, useEffect } from "react";
import { useCompare } from "./CompareContext";
import Link from "next/link";
import Image from "next/image";
import { getThumbnailUrl } from "@/lib/image-transform";

// Floating compare bar — GSMArena style with thumbnails
export function CompareBar() {
  const { compareCars, removeFromCompare, clearCompare } = useCompare();

  if (compareCars.length === 0) return null;

  const compareUrl = `/compare?${compareCars.map((c, i) => `${"abc"[i]}=${c.id}`).join("&")}`;

  const handleRemove = (event, carId) => {
    event.preventDefault();
    event.stopPropagation();
    removeFromCompare(carId);
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clearCompare();
  };

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="bg-[#111827]/90 dark:bg-[#111111]/90 backdrop-blur-3xl border border-slate-700 dark:border-slate-800 p-2 shadow-2xl flex items-center justify-between gap-3 sm:gap-4" style={{ borderRadius: 'var(--radius)' }}>
        {/* Selected Cars Thumbnails */}
        <div className="hidden sm:flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
          {compareCars.map((car) => (
            <div key={car.id} className="relative group shrink-0">
              <div className="w-12 h-12 overflow-hidden bg-white dark:bg-slate-900 border border-white/20 shadow-lg transition-transform hover:scale-110" style={{ borderRadius: 'var(--radius)' }}>
                {car.image ? (
                  <Image src={getThumbnailUrl(car.image)} alt={car.model} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🚗</div>
                )}
              </div>
              <button
                type="button"
                onClick={(event) => handleRemove(event, car.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#111827] dark:bg-white border border-white/20 rounded-full flex items-center justify-center text-white dark:text-black hover:bg-red-500 dark:hover:bg-red-500 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-xl"
              >
                <span className="text-[11px] leading-none">×</span>
              </button>
            </div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
            <Link
              key={`empty-${i}`}
              href="/cars"
              className="w-12 h-12 border border-dashed border-white/20 hover:border-[#38A169]/70 flex items-center justify-center text-white/40 hover:text-[#38A169] transition-colors"
              style={{ borderRadius: 'var(--radius)' }}
              title="Add another car"
            >
              <span className="text-xl">+</span>
            </Link>
          ))}
        </div>

        {/* Info + Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pr-1 sm:pr-4 w-full sm:w-auto">
          <div className="sm:hidden text-left min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#38A169]">Compare</p>
            <p className="text-[10px] font-bold text-white/70">{compareCars.length}/3 selected</p>
            {compareCars.length >= 3 && (
              <p className="text-[9px] font-semibold text-white/50 mt-0.5 leading-tight">
                Full — tap × on a thumbnail to remove a car
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
              {compareCars.map((car) => (
                <button
                  key={car.id}
                  type="button"
                  onClick={(event) => handleRemove(event, car.id)}
                  className="inline-flex items-center gap-1 border border-white/20 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white/80"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <span className="max-w-[72px] truncate">{car.make}</span>
                  <span className="text-white">×</span>
                </button>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <Link
                  key={`mobile-empty-${i}`}
                  href="/cars"
                  className="inline-flex items-center justify-center w-7 h-7 border border-dashed border-white/30 text-white/60 hover:text-[#38A169] hover:border-[#38A169]/60"
                  style={{ borderRadius: 'var(--radius)' }}
                  title="Add another car"
                >
                  +
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden sm:block text-right min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#38A169]">Comparison Tool</p>
            <p className="text-xs font-bold text-white/70">{compareCars.length}/3 selected</p>
            {compareCars.length >= 3 && (
              <p className="text-[9px] font-semibold text-white/50 mt-0.5">
                Full — remove one to add another
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
               type="button"
               onClick={handleClear}
               className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors px-2 sm:px-3 h-10 flex items-center"
            >
               Clear
            </button>
            <Link 
              href={compareUrl}
              className="bg-[#38A169] text-white text-[10px] font-bold uppercase tracking-widest px-4 sm:px-6 h-10 flex items-center shadow-lg transition-all active:scale-95"
              style={{ borderRadius: 'var(--radius)' }}
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Button to add/remove a single car from the compare list
export function CompareButton({ car, className = "" }) {
  const { isInCompare, addToCompare, removeFromCompare, isFull } = useCompare();
  const [fullHint, setFullHint] = useState(false);
  const selected = isInCompare(car.id);
  const cantAdd = !selected && isFull;

  useEffect(() => {
    if (!fullHint) return;
    const t = setTimeout(() => setFullHint(false), 5000);
    return () => clearTimeout(t);
  }, [fullHint]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selected) {
      removeFromCompare(car.id);
      return;
    }
    if (isFull) {
      setFullHint(true);
      return;
    }
    addToCompare(car);
  };

  return (
    <div className={className}>
    <button
      type="button"
      onClick={handleToggle}
      className={`relative h-11 sm:h-10 w-full sm:w-auto text-[10px] font-bold uppercase tracking-widest transition-all duration-500 overflow-hidden group ${
        selected
          ? "bg-[#38A169] text-white px-6"
          : cantAdd
            ? "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 px-4"
            : "bg-white dark:bg-[#111111] border border-slate-100 dark:border-slate-800 text-[#718096] dark:text-slate-400 hover:text-[#111827] dark:hover:text-white hover:border-[#111827] dark:hover:border-white px-6 active:scale-95"
      } `}
      style={{ borderRadius: 'var(--radius)' }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {selected ? (
          <>
            <span className="text-sm">✓</span>
            <span>Added</span>
          </>
        ) : isFull ? (
          <span>3/3 full</span>
        ) : (
          <>
            <span className="text-lg leading-none">+</span>
            <span>Compare</span>
          </>
        )}
      </span>
      {!selected && !isFull && (
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-accent)]/0 via-[var(--brand-accent)]/5 to-[var(--brand-accent)]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}
    </button>
    {fullHint && (
      <p className="mt-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 leading-snug max-w-[220px]">
        Compare is full. Remove a car from the bar at the bottom, then add this one.
      </p>
    )}
    </div>
  );
}

