import Link from "next/link";
import { getRelatedSeoLinks } from "@/lib/seo-keyword-clusters";

export default function CarListingRelatedSearches({ car }) {
  const links = getRelatedSeoLinks(
    {
      make: car.make,
      model: car.model,
      bodyType: car.bodyType,
      price: car.price,
      dutyPaid: car.dutyPaid,
      year: car.year,
      trim: car.variant,
    },
    { take: 6 }
  );

  if (!links.length) return null;

  return (
    <nav
      className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
      aria-label="Related searches"
    >
      <span className="text-slate-500 font-black tracking-widest w-full sm:w-auto">
        Related:
      </span>
      {links.map((item) => (
        <span key={item.href} className="inline-flex items-center gap-2">
          <Link href={item.href} className="text-[var(--accent)] hover:underline normal-case tracking-normal">
            {item.label}
          </Link>
          {item.guidePath ? (
            <Link
              href={item.guidePath}
              className="text-slate-500 hover:text-[var(--accent)] normal-case tracking-normal text-[10px]"
            >
              Guide
            </Link>
          ) : null}
        </span>
      ))}
    </nav>
  );
}
