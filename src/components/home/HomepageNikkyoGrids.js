import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import NikkyoStockCard from "@/components/NikkyoStockCard";

function GridSection({ heading, href, cars, eagerCount = 0 }) {
  if (!cars?.length) return null;
  return (
    <section aria-labelledby={`nikkyo-grid-${heading}`} className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-3 border-b-2 border-[var(--accent)] pb-1.5">
        <h2
          id={`nikkyo-grid-${heading}`}
          className="text-sm font-black uppercase tracking-wider text-slate-900 sm:text-base"
        >
          {heading}
        </h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 rounded bg-[#d9534f] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#c9302c]"
        >
          More
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 xl:gap-2.5">
        {cars.slice(0, 16).map((car, i) => (
          <NikkyoStockCard key={car.id} car={car} priority={i < eagerCount} />
        ))}
      </div>
    </section>
  );
}

/**
 * Nikkyo-style compact inventory grids shown in the homepage main column.
 * Only the first two recommended cards load eagerly — everything else is
 * lazy so mobile doesn't race 32 images against the hero.
 */
export default function HomepageNikkyoGrids({ recommended = [], newArrivals = [], deals = [], luxury = [] }) {
  if (!recommended.length && !newArrivals.length && !deals.length && !luxury.length) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <GridSection heading="Recommended Cars" href="/cars" cars={recommended} eagerCount={2} />
      <GridSection heading="New Arrivals" href="/cars?sort=newest" cars={newArrivals} />
      <GridSection heading="Good Deals" href="/cars?sort=price_asc" cars={deals} />
      <GridSection heading="Luxury Collection" href="/luxury" cars={luxury} />
    </div>
  );
}
