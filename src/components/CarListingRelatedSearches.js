import Link from "next/link";
import { getRelatedSeoLinks } from "@/lib/seo-keyword-clusters";

export default function CarListingRelatedSearches({ car }) {
  const links = getRelatedSeoLinks(
    {
      make: car.make,
      model: car.model,
      bodyType: car.bodyType,
      price: car.price,
    },
    { take: 6 }
  );

  if (!links.length) return null;

  return (
    <nav
      className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400"
      aria-label="Related searches"
    >
      <span className="text-[#718096] dark:text-zinc-500 font-black tracking-widest w-full sm:w-auto">
        Related:
      </span>
      {links.map((item) => (
        <span key={item.href} className="inline-flex items-center gap-2">
          <Link href={item.href} className="text-[#38A169] hover:underline normal-case tracking-normal">
            {item.label}
          </Link>
          {item.guidePath ? (
            <Link
              href={item.guidePath}
              className="text-slate-400 hover:text-[#38A169] normal-case tracking-normal text-[10px]"
            >
              Guide
            </Link>
          ) : null}
        </span>
      ))}
    </nav>
  );
}
