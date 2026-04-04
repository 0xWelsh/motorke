"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import the map to avoid SSR 'window is not defined' errors
const DynamicMap = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/30 text-sm font-black uppercase tracking-widest animate-pulse">
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
         <label className="block text-xs text-white/40 uppercase tracking-wider">
            Pin Location (Optional)
         </label>
         {lat && lng && (
           <span className="text-[10px] text-black font-bold uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded-full">
             ✓ Pinned
           </span>
         )}
      </div>
      
      {/* Hidden inputs to capture coordinates dynamically for the FormData */}
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
      
      <div className="h-[300px] relative rounded-xl group">
         <DynamicMap 
           defaultLat={defaultLat} 
           defaultLng={defaultLng} 
           onChange={(newLat, newLng) => {
             setLat(newLat);
             setLng(newLng);
           }} 
         />
         {!lat && !lng && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] pointer-events-none bg-black/80 backdrop-blur px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
               <p className="text-xs text-white font-bold tracking-tight">Click anywhere on the map to drop a pin.</p>
            </div>
         )}
      </div>
      
      {lat && lng && (
        <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
          <div className="flex-1">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Latitude</p>
            <p className="text-xs font-mono text-white/70">{lat.toFixed(6)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Longitude</p>
            <p className="text-xs font-mono text-white/70">{lng.toFixed(6)}</p>
          </div>
          <button 
             type="button" 
             onClick={() => { setLat(""); setLng(""); }} 
             className="text-xs font-bold text-black hover:text-white transition-colors"
          >
             Remove Pin
          </button>
        </div>
      )}
    </div>
  );
}
