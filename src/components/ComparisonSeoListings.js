import Link from "next/link";
import Image from "next/image";
import { formatCarPrice } from "@/lib/utils";
import { carListingPath } from "@/lib/car-listing-url";
import { getThumbnailUrl } from "@/lib/image-transform";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

export default function ComparisonSeoListings({ make, model, cars }) {
  const hubHref = `/cars/${slugifyCarSegment(make)}/${slugifyCarSegment(model)}`;

  return (
    <section className="rounded-xl border border-white/[0.06] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="text-sm font-bold text-white">
          {make} {model} in stock
        </h2>
        <Link
          href={hubHref}
          className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-80"
        >
          View all
        </Link>
      </div>
      {cars.length === 0 ? (
        <p className="text-sm text-zinc-400">No live listings right now, check back soon.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cars.map((car) => {
            const img = car.images?.[0]?.url;
            return (
              <li key={car.id}>
                <Link
                  href={carListingPath(car)}
                  className="flex gap-3 border border-white/[0.06] p-2 hover:border-white/[0.12] transition-colors"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <div className="relative w-20 h-14 shrink-0 bg-white/[0.03] overflow-hidden">
                    {img ? (
                      <Image src={getThumbnailUrl(img)} alt="" fill className="object-cover" sizes="80px" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {[car.year, car.make, car.model].filter(Boolean).join(" ")}
                    </p>
                    <p className="text-xs text-zinc-400 truncate">{car.dealer?.name}</p>
                    <p className="text-xs font-semibold text-[var(--accent)] mt-0.5">
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
