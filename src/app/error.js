"use client";
// src/app/error.js
// Catches unhandled errors in any page and shows a clean fallback

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <p className="text-6xl mb-4">⚠️</p>
      <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
      <p className="text-white/40 text-sm mb-8 max-w-sm">
        An unexpected error occurred. This has been logged and we'll look into it.
      </p>
      
      {/* Debug Info (You can remove this once fixed) */}
      <div className="mb-8 p-4 bg-red-950/30 border border-red-500/20 rounded-lg max-w-md w-full text-left">
        <p className="text-red-400 text-xs font-mono break-all mb-2">
          <strong>Error Message:</strong> {error?.message || "Unknown error"}
        </p>
        <p className="text-red-400/50 text-[10px] font-mono whitespace-pre-wrap">
          <strong>Details:</strong> {JSON.stringify(error, null, 2)}
        </p>
        <p className="text-red-400/50 text-[10px] font-mono">
          <strong>Digest:</strong> {error?.digest || "N/A"}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-[#f97316] hover:bg-[#ea6c0b] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Try again
        </button>
        <a
          href="/"
          className="border border-white/10 hover:border-white/20 text-white/60 hover:text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
