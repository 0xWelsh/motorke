"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

export default function UserVerifyButton({ userId, initialDecision }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  async function decide(decision) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) setDone(decision);
    } finally {
      setBusy(false);
    }
  }

  if (done || initialDecision) {
    const d = done || initialDecision;
    return (
      <span className={`text-[11px] font-black uppercase tracking-widest ${d === "APPROVE" ? "text-[var(--accent)]" : "text-rose-400"}`}>
        {d === "APPROVE" ? "Verified" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => decide("APPROVE")}
        disabled={busy}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent-dim)] text-[var(--accent)] text-[11px] font-black uppercase tracking-wider hover:bg-[var(--accent)]/20 disabled:opacity-50"
      >
        <Check size={13} /> Verify
      </button>
      <button
        onClick={() => decide("REJECT")}
        disabled={busy}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-black uppercase tracking-wider hover:bg-rose-500/20 disabled:opacity-50"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Reject
      </button>
    </div>
  );
}
