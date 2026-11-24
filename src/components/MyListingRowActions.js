"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function MyListingRowActions({ carId }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function remove() {
    if (!confirm("Remove this listing? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/my-cars?id=${carId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 disabled:opacity-50"
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Remove
    </button>
  );
}
