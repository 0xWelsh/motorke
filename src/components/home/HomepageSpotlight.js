import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageSpotlight({ cars = [] }) {
  if (!cars.length) return null;

  return (
    <section
      aria-labelledby="homepage-spotlight-heading"
      className="border-b border-white/[0.06] bg-[#080808] py-8 sm:py-12"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3">
          <h2
            id="homepage-spotlight-heading"
            className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1] tracking-[-0.02em] editorial-heading font-semibold bg-gradient-to-r from-[#f87171] via-[#fb923c] to-[#f87171] bg-clip-text text-transparent"
          >
            Spotlight
          </h2>
          <TrackedLink
            href="/cars"
            eventName="homepage_spotlight_browse_click"
            eventPayload={{ area: "spotlight_header" }}
            className="inline-flex h-11 items-center shrink-0 text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-[var(--accent)] transition-colors"
          >
            Browse inventory <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={cars.slice(0, 8)} />
      </div>
    </section>
  );
}
