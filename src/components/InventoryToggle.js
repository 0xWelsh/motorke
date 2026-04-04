"use client";
// src/components/InventoryToggle.js
import { useState } from "react";

export default function InventoryToggle({ carId, available: initialAvailable }) {
  const [available, setAvailable] = useState(initialAvailable);
  const [loading,   setLoading]   = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/portal/cars/${carId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !available }),
    });
    if (res.ok) setAvailable(!available);
    setLoading(false);
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex-1 p-4 rounded-2xl font-black text-[13px] transition-all duration-300 border uppercase tracking-widest ${
        loading 
          ? "bg-slate-50 text-slate-300 border-slate-100 cursor-wait"
          : available 
            ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 shadow-sm" 
            : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 shadow-sm"
      }`}>
      {loading ? "…" : available ? "Mark Sold" : "Mark Live"}
    </button>
  );
}