"use client";

import Link from "next/link";
import { ArrowUpRight, ImageOff } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { formatCarPrice } from "@/lib/utils";
import { buildCarSpecSummaryItems, positiveNum } from "@/lib/car-display";
import { carListingPath } from "@/lib/car-listing-url";
import { FUEL_LABELS } from "@/lib/constants";

/**
 * Compact horizontal listing row for dealer showroom inventory on mobile.
 */
export default function DealerInventoryStripCard({ car }) {
  const primaryImg = car.images?.[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`.replace(/\s+/g, " ").trim();
  const specItems = buildCarSpecSummaryItems(car);
  const specLine = specItems.join(" · ");

  const badges = [
    car.transmission,
    car.bodyType,
    car.fuelType && (FUEL_LABELS[car.fuelType] || car.fuelType),
    positiveNum(car.engineCC) ? `${Number(car.engineCC)} cc` : null,
    car.mileage != null ? `${Number(car.mileage).toLocaleString("en-KE")} km` : null,
  ].filter(Boolean);

  return (
    <article
      className="flex overflow-hidden border border-slate-200/90 bg-white dark:border-zinc-800 dark:bg-[#0a0a0a]"
      style={{ borderRadius: "10px" }}
    >
      <Link
        href={carListingPath(car)}
        className="relative w-[38%] max-w-[148px] shrink-0 self-stretch min-h-[104px] bg-slate-100 dark:bg-zinc-900"
        aria-label={title}
      >
        {primaryImg ? (
          <SafeImage
            src={primaryImg}
            alt={title}
            fill
            className="object-cover"
            sizes="148px"
            fallback={
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageOff className="h-6 w-6" aria-hidden />
              </div>
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageOff className="h-6 w-6" aria-hidden />
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 p-2.5 sm:p-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#38A169]">{car.year}</p>
          <Link href={carListingPath(car)}>
            <h3 className="text-[13px] font-black leading-snug tracking-tight text-slate-900 line-clamp-2 dark:text-white">
              {car.make} {car.model}
              {car.variant ? (
                <span className="font-bold text-slate-500 dark:text-slate-400"> · {car.variant}</span>
              ) : null}
            </h3>
          </Link>
          {specLine ? (
            <p className="text-[11px] font-semibold leading-snug text-slate-600 line-clamp-2 dark:text-slate-300">
              {specLine}
            </p>
          ) : null}
          {badges.length > 0 ? (
            <p className="text-[10px] font-medium leading-snug text-slate-500 line-clamp-2 dark:text-slate-400">
              {badges.slice(0, 4).join(" · ")}
            </p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-2 border-t border-slate-100 pt-2 dark:border-zinc-800">
          <p className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">
            {formatCarPrice(car)}
          </p>
          <Link
            href={carListingPath(car)}
            className="inline-flex shrink-0 items-center gap-1 bg-slate-900 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white dark:bg-white dark:text-black"
            style={{ borderRadius: "6px" }}
          >
            View
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
