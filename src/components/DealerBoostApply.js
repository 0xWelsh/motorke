"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { clsx } from "clsx";

const BOOST_OPTIONS = [
  { type: "spotlight_7d", label: "Spotlight 7d", hint: "Red outline + search rank" },
  { type: "hot_badge_7d", label: "Hot badge 7d", hint: "Orange outline + badge" },
  { type: "spotlight_30d", label: "Spotlight 30d", hint: "Longer run" },
];

/**
 * Apply a boost to one inventory vehicle from the portal.
 */
export default function DealerBoostApply({
  carId,
  carLabel,
  spotlightActive = false,
  hotActive = false,
  compact = false,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function apply(type) {
    setLoading(type);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/portal/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, carId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not apply boost");
        return;
      }
      setMessage(`${BOOST_OPTIONS.find((o) => o.type === type)?.label || "Boost"} applied.`);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={compact ? "" : "mt-2"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "flex items-center justify-center gap-1.5 w-full font-black uppercase tracking-[0.1em] transition-colors",
          compact
            ? "text-[10px] py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-900/50 bg-amber-950/40 text-amber-100"
            : "text-[11px] py-2.5 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
        )}
      >
        <Zap size={14} />
        Boost
        {(spotlightActive || hotActive) && (
          <span className="text-[9px] opacity-80">Active</span>
        )}
      </button>

      {open ? (
        <div className="mt-2 p-2.5 border border-[#ddd4c8] border-slate-800 rounded-xl bg-[#fbfcfe] bg-[#1a1a1a] space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 text-slate-400 truncate">
            {carLabel}
          </p>
          {BOOST_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              type="button"
              disabled={Boolean(loading)}
              onClick={() => apply(opt.type)}
              className="w-full text-left px-2.5 py-2 rounded-lg border border-[#ddd4c8] border-slate-700 bg-white bg-[#1e1e1e] hover:border-[var(--accent)] disabled:opacity-50"
            >
              <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-slate-900 text-white">
                {loading === opt.type ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Applying…
                  </span>
                ) : (
                  opt.label
                )}
              </span>
              <span className="text-[9px] text-slate-500">{opt.hint}</span>
            </button>
          ))}
          <p className="text-[9px] text-slate-500 leading-snug">
            Early access: no charge yet. Credits track usage for when billing goes live.
          </p>
        </div>
      ) : null}

      {message ? (
        <p className="mt-1 text-[10px] font-semibold text-emerald-700 text-emerald-400">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-[10px] font-semibold text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
