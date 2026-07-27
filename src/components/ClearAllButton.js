"use client";
import { useState } from "react";
import { useModal } from "@/components/Modal";

export default function ClearAllButton({ dealerId = null }) {
  const [loading, setLoading] = useState(false);
  const { danger, success, alert } = useModal();

  async function handleClick() {
    const msg = dealerId
      ? "Delete ALL cars for this dealer? This cannot be undone."
      : "Delete ALL car listings from the entire platform? Every listing, photo and enquiry will be permanently removed.";

    const confirmed = await danger(msg, {
      title: "Clear all listings",
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
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border-2 border-rose-800 bg-rose-700 px-4 py-3 text-[11px] font-black uppercase tracking-[0.1em] text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Deleting…" : "Clear all listings"}
    </button>
  );
}
