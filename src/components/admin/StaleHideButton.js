"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Hides the passed stale listing IDs via the shared admin actions endpoint,
// then refreshes the page so the dry-run list reflects reality.
export default function StaleHideButton({ ids = [] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (ids.length === 0) return null;

  async function hideAll() {
    if (!confirm(`Hide ${ids.length} stale listing${ids.length > 1 ? "s" : ""}? They can be re-shown from Inventory later.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/cars/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action: "setHidden" }),
      });
      if (res.ok) router.refresh();
      else alert("Failed to hide listings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={hideAll}
      disabled={busy}
      className="rounded-md bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
    >
      {busy ? "Hiding…" : `Hide ${ids.length} stale listing${ids.length > 1 ? "s" : ""}`}
    </button>
  );
}