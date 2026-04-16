"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import the map to avoid SSR 'window is not defined' errors
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 text-sm font-black uppercase tracking-widest animate-pulse">
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
        <label className="block text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 mb-2">
          Pin Location (Optional)
        </label>
        {lat && lng && (
          <span className="text-[10px] text-[#ff5a2f] font-bold uppercase tracking-widest px-2 py-0.5 bg-[#fbfcfe] border border-[#ddd4c8] rounded-none">
            ✓ Pinned
          </span>
        )}
      </div>
      
      {/* Hidden inputs to capture coordinates dynamically for the FormData */}
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
      
      <div className="h-[300px] w-full relative rounded-none border border-[#ddd4c8] group">
        <DynamicMap 
          defaultLat={defaultLat} 
          defaultLng={defaultLng} 
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
          }} 
        />
        {!lat && !lng && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none bg-white border border-[#ddd4c8] px-4 py-2 shadow-sm rounded-none">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900">Click to pin</p>
          </div>
        )}
      </div>
      
      {lat && lng && (
        <div className="flex gap-4 p-4 bg-[#fbfcfe] border border-[#ddd4c8] rounded-none">
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Latitude</p>
            <p className="text-xs font-mono text-slate-900 font-bold">{parseFloat(lat).toFixed(6)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Longitude</p>
            <p className="text-xs font-mono text-slate-900 font-bold">{parseFloat(lng).toFixed(6)}</p>
          </div>
          <button 
             type="button" 
             onClick={() => { setLat(""); setLng(""); }} 
             className="text-[10px] font-black uppercase tracking-[0.15em] text-red-500 hover:text-red-700 transition-none"
          >
             Remove
          </button>
        </div>
      )}
    </div>
  );
}
