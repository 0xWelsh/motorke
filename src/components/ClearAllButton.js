"use client";
// src/components/ClearAllButton.js

import { useState } from "react";

export default function ClearAllButton({ dealerId = null }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    const msg = dealerId
      ? "Delete ALL cars for this dealer? This cannot be undone."
      : "Delete ALL car listings from the entire platform? This cannot be undone.";

    if (!confirm(msg)) return;
    if (!confirm("Are you absolutely sure? This will delete every listing, photo and enquiry.")) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/admin/cars/clear", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dealerId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Deleted ${data.count} car${data.count !== 1 ? "s" : ""} successfully.`);
        window.location.reload();
      } else {
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Failed: " + err.message);
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        fontSize: 13, border: "1px solid #fecaca", borderRadius: 10,
        padding: "9px 16px", color: "#dc2626", background: "#fef2f2",
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "inherit", fontWeight: 700,
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? "Deleting…" : "🗑 Clear all listings"}
    </button>
  );
}