"use client";
import { useState } from "react";
import { Map, LayoutGrid } from "lucide-react";
import SearchMapView from "./SearchMapView";

export default function SearchMapToggle({ cars }) {
  const [showMap, setShowMap] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowMap((v) => !v)}
        className={`inline-flex items-center gap-2 px-4 h-9 text-[11px] font-black uppercase tracking-[0.14em] border transition-all ${
          showMap
            ? "bg-[#111111] text-white border-[#111111]"
            : "bg-white text-slate-700 border-[#ddd4c8] hover:border-[#111111]/40 hover:text-slate-900"
        }`}
      >
        {showMap ? <LayoutGrid className="w-3.5 h-3.5" /> : <Map className="w-3.5 h-3.5" />}
        {showMap ? "Grid View" : "Map View"}
      </button>

      {showMap && (
        <div className="mt-4">
          <SearchMapView cars={cars} />
        </div>
      )}
    </>
  );
}
