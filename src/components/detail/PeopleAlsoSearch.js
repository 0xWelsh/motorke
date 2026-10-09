"use client";

// src/components/detail/PeopleAlsoSearch.js
import Link from "next/link";
import { TrendingUp, Search } from "lucide-react";
import CarCard from "@/components/CarCard";
import { formatCarPrice } from "@/lib/utils";
import { carListingPath } from "@/lib/car-listing-url";

/**
 * "People also search for" — the inventory a buyer is most likely to click
 * next, each card labelled with why it surfaced ("In your budget",
 * "Same body") so the grid reads as a considered shortlist rather than a
 * random pile. Horizontal scroll-snap on a phone, grid from sm up.
 */
export default function PeopleAlsoSearch({ cars, searchHref, searchLabel = "Browse all cars" }) {
  if (!cars?.length) return null;

  return (
    <section aria-labelledby="people-also-search" className="mt-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="people-also-search"
            className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]"
          >
            <TrendingUp className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
            People also search for
          </h2>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">
            What buyers viewed after listings like this one.
          </p>
        </div>
        {searchHref ? (
          <Link
            href={searchHref}
            className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] transition-opacity hover:opacity-75"
          >
            {searchLabel} &rarr;
          </Link>
        ) : null}
      </div>

      {/* Phone: one card per screen width, snap aligned. Desktop: grid. */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 xl:grid-cols-4">
        {cars.map((car) => (
          <li
            key={car.id}
            className="w-[74vw] max-w-[260px] shrink-0 snap-start sm:w-auto sm:max-w-none"
          >
            <CarCard car={car} />
            <p className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              <Search className="h-3 w-3 shrink-0 text-slate-400" strokeWidth={2.5} aria-hidden />
              <span className="truncate">
                {car._reason}
                {car._cheaper ? " · below asking" : ""}
              </span>
            </p>
          </li>
        ))}
      </ul>

      {/* Screen-reader text for the price, so the reason line is not the only
          non-image signal in each card. */}
      <p className="sr-only">
        {cars.length} further listings you may be interested in, ranging from{" "}
        {formatCarPrice(cars[cars.length - 1])} to {formatCarPrice(cars[0])}.
      </p>

      <div className="sr-only">
        {cars.map((car) => (
          <Link key={`sr-${car.id}`} href={carListingPath(car)}>
            {car.year} {car.make} {car.model}
          </Link>
        ))}
      </div>
    </section>
  );
}