"use client";

// src/components/admin/DealerFlagToggles.js
// Inline admin-only controls to flip a dealer's `verified` and `featured`
// flags from the dealer list page. Posts to /api/admin/dealers/:id/flags
// and refreshes the route on success so the page reflects new state.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Star, Loader2 } from "lucide-react";

export default function DealerFlagToggles({ dealerId, verified, featured }) {
  const router = useRouter();
  const [verifiedState, setVerifiedState] = useState(verified);
  const [featuredState, setFeaturedState] = useState(featured);
  const [busyFlag, setBusyFlag] = useState(null);
  const [, startTransition] = useTransition();

  async function toggle(flag, currentValue, setLocal) {
    if (busyFlag) return;
    const next = !currentValue;
    setBusyFlag(flag);
    setLocal(next);
    try {
      const res = await fetch(`/api/admin/dealers/${dealerId}/flags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag, value: next }),
      });
      if (!res.ok) {
        setLocal(currentValue);
        const detail = await res.json().catch(() => ({}));
        console.error("Toggle failed:", detail);
        alert(detail?.error || "Could not update dealer.");
      } else {
        startTransition(() => router.refresh());
      }
    } catch (err) {
      setLocal(currentValue);
      console.error("Toggle network error:", err);
      alert("Network error. Try again.");
    } finally {
      setBusyFlag(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => toggle("verified", verifiedState, setVerifiedState)}
        disabled={busyFlag !== null}
        aria-pressed={verifiedState}
        title={verifiedState ? "Click to remove verified status" : "Click to mark as verified"}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition disabled:opacity-50 ${
          verifiedState
            ? "border-emerald-900/60 bg-emerald-950/50 text-emerald-300 hover:border-emerald-400"
            : "border-sky-900/50 bg-sky-950/40 text-sky-200 hover:border-sky-400"
        }`}
      >
        {busyFlag === "verified" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <ShieldCheck size={14} />
        )}
        {verifiedState ? "Verified" : "Pending"}
      </button>

      <button
        type="button"
        onClick={() => toggle("featured", featuredState, setFeaturedState)}
        disabled={busyFlag !== null}
        aria-pressed={featuredState}
        title={featuredState ? "Click to remove from homepage" : "Click to feature on homepage"}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider border transition disabled:opacity-50 ${
          featuredState
            ? "border-emerald-800/50 bg-emerald-950/35 text-emerald-300 hover:border-emerald-400"
            : "border-white/[0.06] bg-[#1c1c1c] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        }`}
      >
        {busyFlag === "featured" ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Star size={12} className={featuredState ? "text-[var(--accent)]" : ""} fill={featuredState ? "currentColor" : "none"} />
        )}
        {featuredState ? "Featured" : "Feature on homepage"}
      </button>
    </div>
  );
}
