"use client";
import { useCompare } from "./CompareContext";
import Link from "next/link";
import Image from "next/image";

// Floating compare bar — GSMArena style with thumbnails
export function CompareBar() {
  const { compareCars, removeFromCompare, clearCompare, isFull } = useCompare();

  if (compareCars.length === 0) return null;

  const compareUrl = `/compare?${compareCars.map((c, i) => `${"abc"[i]}=${c.id}`).join("&")}`;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-[#121212]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(249,115,22,0.1)] flex items-center justify-between gap-4">
        {/* Selected Cars Thumbnails */}
        <div className="flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
          {compareCars.map((car) => (
            <div key={car.id} className="relative group shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-lg">
                {car.image ? (
                  <Image src={car.image} alt={car.model} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🚗</div>
                )}
              </div>
              <button
                onClick={() => removeFromCompare(car.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
              >
                <span className="text-[10px] leading-none">×</span>
              </button>
            </div>
          ))}

          {/* Empty Slots */}
          {Array.from({ length: 3 - compareCars.length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-12 h-12 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-white/10 select-none">
              <span className="text-xl">+</span>
            </div>
          ))}
        </div>

        {/* Info + Actions */}
        <div className="flex items-center gap-4 pr-4">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#f97316]">Comparison</p>
            <p className="text-xs font-bold text-white/50">{compareCars.length}/3 selected</p>
          </div>

          <div className="flex items-center gap-2">
            <button
               onClick={clearCompare}
               className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors px-3 h-10 flex items-center"
            >
               Clear
            </button>
            <Link 
              href={compareUrl}
              className="bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest px-6 h-10 rounded-2xl flex items-center shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
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
      className={`relative h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 overflow-hidden group ${
        selected
          ? "bg-orange-500/10 border border-orange-500/40 text-orange-500 px-6"
          : isFull 
            ? "bg-white/5 border border-white/5 text-white/10 cursor-not-allowed px-4"
            : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 hover:bg-white/10 px-6 active:scale-95"
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
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/5 to-orange-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}
    </button>
  );
}

