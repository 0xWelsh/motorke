"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Clock, ChevronRight, ImageOff } from "lucide-react";
import { BRANDS, BODY_TYPES } from "@/lib/browse-catalog";
import { readRecentCarsFromStorage } from "@/lib/personalization";
import { stockCode } from "@/lib/stock-code";
import { carListingPath } from "@/lib/car-listing-url";

const PRICE_PRESETS = [
  { label: "Under KES 1M", min: "", max: "1000000" },
  { label: "KES 1M – 2M", min: "1000000", max: "2000000" },
  { label: "KES 2M – 3M", min: "2000000", max: "3000000" },
  { label: "KES 3M – 5M", min: "3000000", max: "5000000" },
  { label: "KES 5M – 10M", min: "5000000", max: "10000000" },
  { label: "Over KES 10M", min: "10000000", max: "" },
];

const YEAR_PRESETS = [
  { label: "2021 and newer", min: "2021", max: "" },
  { label: "2016 – 2020", min: "2016", max: "2020" },
  { label: "2011 – 2015", min: "2011", max: "2015" },
  { label: "2006 – 2010", min: "2006", max: "2010" },
  { label: "2005 and older", min: "", max: "2005" },
];

function withQuery(params) {
  const s = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) s.set(k, v);
  });
  const qs = s.toString();
  return qs ? `/cars?${qs}` : "/cars";
}

const EXTRA_MAKE_LOGOS = {
  "Range Rover": "logo_land-rover.png",
};

const LOGO_BY_MAKE = new Map([
  ...BRANDS.map((b) => [b.make || b.name, b.img]),
  ...Object.entries(EXTRA_MAKE_LOGOS),
]);

function SidebarSection({ title, children }) {
  return (
    <div className="border-b border-subtle last:border-b-0">
      <h3 className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-dim">
        {title}
      </h3>
      <div className="px-3 pb-3">{children}</div>
    </div>
  );
}

function SideLink({ href, children }) {
  return (
    <Link
      href={href}
      className="flex w-full items-center gap-1.5 rounded py-1 text-[12px] font-semibold text-muted transition-colors hover:text-text"
    >
      <ChevronRight className="h-3 w-3 shrink-0 text-ghost" aria-hidden />
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  );
}

function RecentViewRow({ car }) {
  const img = car.images?.[0]?.url;
  return (
    <Link
      href={carListingPath(car)}
      className="flex items-center gap-2.5 rounded py-1.5 transition-colors hover:bg-surface-hover"
    >
      <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-surface-overlay">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ghost">
            <ImageOff className="h-3.5 w-3.5" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-bold text-text">
          {car.make} {car.model}
        </span>
        <span className="block text-[10px] font-semibold text-dim">
          {car.year}
          {stockCode(car) ? ` · ${stockCode(car)}` : ""}
        </span>
      </span>
    </Link>
  );
}

export default function NikkyoSidebar({ inventoryCounts = {} }) {
  const [recent, setRecent] = useState([]);

  const { brands = {}, bodyTypes = {}, makes = {} } = inventoryCounts;
  const totalInventory = Object.values(makes).reduce((a, b) => a + b, 0) || 0;

  const makeList = Object.entries(makes)
    .map(([make, count]) => ({ make, count, img: LOGO_BY_MAKE.get(make) || "" }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const bodyList = BODY_TYPES.map((bt) => ({
    ...bt,
    count: bodyTypes[bt.value] || 0,
  })).filter((bt) => bt.count > 0);

  useEffect(() => {
    let cancelled = false;
    const local = readRecentCarsFromStorage();
    if (!local.length) return;
    const ids = local.slice(0, 5).map((c) => c.id).join(",");
    fetch(`/api/cars?ids=${encodeURIComponent(ids)}&limit=5`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const cars = data.cars || [];
        const ordered = local
          .slice(0, 5)
          .map((s) => cars.find((c) => c.id === s.id))
          .filter(Boolean);
        setRecent(ordered);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <aside className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <SidebarSection title="All inventory">
        <div className="space-y-0.5">
          <SideLink href="/cars">
            All cars{totalInventory ? ` (${totalInventory})` : ""}
          </SideLink>
        </div>
      </SidebarSection>

      <SidebarSection title="Saved & recent">
        <div className="space-y-0.5">
          <SideLink href="/account?tab=saved">
            <span className="flex items-center gap-1.5">
              <Bookmark className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
              Saved cars
            </span>
          </SideLink>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-dim">
          <Clock className="h-3 w-3" aria-hidden /> Recently Viewed
        </p>
        {recent.length ? (
          <div className="mt-1.5">
            {recent.map((car) => (
              <RecentViewRow key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <p className="mt-1 text-[11px] font-medium text-dim">
            Cars you view will appear here.
          </p>
        )}
      </SidebarSection>

      <SidebarSection title="Browse by price">
        <div className="space-y-0.5">
          {PRICE_PRESETS.map((p) => (
            <SideLink key={p.label} href={withQuery({ minPrice: p.min, maxPrice: p.max })}>
              {p.label}
            </SideLink>
          ))}
        </div>
      </SidebarSection>

      <SidebarSection title="Browse by make">
        {makeList.length ? (
          <div className="space-y-0.5">
            {makeList.map((m) => (
              <Link
                key={m.make}
                href={withQuery({ make: m.make })}
                className="flex w-full items-center gap-2 rounded py-1 text-[12px] font-semibold text-muted transition-colors hover:text-text"
              >
                {m.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/images/logos/${m.img}`}
                    alt=""
                    loading="lazy"
                    className="h-5 w-7 shrink-0 object-contain"
                  />
                ) : (
                  <span className="flex h-5 w-7 shrink-0 items-center text-[10px] font-black uppercase text-ghost">
                    {m.make[0]}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate">{m.make}</span>
                <span className="text-[11px] font-semibold tabular-nums text-dim">
                  {m.count}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-medium text-dim">No brands in stock right now.</p>
        )}
      </SidebarSection>

      <SidebarSection title="Browse by body type">
        {bodyList.length ? (
          <div className="grid grid-cols-2 gap-1">
            {bodyList.map((bt) => (
              <Link
                key={bt.value}
                href={withQuery({ bodyType: bt.value })}
                className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-text"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bt.img} alt="" loading="lazy" className="h-4 w-4 shrink-0 object-contain" />
                <span className="min-w-0 flex-1 truncate">{bt.label}</span>
                <span className="text-[10px] font-semibold tabular-nums text-dim">{bt.count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-[11px] font-medium text-dim">No body styles in stock right now.</p>
        )}
      </SidebarSection>

      <SidebarSection title="Browse by year">
        <div className="space-y-0.5">
          {YEAR_PRESETS.map((y) => (
            <SideLink key={y.label} href={withQuery({ minYOM: y.min, maxYOM: y.max })}>
              {y.label}
            </SideLink>
          ))}
        </div>
      </SidebarSection>
    </aside>
  );
}
