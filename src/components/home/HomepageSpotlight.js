import { ArrowUpRight } from "lucide-react";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";
import { getSpotlightGridLayout } from "@/lib/spotlight-grid";

/**
 * Homepage Spotlight row — eight listings, rotated from inventory every 30 minutes.
 * Paid spotlight boosts replace slots when active.
 * @param {{ cars: object[] }} props
 */
export default function HomepageSpotlight({ cars = [] }) {
  if (!cars.length) return null;

  const items = cars.slice(0, 8);
  const { gridClass, getItemClass } = getSpotlightGridLayout(items.length);

  return (
    <section
      aria-labelledby="homepage-spotlight-heading"
      className="border-b border-slate-100 bg-white py-8 sm:py-12 dark:border-zinc-900 dark:bg-[#0a0a0a]"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-7 gap-3">
          <h2
            id="homepage-spotlight-heading"
            className="text-[clamp(1.75rem,4.5vw,2.75rem)] leading-[1] tracking-[-0.02em] editorial-heading font-semibold bg-gradient-to-r from-[#dc2626] via-[#ea580c] to-[#dc2626] bg-clip-text text-transparent dark:from-[#f87171] dark:via-[#fb923c] dark:to-[#f87171]"
          >
            Spotlight
          </h2>
          <TrackedLink
            href="/cars"
            eventName="homepage_spotlight_browse_click"
            eventPayload={{ area: "spotlight_header" }}
            className="inline-flex h-11 items-center shrink-0 text-[#111827] dark:text-white text-xs font-bold uppercase tracking-widest gap-2 hover:text-[#38A169] transition-colors"
          >
            Browse inventory <ArrowUpRight className="w-4 h-4" />
          </TrackedLink>
        </div>

        <div className={`${gridClass} items-stretch`}>
          {items.map((car, index) => (
            <div key={car.id} className={`h-full min-w-0 ${getItemClass(index)}`}>
              <CarCard
                car={car}
                compact
                spotlightProminent
                hideSpotlightBadge
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
