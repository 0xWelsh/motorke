"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Sparkles } from "lucide-react";

const RECENT_CAR_SEARCHES_KEY = "motorke:recent-car-searches";

function staticSmartPills(pathname = "/cars") {
  return [
    { label: "City Hatchbacks", href: `${pathname}?bodyType=HATCHBACK&maxPrice=2500000&sort=price_asc` },
    { label: "Family SUVs", href: `${pathname}?bodyType=SUV&sort=views_desc` },
    { label: "Hybrid Picks", href: `${pathname}?fuelType=HYBRID&sort=newest` },
    { label: "Most Affordable", href: `${pathname}?sort=price_asc` },
    { label: "Newest Stock", href: `${pathname}?sort=newest` },
  ];
}

function normalizeSearchParams(sp) {
  const entries = [...sp.entries()].sort(([a], [b]) => a.localeCompare(b));
  return new URLSearchParams(entries).toString();
}

function destinationMatches(href, pathname, currentSearchParams) {
  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(href, base);
    if (u.pathname !== pathname) return false;
    return (
      normalizeSearchParams(u.searchParams) === normalizeSearchParams(currentSearchParams)
    );
  } catch {
    return false;
  }
}

function CarsQuickActionsFallback() {
  return (
    <section className="mb-4 sm:mb-6 space-y-2.5" aria-hidden>
      {/* Mirror the collapsed mobile state so layout doesn't shift on hydrate. */}
      <div className="sm:hidden h-9 w-full rounded-full bg-slate-100 dark:bg-zinc-900 animate-pulse" />
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          Smart Filters
        </span>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-[5.5rem] sm:w-28 rounded-full bg-slate-100 dark:bg-zinc-900 animate-pulse"
          />
        ))}
      </div>
    </section>
  );
}

function CarsQuickActionsInner() {
  const pathname = usePathname() || "/cars";
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  const [recent, setRecent] = useState([]);
  const [pendingHref, setPendingHref] = useState(null);
  // Collapse the smart-filter pills on mobile by default so cards
  // appear above the fold. Always expanded from `sm` upward via the
  // sm:block utilities below.
  const [open, setOpen] = useState(false);

  const smartPills = useMemo(() => staticSmartPills(pathname), [pathname]);

  useEffect(() => {
    try {
      const data = JSON.parse(window.localStorage.getItem(RECENT_CAR_SEARCHES_KEY) || "[]");
      setRecent(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {
      setRecent([]);
    }
  }, [pathname]);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname, queryString]);

  const handleNavigate = (href, e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (destinationMatches(href, pathname, searchParams)) return;
    e.preventDefault();
    setPendingHref(href);
    router.push(href);
  };

  const pillBaseClass =
    "inline-flex items-center justify-center gap-1.5 min-h-8 px-3 border border-slate-200 bg-white text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 hover:border-[#38A169] hover:text-[#2F855A] transition-colors";

  const totalPillCount = smartPills.length + recent.length;

  return (
    <section
      className="mb-4 sm:mb-6 space-y-2.5"
      aria-busy={Boolean(pendingHref)}
      aria-live="polite"
    >
      {/* Mobile-only collapsible toggle. Desktop always shows the pills
          (the sm:hidden / sm:block utilities below handle visibility). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="cars-smart-filters-panel"
        className="sm:hidden inline-flex w-full items-center justify-between gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111111] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 dark:text-slate-200"
        style={{ borderRadius: "999px" }}
      >
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-[#2F855A]" aria-hidden />
          Smart filters
          {totalPillCount > 0 ? (
            <span className="text-slate-400 dark:text-slate-500">({totalPillCount})</span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div
        id="cars-smart-filters-panel"
        className={`${open ? "block" : "hidden"} sm:block space-y-2.5`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Smart Filters
          </span>
          {smartPills.map((item) => {
            const loading = pendingHref === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch
                aria-busy={loading}
                onClick={(e) => handleNavigate(item.href, e)}
                className={`${pillBaseClass} dark:border-slate-800 dark:bg-[#111111] dark:text-slate-200 dark:hover:border-[#2F855A] dark:hover:text-white${loading ? " opacity-80" : ""}`}
                style={{ borderRadius: "999px" }}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#2F855A]" aria-hidden />
                ) : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        {recent.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              Recent Searches
            </span>
            {recent.map((item) => {
              const href = `/cars${item.query ? `?${item.query}` : ""}`;
              const loading = pendingHref === href;
              return (
                <Link
                  key={`${item.query}-${item.createdAt}`}
                  href={href}
                  prefetch
                  aria-busy={loading}
                  onClick={(e) => handleNavigate(href, e)}
                  className={`inline-flex items-center justify-center gap-1.5 min-h-8 px-3 border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-[0.11em] text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/40 transition-colors${loading ? " opacity-80" : ""}`}
                  style={{ borderRadius: "999px" }}
                >
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600 dark:text-blue-300" aria-hidden />
                  ) : null}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function CarsQuickActions() {
  return (
    <Suspense fallback={<CarsQuickActionsFallback />}>
      <CarsQuickActionsInner />
    </Suspense>
  );
}
