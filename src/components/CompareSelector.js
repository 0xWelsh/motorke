"use client";
import { useState, useEffect } from "react";
import { useCompare } from "./CompareContext";
import Link from "next/link";
import Image from "next/image";
import { getThumbnailUrl } from "@/lib/image-transform";

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
      <div className="bg-[#111111]/90 backdrop-blur-3xl border border-white/[0.08] p-2 shadow-2xl flex items-center justify-between gap-3 sm:gap-4 rounded-xl">
        {/* Selected Cars Thumbnails */}
        <div className="hidden sm:flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
          {compareCars.map((car) => (
            <div key={car.id} className="relative group shrink-0">
              <div className="w-12 h-12 overflow-hidden bg-[#0f0f0f] border border-white/[0.08] shadow-lg transition-transform hover:scale-110 rounded-lg">
                {car.image ? (
                  <Image src={getThumbnailUrl(car.image)} alt={car.model} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🚗</div>
                )}
              </div>
              <button
                type="button"
                onClick={(event) => handleRemove(event, car.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1a1a1a] border border-white/[0.15] rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shadow-xl"
              >
                <span className="text-[11px] leading-none">×</span>
              </button>
            </div>
          ))}

          {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
            <Link
              key={`empty-${i}`}
              href="/cars"
              className="w-12 h-12 border border-dashed border-white/[0.12] hover:border-[var(--accent)]/50 flex items-center justify-center text-white/30 hover:text-[var(--accent)] transition-colors rounded-lg"
              title="Add another car"
            >
              <span className="text-xl">+</span>
            </Link>
          ))}
        </div>

        {/* Info + Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pr-1 sm:pr-4 w-full sm:w-auto">
          <div className="sm:hidden text-left min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Compare</p>
            <p className="text-[10px] font-bold text-white/60">{compareCars.length}/3 selected</p>
            {compareCars.length >= 3 && (
              <p className="text-[9px] font-semibold text-white/40 mt-0.5 leading-tight">
                Full — tap × on a thumbnail to remove a car
              </p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
              {compareCars.map((car) => (
                <button
                  key={car.id}
                  type="button"
                  onClick={(event) => handleRemove(event, car.id)}
                  className="inline-flex items-center gap-1 border border-white/[0.12] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white/70 rounded-lg"
                >
                  <span className="max-w-[72px] truncate">{car.make}</span>
                  <span className="text-white/50">×</span>
                </button>
              ))}
              {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
                <Link
                  key={`mobile-empty-${i}`}
                  href="/cars"
                  className="inline-flex items-center justify-center w-7 h-7 border border-dashed border-white/[0.15] text-white/40 hover:text-[var(--accent)] hover:border-[var(--accent)]/50 rounded-lg"
                  title="Add another car"
                >
                  +
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden sm:block text-right min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Comparison Tool</p>
            <p className="text-xs font-bold text-white/60">{compareCars.length}/3 selected</p>
            {compareCars.length >= 3 && (
              <p className="text-[9px] font-semibold text-white/40 mt-0.5">
                Full — remove one to add another
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
               type="button"
               onClick={handleClear}
               className="text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors px-2 sm:px-3 h-10 flex items-center"
            >
               Clear
            </button>
            <Link 
              href={compareUrl}
              className="bg-[var(--accent)] text-black text-[10px] font-bold uppercase tracking-widest px-4 sm:px-6 h-10 flex items-center shadow-lg transition-all active:scale-95 rounded-xl"
            >
              Compare
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      className={`relative h-11 sm:h-10 w-full sm:w-auto text-[10px] font-bold uppercase tracking-widest transition-all duration-500 overflow-hidden group rounded-xl ${
        selected
          ? "bg-[var(--accent)] text-black px-6"
          : cantAdd
            ? "bg-white/[0.04] border border-white/[0.06] text-zinc-500 px-4"
            : "bg-[#0f0f0f] border border-white/[0.08] text-zinc-400 hover:text-white hover:border-white/[0.2] px-6 active:scale-95"
      }`}
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
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/0 via-[var(--accent)]/5 to-[var(--accent)]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}
    </button>
    {fullHint && (
      <p className="mt-1.5 text-[10px] font-semibold text-zinc-400 leading-snug max-w-[220px]">
        Compare is full. Remove a car from the bar at the bottom, then add this one.
      </p>
    )}
    </div>
  );
}
