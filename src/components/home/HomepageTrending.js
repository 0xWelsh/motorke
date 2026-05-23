import { ArrowUpRight } from "lucide-react";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";

/**
 * @param {{ cars: object[] }} props
 */
export default function HomepageTrending({ cars = [] }) {
  if (!cars.length) return null;

  const items = cars.slice(0, 4);

  return (
    <section
      aria-labelledby="homepage-trending-heading"
      className="border-b border-slate-100 bg-white py-10 sm:py-16 dark:border-zinc-900 dark:bg-[#0a0a0a]"
    >
      <div className="home-shell">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-zinc-500 mb-2">
              Trending
            </p>
            <h2
              id="homepage-trending-heading"
              className="text-4xl sm:text-5xl font-normal editorial-heading text-[#111827] dark:text-white mb-3"
            >
              Most viewed this week
            </h2>
            <p className="text-[#475569] dark:text-slate-400 text-base sm:text-lg font-medium leading-relaxed">
              Listings buyers are opening right now. Updated from live view counts.
            </p>
          </div>
          <TrackedLink
            href="/cars?sort=views_desc"
            eventName="homepage_trending_click"
            eventPayload={{ area: "trending" }}
            className="inline-flex h-11 items-center shrink-0 text-[#111827] dark:text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-[#38A169] transition-colors"
          >
            View all <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:gap-6 items-stretch max-w-4xl mx-auto lg:max-w-5xl">
          {items.map((car) => (
            <div key={car.id} className="h-full">
              <CarCard car={car} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
