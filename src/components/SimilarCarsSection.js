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
    <div className="border-t border-border pt-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
          More {make} Cars
        </h2>
        <Link
          href={`/cars/${make?.toLowerCase() || ""}`}
          className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-80 transition-colors"
        >
          All {make} &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8">
        {displayed.map((sc) => (
          <CarCard key={sc.id} car={sc} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="btn btn-neutral btn-sm"
          >
            {showAll ? "Show less" : `Show ${cars.length - INITIAL_COUNT} more`}
          </button>
        </div>
      )}
    </div>
  );
}
