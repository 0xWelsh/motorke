"use client";
import { useCompare } from "./CompareContext";
import Link from "next/link";
import Image from "next/image";

// Floating compare bar — GSMArena style with thumbnails
export function CompareBar() {
  const { compareCars, removeFromCompare, clearCompare } = useCompare();

  if (compareCars.length === 0) return null;

  const compareUrl = `/compare?${compareCars.map((c, i) => `${"abc"[i]}=${c.id}`).join("&")}`;

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <div className="bg-[var(--brand)]/90 backdrop-blur-3xl border border-[#ddd4c8] rounded-full sm:rounded-full p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between gap-3 sm:gap-4">
        {/* Selected Cars Thumbnails */}
        <div className="hidden sm:flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
          {compareCars.map((car) => (
            <div key={car.id} className="relative group shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-white/20 shadow-lg transition-transform hover:scale-110">
                {car.image ? (
                  <Image src={car.image} alt={car.model} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🚗</div>
                )}
              </div>
              <button
                onClick={() => removeFromCompare(car.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center text-white hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
              >
                <span className="text-[10px] leading-none">×</span>
              </button>
            </div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-slate-900/20 select-none">
              <span className="text-xl">+</span>
            </div>
          ))}
        </div>

        {/* Info + Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pr-1 sm:pr-4 w-full sm:w-auto">
          <div className="sm:hidden text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Compare</p>
            <p className="text-[10px] font-bold text-slate-900/70">{compareCars.length}/3 selected</p>
          </div>

          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-accent)]">Comparison Tool</p>
            <p className="text-xs font-bold text-slate-900/70">{compareCars.length}/3 selected</p>
          </div>

          <div className="flex items-center gap-2">
            <button
               onClick={clearCompare}
               className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors px-2 sm:px-3 h-10 flex items-center"
            >
               Clear
            </button>
            <Link 
              href={compareUrl}
              className="bg-white text-[var(--brand)] hover:bg-[var(--brand-light)] text-[11px] font-black uppercase tracking-widest px-4 sm:px-6 h-10 rounded-full sm:rounded-full flex items-center shadow-lg transition-all active:scale-95"
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
export function CompareButton({ car }) {
  const { isInCompare, addToCompare, removeFromCompare, isFull } = useCompare();
  const selected = isInCompare(car.id);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (selected) {
      removeFromCompare(car.id);
    } else {
      addToCompare(car);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={!selected && isFull}
      className={`relative h-11 sm:h-10 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden group ${
        selected
          ? "bg-[var(--brand-light)] border border-[var(--brand-accent)]/30 text-[var(--brand)] px-6"
          : isFull 
            ? "bg-[#fbfcfe] border border-[#ddd4c8] text-slate-300 cursor-not-allowed px-4"
            : "bg-[#fbfcfe] border border-[#ddd4c8] text-slate-500 hover:text-[var(--brand)] hover:border-[var(--brand-accent)]/20 hover:bg-[var(--brand-light)] px-6 active:scale-95"
      }`}
    >
      <span className="relative z-10 flex items-center gap-2">
        {selected ? (
          <>
            <span className="text-sm">✓</span> 
            <span>Added</span>
          </>
        ) : isFull ? (
          <span>Slot Full</span>
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
  );
}

