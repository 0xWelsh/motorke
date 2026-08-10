import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageDeals({ cars = [] }) {
  if (!cars.length) return null;

  return (
    <section
      aria-labelledby="homepage-deals-heading"
      className="border-b border-slate-200 bg-[var(--bg)] py-6 sm:py-10"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2">
              Best value
            </p>
            <h2
              id="homepage-deals-heading"
              className="text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] font-black text-slate-900"
            >
              DEALS
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=price_asc"
            eventName="homepage_deals_browse_click"
            eventPayload={{ area: "deals_header" }}
            className="inline-flex h-11 items-center shrink-0 text-slate-500 text-xs font-bold uppercase tracking-widest gap-2 hover:text-amber-600 transition-colors"
          >
            See all deals <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={cars} />
      </div>
    </section>
  );
}
