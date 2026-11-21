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
      className="rounded-md border border-border px-2.5 py-1 text-[11px] font-bold text-secondary hover:border-border hover:text-text transition-colors"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}