import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageSpotlight({ cars = [] }) {
  if (!cars.length) return null;

  return (
    <section
      aria-labelledby="homepage-spotlight-heading"
      className="border-b border-slate-200 bg-[var(--bg)] py-6 sm:py-10"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-3">
          <h2
            id="homepage-spotlight-heading"
            className="text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] font-black text-slate-900"
          >
            Spotlight
          </h2>
          <TrackedLink
            href="/cars"
            eventName="homepage_spotlight_browse_click"
            eventPayload={{ area: "spotlight_header" }}
            className="inline-flex h-11 items-center shrink-0 text-slate-500 text-xs font-bold uppercase tracking-widest gap-2 hover:text-[var(--accent)] transition-colors"
          >
            Browse inventory <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={cars.slice(0, 8)} />
      </div>
    </section>
  );
}
