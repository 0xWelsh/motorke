"use client";
// src/app/error.js
// Catches unhandled errors in any page and shows a clean fallback

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <p className="text-5xl font-black text-[var(--accent)] mb-3">!</p>
      <h1 className="text-2xl font-black mb-2 text-text">Something went wrong</h1>
      <p className="text-muted text-sm mb-8 max-w-sm">
        An unexpected error occurred. This has been logged and we'll look into it.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="btn btn-primary btn-sm">
          Try again
        </button>
        <a href="/" className="btn btn-neutral btn-sm">
          Go home
        </a>
      </div>
    </div>
  );
}
