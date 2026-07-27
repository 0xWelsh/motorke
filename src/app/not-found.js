// src/app/not-found.js
import { getSupportEmail } from "@/lib/site-contact";
import Link from "next/link";
import { Search, Home, GitCompare } from "lucide-react";

export default function NotFound() {
  const support = getSupportEmail();
  return (
    <div className="min-h-[78vh] bg-[#1c1c1c] flex items-center px-4 sm:px-6 transition-colors">
      <div className="max-w-4xl w-full mx-auto">
        <div
          className="border border-white/[0.06] bg-white/[0.03] p-8 sm:p-12 text-center sm:text-left rounded-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4">
            Error 404
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            We can&apos;t find that page.
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mb-8">
            It may have moved, the listing may have been removed, or the link is outdated.
            Use one of the quick paths below to continue.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <Link
              href="/cars"
              className="h-11 px-4 inline-flex items-center justify-center gap-2 bg-white text-[#1c1c1c] border border-white text-[11px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.99] rounded-xl"
            >
              <Search className="w-4 h-4" />
              Browse Cars
            </Link>
            <Link
              href="/compare"
              className="h-11 px-4 inline-flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] text-white text-[11px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.99] rounded-xl"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </Link>
            <Link
              href="/"
              className="h-11 px-4 inline-flex items-center justify-center gap-2 bg-white/[0.03] border border-white/[0.06] text-white text-[11px] font-bold uppercase tracking-widest transition-transform hover:scale-[0.99] rounded-xl"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>

          <p className="text-[11px] font-semibold text-zinc-400">
            Need help? Reach us at{" "}
            <a href={`mailto:${support}`} className="text-[var(--accent)] hover:underline">
              {support}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
