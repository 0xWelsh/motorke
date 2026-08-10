// src/app/not-found.js
import { getSupportEmail } from "@/lib/site-contact";
import Link from "next/link";
import { Search, Home, GitCompare } from "lucide-react";

export default function NotFound() {
  const support = getSupportEmail();
  return (
    <div className="min-h-[78vh] bg-[var(--bg)] flex items-center px-4 sm:px-6 transition-colors">
      <div className="max-w-4xl w-full mx-auto">
        <div
          className="border border-slate-200 bg-white p-8 sm:p-12 text-center sm:text-left rounded-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
            Error 404
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            We can&apos;t find that page.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed max-w-2xl mb-8">
            It may have moved, the listing may have been removed, or the link is outdated.
            Use one of the quick paths below to continue.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <Link
              href="/cars"
              className="btn btn-primary"
            >
              <Search />
              Browse Cars
            </Link>
            <Link
              href="/compare"
              className="btn btn-neutral"
            >
              <GitCompare />
              Compare
            </Link>
            <Link
              href="/"
              className="btn btn-neutral"
            >
              <Home />
              Home
            </Link>
          </div>

          <p className="text-[11px] font-semibold text-slate-500">
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
