// src/components/detail/CarSimilarStrip.js
// Desktop-only "More {make} cars" grid inside the gallery column.
// Streams in after the listing shell.
import Link from "next/link";
import { getSimilarCars } from "@/lib/car-detail-data";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import NikkyoStockCard from "@/components/NikkyoStockCard";

export default async function CarSimilarStrip({ car }) {
  const similar = await getSimilarCars(car.id, car.make, car.dealerId, car.bodyType, car.year, car.price);
  if (similar.length === 0) return null;

  return (
    <section className="hidden lg:block">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
          More {car.make} Cars
        </h2>
        <Link
          href={`/cars/${slugifyCarSegment(car.make)}`}
          className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-80 transition-colors"
        >
          All {car.make} &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {similar.slice(0, 4).map((sc) => (
          <NikkyoStockCard key={sc.id} car={sc} />
        ))}
      </div>
    </section>
  );
}