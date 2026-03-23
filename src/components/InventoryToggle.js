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
      style={{
        flex: 1, padding: "7px", borderRadius: 8, border: "1.5px solid",
        fontWeight: 600, fontSize: 12, cursor: loading ? "wait" : "pointer",
        fontFamily: "inherit", transition: "all 0.15s",
        background:   available ? "#fef2f2"  : "#f0fdf4",
        color:        available ? "#991b1b"  : "#166534",
        borderColor:  available ? "#fecaca"  : "#bbf7d0",
      }}>
      {loading ? "…" : available ? "Mark sold" : "Mark live"}
    </button>
  );
}