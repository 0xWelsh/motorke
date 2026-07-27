import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageDeals({ cars = [] }) {
  if (!cars.length) return null;

  return (
    <section
      aria-labelledby="homepage-deals-heading"
      className="border-b border-white/[0.06] bg-[#080808] py-8 sm:py-12"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">
              Best value
            </p>
            <h2
              id="homepage-deals-heading"
              className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1] tracking-[-0.02em] editorial-heading font-semibold text-white"
            >
              DEALS
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=price_asc"
            eventName="homepage_deals_browse_click"
            eventPayload={{ area: "deals_header" }}
            className="inline-flex h-11 items-center shrink-0 text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-amber-500 transition-colors"
          >
            See all deals <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={cars} />
      </div>
    </section>
  );
}
