import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import NikkyoStockCard from "@/components/NikkyoStockCard";

function GridSection({ heading, href, cars }) {
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
          className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] transition-colors hover:underline"
        >
          (All)
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4 lg:grid-cols-8 xl:gap-2">
        {cars.slice(0, 16).map((car, i) => (
          <NikkyoStockCard key={car.id} car={car} priority={i < 8} />
        ))}
      </div>
    </section>
  );
}

/**
 * Nikkyo-style compact inventory grids shown in the homepage main column.
 */
export default function HomepageNikkyoGrids({ recommended = [], newArrivals = [], deals = [] }) {
  if (!recommended.length && !newArrivals.length && !deals.length) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <GridSection heading="Recommended Cars" href="/cars" cars={recommended} />
      <GridSection heading="New Arrivals" href="/cars?sort=newest" cars={newArrivals} />
      <GridSection heading="Best Deals" href="/cars?sort=price_asc" cars={deals} />
    </div>
  );
}
