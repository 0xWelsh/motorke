"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ImageOff } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { getThumbnailUrl } from "@/lib/image-transform";
import { formatCarPrice } from "@/lib/utils";
import { buildCarSpecSummaryItems } from "@/lib/car-display";
import { carListingPath } from "@/lib/car-listing-url";

/**
 * Compact featured row for the dealer's latest listing — small photo slideshow on the left.
 */
export default function DealerInventoryFeaturedStrip({ car, freshnessLabel }) {
  const imageUrls = (car.images || []).map((img) => img?.url).filter(Boolean);
  const [slide, setSlide] = useState(0);
  const title = `${car.year} ${car.make} ${car.model}`.replace(/\s+/g, " ").trim();
  const specLine = buildCarSpecSummaryItems(car).join(" · ");

  useEffect(() => {
    if (imageUrls.length < 2) return undefined;
    const timer = setInterval(() => {
      setSlide((prev) => (prev + 1) % imageUrls.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [imageUrls.length]);

  const activeSrc = imageUrls[slide] || imageUrls[0];

  return (
    <article className="w-full overflow-hidden border-y border-slate-200 bg-white dark:border-zinc-800 dark:bg-[#0a0a0a]">
      <div className="flex w-full min-h-[92px]">
        <Link
          href={carListingPath(car)}
          className="relative w-[30%] min-w-[108px] max-w-[132px] shrink-0 self-stretch bg-slate-100 dark:bg-zinc-900"
          aria-label={`${title} photos`}
        >
          {activeSrc ? (
            <SafeImage
              key={activeSrc}
              src={getThumbnailUrl(activeSrc)}
              alt={title}
              fill
              className="object-cover transition-opacity duration-500"
              sizes="132px"
              fallback={
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <ImageOff className="h-5 w-5" aria-hidden />
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageOff className="h-5 w-5" aria-hidden />
            </div>
          )}
          <span className="absolute left-1.5 top-1.5 z-10 bg-[#ef3340] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white">
            Latest
          </span>
          {imageUrls.length > 1 ? (
            <div className="absolute bottom-1.5 left-0 right-0 z-10 flex justify-center gap-1">
              {imageUrls.slice(0, 5).map((_, i) => (
                <span
                  key={i}
                  className={`h-1 w-1 rounded-full ${i === slide % 5 ? "bg-white" : "bg-white/45"}`}
                  aria-hidden
                />
              ))}
            </div>
          ) : null}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-2.5 py-2">
          {freshnessLabel ? (
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">{freshnessLabel}</p>
          ) : null}
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#38A169]">{car.year}</p>
            <Link href={carListingPath(car)}>
              <h3 className="text-[12px] font-black leading-tight tracking-tight text-slate-900 line-clamp-1 dark:text-white">
                {car.make} {car.model}
              </h3>
            </Link>
            {specLine ? (
              <p className="mt-0.5 text-[10px] font-semibold leading-snug text-slate-600 line-clamp-1 dark:text-slate-300">
                {specLine}
              </p>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[14px] font-black tracking-tight text-slate-900 dark:text-white">
              {formatCarPrice(car)}
            </p>
            <Link
              href={carListingPath(car)}
              className="inline-flex shrink-0 items-center gap-0.5 bg-slate-900 px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] text-white dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
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
