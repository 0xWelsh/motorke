import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import CarCard from "@/components/CarCard";

function GridSection({ heading, href, cars, eagerCount = 0 }) {
  if (!cars?.length) return null;
  return (
    <section aria-labelledby={`list-grid-${heading}`} className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2
          id={`list-grid-${heading}`}
          className="text-lg font-black tracking-tight text-slate-900 sm:text-xl"
        >
          {heading}
        </h2>
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-500 transition-colors hover:text-[var(--accent)]"
        >
          View all
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="flex flex-col gap-6 sm:gap-7">
        {cars.slice(0, 16).map((car, i) => (
          <CarCard key={car.id} car={car} layout="feed" priority={i < eagerCount} />
        ))}
      </div>
    </section>
  );
}

/**
 * One-column listing feed for the homepage, same card anatomy as browse
 * (price strip on image, FEATURED pill, spec sentence, location line).
 */
export default function HomepageNikkyoGrids({ recommended = [], newArrivals = [], deals = [], luxury = [] }) {
  if (!recommended.length && !newArrivals.length && !deals.length && !luxury.length) return null;

  return (
    <div className="space-y-8 sm:space-y-10">
      <GridSection heading="Recommended" href="/cars" cars={recommended} eagerCount={2} />
      <GridSection heading="New Arrivals" href="/cars?sort=newest" cars={newArrivals} />
      <GridSection heading="Good Deals" href="/cars?sort=price_asc" cars={deals} />
      <GridSection heading="Luxury Collection" href="/luxury" cars={luxury} />
    </div>
  );
}

