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
      className="rounded-md border border-zinc-800 px-2.5 py-1 text-[11px] font-bold text-zinc-300 hover:border-zinc-600 hover:text-white transition-colors"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}