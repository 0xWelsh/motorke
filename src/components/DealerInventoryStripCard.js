"use client";

import Link from "next/link";
import { ArrowUpRight, ImageOff } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { getThumbnailUrl } from "@/lib/image-transform";
import { formatCarPrice } from "@/lib/utils";
import { buildCarSpecSummaryItems, positiveNum } from "@/lib/car-display";
import { carListingPath } from "@/lib/car-listing-url";
import { FUEL_LABELS } from "@/lib/constants";

/**
 * Full-width compact horizontal row for dealer showroom inventory on mobile.
 */
export default function DealerInventoryStripCard({ car, showFreshness = false, freshnessLabel }) {
  const primaryImg = car.images?.[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`.replace(/\s+/g, " ").trim();
  const specItems = buildCarSpecSummaryItems(car);
  const specLine = specItems.join(" · ");

  const badges = [
    car.transmission,
    car.bodyType,
    car.fuelType && (FUEL_LABELS[car.fuelType] || car.fuelType),
    positiveNum(car.engineCC) ? `${Number(car.engineCC)} cc` : null,
  ].filter(Boolean);

  return (
    <article className="w-full overflow-hidden border-b border-border bg-surface">
      <div className="flex w-full min-h-[84px]">
        <Link
          href={carListingPath(car)}
          className="relative w-[28%] min-w-[96px] max-w-[120px] shrink-0 self-stretch bg-surface-hover"
          aria-label={title}
        >
          {primaryImg ? (
            <SafeImage
              src={getThumbnailUrl(primaryImg)}
              alt={title}
              fill
              className="object-cover"
              sizes="120px"
              fallback={
                <div className="flex h-full w-full items-center justify-center text-dim">
                  <ImageOff className="h-5 w-5" aria-hidden />
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-dim">
              <ImageOff className="h-5 w-5" aria-hidden />
            </div>
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-2.5 py-2">
          {showFreshness && freshnessLabel ? (
            <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">{freshnessLabel}</p>
          ) : null}
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">{car.year}</p>
            <Link href={carListingPath(car)}>
              <h3 className="text-[12px] font-black leading-tight tracking-tight text-text line-clamp-1">
                {car.make} {car.model}
                {car.variant ? (
                  <span className="font-bold text-muted"> · {car.variant}</span>
                ) : null}
              </h3>
            </Link>
            {specLine ? (
              <p className="text-[10px] font-semibold leading-snug text-muted line-clamp-1">
                {specLine}
              </p>
            ) : null}
            {badges.length > 0 ? (
              <p className="text-[9px] font-medium leading-snug text-muted line-clamp-1">
                {badges.slice(0, 3).join(" · ")}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-black tracking-tight text-text">
              {formatCarPrice(car)}
            </p>
            <Link
              href={carListingPath(car)}
              className="inline-flex shrink-0 items-center gap-0.5 bg-surface-overlay px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-secondary hover:bg-surface-overlay transition-colors"
              style={{ borderRadius: "4px" }}
            >
              View
              <ArrowUpRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
