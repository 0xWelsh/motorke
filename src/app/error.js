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
