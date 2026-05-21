"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import the map to avoid SSR 'window is not defined' errors
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl flex items-center justify-center bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 text-slate-500 text-sm font-black uppercase tracking-widest animate-pulse">
      Loading Map Engine...
    </div>
  ),
});

export default function LocationPicker({ defaultLat, defaultLng }) {
  const [lat, setLat] = useState(defaultLat || "");
  const [lng, setLng] = useState(defaultLng || "");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-900 dark:text-white mb-2">
          Pin Location (Optional)
        </label>
        {lat && lng && (
          <span className="text-[11px] text-[#ff5a2f] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl">
            ✓ Pinned
          </span>
        )}
      </div>
      
      {/* Hidden inputs to capture coordinates dynamically for the FormData */}
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
      
      <div className="h-[300px] w-full relative rounded-2xl border border-[#ddd4c8] dark:border-slate-800 group">
        <DynamicMap 
          defaultLat={defaultLat} 
          defaultLng={defaultLng} 
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }} 
        />
        {!lat && !lng && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 px-4 py-2 shadow-sm rounded-2xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white">Click map to pin</p>
            <p className="text-[10px] text-slate-500 mt-0.5 normal-case tracking-normal font-medium">
              Or save with address — we geocode in Kenya if no pin
            </p>
          </div>
        )}
      </div>
      
      {lat && lng && (
        <div className="flex gap-4 p-4 bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl">
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Latitude</p>
            <p className="text-xs font-mono text-slate-900 dark:text-white font-bold">{parseFloat(lat).toFixed(6)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Longitude</p>
            <p className="text-xs font-mono text-slate-900 dark:text-white font-bold">{parseFloat(lng).toFixed(6)}</p>
          </div>
          <button 
             type="button" 
             onClick={() => { setLat(""); setLng(""); }} 
             className="text-[11px] font-black uppercase tracking-[0.15em] text-red-500 hover:text-red-700 transition-all"
          >
             Remove
          </button>
        </div>
      )}
    </div>
  );
}
