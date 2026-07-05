import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

function pickSectionBackdrop(cars) {
  for (const car of cars || []) {
    const url = car?.images?.[0]?.url;
    if (typeof url === "string" && url) return url;
  }
  return null;
}

export default function HomepageNewArrivals({ cars = [] }) {
  if (!cars.length) return null;

  const backdrop = pickSectionBackdrop(cars);
  const items = cars.slice(0, 8);

  return (
    <section className="relative py-8 sm:py-12 lg:py-16 border-b border-emerald-100/80 dark:border-emerald-950/30 overflow-hidden">
      {backdrop && (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <Image
            src={backdrop}
            fill
            sizes="100vw"
            alt=""
            className="object-cover opacity-[0.16] dark:opacity-[0.10]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/96 via-white/94 to-white dark:from-[#0a0a0a]/96 dark:via-[#0a0a0a]/94 dark:to-[#0a0a0a]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(56,161,105,0.12),transparent_55%)]" />
        </div>
      )}
      {!backdrop && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-50/30 to-white dark:from-emerald-950/15 dark:to-[#0a0a0a]" />
      )}
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500 mb-2">
              This week
            </p>
            <h2 className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1] tracking-[-0.02em] editorial-heading font-semibold text-slate-900 dark:text-white">
              New arrivals
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=newest"
            eventName="homepage_fresh_arrivals_click"
            eventPayload={{ area: "fresh_arrivals" }}
            className="inline-flex h-11 items-center shrink-0 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-emerald-600 transition-colors"
          >
            See all arrivals <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={items} />
      </div>
    </section>
  );
}
