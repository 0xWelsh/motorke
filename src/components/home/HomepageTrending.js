import { ArrowUpRight } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import ScrollableCarGrid from "@/components/home/ScrollableCarGrid";

export default function HomepageTrending({ cars = [] }) {
  if (!cars.length) return null;

  return (
    <section
      aria-labelledby="homepage-frequent-heading"
      className="border-b border-slate-100 bg-white py-8 sm:py-12 dark:border-zinc-900 dark:bg-[#0a0a0a]"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 mb-2">
              Buyers dig these
            </p>
            <h2
              id="homepage-frequent-heading"
              className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1] tracking-[-0.02em] editorial-heading font-semibold text-slate-900 dark:text-white"
            >
              Frequently searched
            </h2>
          </div>
          <TrackedLink
            href="/cars?sort=views_desc"
            eventName="homepage_frequent_click"
            eventPayload={{ area: "frequent" }}
            className="inline-flex h-11 items-center shrink-0 text-slate-900 dark:text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-emerald-600 transition-colors"
          >
            View all <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <ScrollableCarGrid cars={cars.slice(0, 8)} />
      </div>
    </section>
  );
}
