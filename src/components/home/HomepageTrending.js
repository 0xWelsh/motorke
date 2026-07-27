import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageTrending({ cars = [] }) {
  if (!cars.length) return null;

  return (
    <section
      aria-labelledby="homepage-frequent-heading"
      className="border-b border-white/[0.06] bg-[#141414] py-8 sm:py-12"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">
              Buyers dig these
            </p>
            <h2
              id="homepage-frequent-heading"
              className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1] tracking-[-0.02em] editorial-heading font-semibold text-white"
            >
              Frequently searched
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=views_desc"
            eventName="homepage_frequent_click"
            eventPayload={{ area: "frequent" }}
            className="inline-flex h-11 items-center shrink-0 text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-[var(--accent)] transition-colors"
          >
            View all <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={cars.slice(0, 8)} />
      </div>
    </section>
  );
}
