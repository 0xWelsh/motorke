// src/app/not-found.js
import Link from "next/link";
import { Search, Home, GitCompare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[78vh] bg-white dark:bg-[#0a0a0a] flex items-center px-4 sm:px-6 transition-colors">
      <div className="max-w-4xl w-full mx-auto">
        <div
          className="border border-slate-200 dark:border-slate-800 bg-[#F7FAFC] dark:bg-[#111111] p-8 sm:p-12 text-center sm:text-left"
          style={{ borderRadius: "var(--radius)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mb-4">
            Error 404
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#111827] dark:text-white tracking-tight mb-4">
            We can&apos;t find that page.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mb-8">
            It may have moved, the listing may have been removed, or the link is outdated.
            Use one of the quick paths below to continue.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <Link
              href="/cars"
              className="h-11 px-4 inline-flex items-center justify-center gap-2 bg-[#111827] dark:bg-white text-white dark:!text-black border border-[#111827] dark:border-white text-[11px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.99]"
              style={{ borderRadius: "var(--radius)" }}
            >
              <Search className="w-4 h-4" />
              Browse Cars
            </Link>
            <Link
              href="/compare"
              className="h-11 px-4 inline-flex items-center justify-center gap-2 bg-white dark:bg-[#111111] border border-slate-300 dark:border-slate-700 text-[#111827] dark:text-white text-[11px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.99]"
              style={{ borderRadius: "var(--radius)" }}
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </Link>
            <Link
              href="/"
              className="h-11 px-4 inline-flex items-center justify-center gap-2 bg-white dark:bg-[#111111] border border-slate-300 dark:border-slate-700 text-[#111827] dark:text-white text-[11px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.99]"
              style={{ borderRadius: "var(--radius)" }}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>

          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-500">
            Need help? Reach us at{" "}
            <a href="mailto:sec@welsh.co.ke" className="text-[#38A169] hover:underline">
              sec@welsh.co.ke
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
