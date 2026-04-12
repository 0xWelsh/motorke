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
      className={`flex-1 p-2.5 rounded-lg font-semibold text-xs transition-all ${
        loading 
          ? "bg-slate-100 text-slate-400 cursor-wait"
          : available 
            ? "bg-slate-100 hover:bg-slate-200 text-slate-900" 
            : "bg-slate-700 hover:bg-slate-800 text-white"
      }`}>
      {loading ? "…" : available ? "Mark Sold" : "Mark Live"}
    </button>
  );
}