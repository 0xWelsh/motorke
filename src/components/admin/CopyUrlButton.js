"use client";

import { useState } from "react";

export default function CopyUrlButton({ url }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-slate-300 hover:text-slate-900 transition-colors"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}