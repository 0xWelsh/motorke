"use client";

import { useState } from "react";
import Link from "next/link";
import CarCard from "@/components/CarCard";

const INITIAL_COUNT = 4;

export default function SimilarCarsSection({ cars, make }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? cars : cars.slice(0, INITIAL_COUNT);
  const hasMore = cars.length > INITIAL_COUNT;

  if (!cars.length) return null;

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-[12px] font-serif font-bold uppercase tracking-[0.15em] text-emerald-600">
          More {make} Cars
        </h2>
        <Link
          href={`/cars/${make?.toLowerCase() || ""}`}
          className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors"
        >
          All {make} &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayed.map((sc) => (
          <CarCard key={sc.id} car={sc} compact />
        ))}
      </div>
      {hasMore && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2.5 text-[11px] font-bold tracking-wide text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {showAll ? "Show less" : `Show ${cars.length - INITIAL_COUNT} more`}
          </button>
        </div>
      )}
    </div>
  );
}
