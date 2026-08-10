import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageNewArrivals({ cars = [] }) {
  if (!cars.length) return null;

  const items = cars.slice(0, 8);

  return (
    <section className="relative py-6 sm:py-10 lg:py-12 border-b border-slate-200 bg-[var(--bg)] overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(22,163,74,0.08),transparent_55%)]" aria-hidden />
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)] mb-2">
              This week
            </p>
            <h2 className="text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] font-black text-slate-900">
              New arrivals
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=newest"
            eventName="homepage_fresh_arrivals_click"
            eventPayload={{ area: "fresh_arrivals" }}
            className="inline-flex h-11 items-center shrink-0 text-slate-500 text-xs font-bold uppercase tracking-widest gap-2 hover:text-[var(--accent)] transition-colors"
          >
            See all arrivals <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={items} />
      </div>
    </section>
  );
}
