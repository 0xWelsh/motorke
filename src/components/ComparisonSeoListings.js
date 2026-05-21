import Link from "next/link";
import Image from "next/image";
import { formatCarPrice } from "@/lib/utils";
import { carListingPath } from "@/lib/car-listing-url";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

export default function ComparisonSeoListings({ make, model, cars }) {
  const hubHref = `/cars/${slugifyCarSegment(make)}/${slugifyCarSegment(model)}`;

  return (
    <section className="rounded-xl border border-slate-200 dark:border-zinc-800 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          {make} {model} in stock
        </h2>
        <Link
          href={hubHref}
          className="text-[10px] font-bold uppercase tracking-widest text-[#2F855A] hover:opacity-80"
        >
          View all
        </Link>
      </div>
      {cars.length === 0 ? (
        <p className="text-sm text-slate-500">No live listings right now, check back soon.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cars.map((car) => {
            const img = car.images?.[0]?.url;
            return (
              <li key={car.id}>
                <Link
                  href={carListingPath(car)}
                  className="flex gap-3 border border-slate-100 dark:border-zinc-800 p-2 hover:border-slate-300 dark:hover:border-zinc-600 transition-colors"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <div className="relative w-20 h-14 shrink-0 bg-slate-100 dark:bg-zinc-900 overflow-hidden">
                    {img ? (
                      <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {[car.year, car.make, car.model].filter(Boolean).join(" ")}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{car.dealer?.name}</p>
                    <p className="text-xs font-semibold text-[#2F855A] mt-0.5">
                      {formatCarPrice(car.price)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
