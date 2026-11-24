"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";

export default function ListingReviewActions({ carId }) {
  const [busy, setBusy] = useState(null);
  const router = useRouter();

  async function decide(decision) {
    setBusy(decision);
    try {
      const res = await fetch(`/api/admin/listings/${carId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => decide("APPROVE")}
        disabled={Boolean(busy)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black text-[11px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-50"
      >
        {busy === "APPROVE" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Approve & publish
      </button>
      <button
        onClick={() => decide("REJECT")}
        disabled={Boolean(busy)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-widest hover:bg-rose-500/20 disabled:opacity-50"
      >
        {busy === "REJECT" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
        Reject
      </button>
    </div>
  );
}
