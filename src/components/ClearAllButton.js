"use client";
import { useState } from "react";
import { useModal } from "@/components/Modal";

export default function ClearAllButton({ dealerId = null }) {
  const [loading, setLoading] = useState(false);
  const { danger, success, alert } = useModal();

  async function handleClick() {
    const msg = dealerId
      ? "Delete ALL cars for this dealer? This cannot be undone."
      : "Delete ALL cars from the entire platform? Every car, photo and enquiry will be permanently removed.";

    const confirmed = await danger(msg, {
      title: "Clear all cars",
      confirmLabel: "Yes, delete everything",
    });
    if (!confirmed) return;

    setLoading(true);
    try {
      const res  = await fetch("/api/admin/cars/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerId }),
      });
      const data = await res.json();
      if (data.success) {
        await success(`Deleted ${data.count} car${data.count !== 1 ? "s" : ""} successfully.`, { title: "Done" });
        window.location.reload();
      } else {
        await alert("Error: " + (data.error || "Unknown error"), { type: "danger", title: "Failed" });
      }
    } catch (err) {
      await alert("Failed: " + err.message, { type: "danger", title: "Error" });
    }
    setLoading(false);
  }

  return (
    <button type="button" onClick={handleClick} disabled={loading} style={{
      fontSize: 13, border: "1px solid #fecaca", borderRadius: 10,
      padding: "9px 16px", color: "#dc2626", background: "#fef2f2",
      cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "inherit", fontWeight: 700,
      opacity: loading ? 0.6 : 1,
    }}>
      {loading ? "Deleting…" : "🗑 Clear all cars"}
    </button>
  );
}