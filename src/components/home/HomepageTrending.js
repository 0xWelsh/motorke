import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageTrending({ cars = [] }) {
  if (!cars.length) return null;

  return (
    <section
      aria-labelledby="homepage-frequent-heading"
      className="border-b border-slate-200 bg-[var(--bg)] py-6 sm:py-8"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-5 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              Buyers dig these
            </p>
            <h2
              id="homepage-frequent-heading"
              className="text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.1] tracking-[-0.02em] font-black text-slate-900"
            >
              Frequently searched
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=views_desc"
            eventName="homepage_frequent_click"
            eventPayload={{ area: "frequent" }}
            className="inline-flex h-11 items-center shrink-0 text-slate-500 text-xs font-bold uppercase tracking-widest gap-2 hover:text-[var(--accent)] transition-colors"
          >
            View all <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={cars.slice(0, 16)} />
      </div>
    </section>
  );
}
