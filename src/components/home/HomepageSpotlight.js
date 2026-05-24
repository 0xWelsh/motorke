import { ArrowUpRight } from "lucide-react";
import CarCard from "@/components/CarCard";
import TrackedLink from "@/components/TrackedLink";

/**
 * Homepage Spotlight row — editorial title, no paid/featured copy.
 * @param {{ cars: object[] }} props
 */
export default function HomepageSpotlight({ cars = [] }) {
  if (!cars.length) return null;

  const items = cars.slice(0, 8);

  return (
    <section
      aria-labelledby="homepage-spotlight-heading"
      className="border-b border-slate-100 bg-white py-10 sm:py-16 lg:py-20 dark:border-zinc-900 dark:bg-[#0a0a0a]"
    >
      <div className="home-shell">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <h2
            id="homepage-spotlight-heading"
            className="text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.92] tracking-[-0.03em] editorial-heading font-semibold bg-gradient-to-r from-[#dc2626] via-[#ea580c] to-[#dc2626] bg-clip-text text-transparent dark:from-[#f87171] dark:via-[#fb923c] dark:to-[#f87171]"
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6 items-stretch">
          {items.map((car, index) => (
            <div
              key={car.id}
              className={[
                "h-full",
                index === 0 && items.length >= 3 ? "col-span-2 lg:col-span-2 lg:row-span-2" : "",
              ].join(" ")}
            >
              <CarCard car={car} spotlightProminent hideSpotlightBadge />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
