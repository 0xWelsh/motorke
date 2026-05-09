"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

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
    <section className="mb-5 sm:mb-6 space-y-2.5" aria-hidden>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
          Smart Filters
        </span>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-8 w-[5.5rem] sm:w-28 rounded-full bg-slate-100 animate-pulse"
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

  return (
    <section
      className="mb-5 sm:mb-6 space-y-2.5"
      aria-busy={Boolean(pendingHref)}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
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
              className={`${pillBaseClass}${loading ? " opacity-80" : ""}`}
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
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
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
                className={`inline-flex items-center justify-center gap-1.5 min-h-8 px-3 border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-[0.11em] text-blue-700 hover:bg-blue-100 transition-colors${loading ? " opacity-80" : ""}`}
                style={{ borderRadius: "999px" }}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600" aria-hidden />
                ) : null}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
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
