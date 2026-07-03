"use client";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function RecacheHomepageButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch("/api/admin/recache", { method: "POST" });
      if (res.ok) {
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }
    } catch {}
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[11px] font-bold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors disabled:opacity-50"
    >
      <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      {done ? "Done!" : "Recache Homepage"}
    </button>
  );
}
