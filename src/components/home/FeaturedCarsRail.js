"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CarCard from "@/components/CarCard";

/**
 * Homepage car rail — one sideways-sliding row with snap boundaries.
 * Featured variant: mosaic cards + FEATURED pills. Inventory variant:
 * plain frameless cards, single title "Our Inventory".
 */
export default function FeaturedCarsRail({
  cars = [],
  title = "Featured",
  sublabel = "today\u2019s picks from the yard",
  viewAllHref = "/cars",
  viewAllLabel = "All cars",
  featured = true,
  mosaic = true,
}) {
  const railRef = useRef(null);

  if (!cars.length) return null;

  function nudge(dir) {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector("[data-rail-card]");
    const step = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section aria-label={title} className="mt-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 text-[15px] sm:text-lg font-black uppercase tracking-[0.14em] text-text">
          <span className="truncate">{title}</span>
          {sublabel && (
            <span className="hidden sm:inline text-[11px] font-bold tracking-normal text-dim normal-case">
              {sublabel}
            </span>
          )}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={viewAllHref}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.14em] text-muted transition-colors hover:text-[var(--accent)]"
          >
            {viewAllLabel}
          </Link>
          {[-1, 1].map((dir) => (
            <button
              key={dir}
              type="button"
              onClick={() => nudge(dir)}
              aria-label={dir < 0 ? "Previous featured cars" : "Next featured cars"}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {dir < 0 ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cars.map((car, i) => (
          <div
            key={car.id}
            data-rail-card
            className="w-[min(84vw,330px)] shrink-0 snap-start"
          >
            <CarCard car={car} mosaic={mosaic} featured={featured} priority={i < 2} />
          </div>
        ))}
      </div>
    </section>
  );
}
