"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function CarsQuickActions() {
  const pathname = usePathname() || "/cars";
  const [recent, setRecent] = useState([]);
  const smartPills = useMemo(() => staticSmartPills(pathname), [pathname]);

  useEffect(() => {
    try {
      const data = JSON.parse(window.localStorage.getItem(RECENT_CAR_SEARCHES_KEY) || "[]");
      setRecent(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {
      setRecent([]);
    }
  }, [pathname]);

  return (
    <section className="mb-5 sm:mb-6 space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Smart Filters</span>
        {smartPills.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="inline-flex items-center h-8 px-3 border border-slate-200 bg-white text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 hover:border-[#38A169] hover:text-[#2F855A] transition-colors"
            style={{ borderRadius: "999px" }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Recent Searches</span>
          {recent.map((item) => (
            <Link
              key={`${item.query}-${item.createdAt}`}
              href={`/cars${item.query ? `?${item.query}` : ""}`}
              className="inline-flex items-center h-8 px-3 border border-blue-200 bg-blue-50 text-[10px] font-black uppercase tracking-[0.11em] text-blue-700 hover:bg-blue-100 transition-colors"
              style={{ borderRadius: "999px" }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
