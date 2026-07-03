"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gauge, Settings, Fuel, ArrowRight } from "lucide-react";
import { getThumbnailUrl, saveDataQuality } from "@/lib/image-transform";
import { formatCarPrice } from "@/lib/utils";
import { carListingPath } from "@/lib/car-listing-url";
import { useSaveData } from "@/components/SaveDataProvider";

const INITIAL_COUNT = 5;

export default function SimilarCarsSection({ cars, make }) {
  const saveData = useSaveData();
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? cars : cars.slice(0, INITIAL_COUNT);
  const hasMore = cars.length > INITIAL_COUNT;

  if (!cars.length) return null;

  return (
    <div className="mb-8 border-t border-[#EDF2F7] dark:border-zinc-800 pt-8">
      <div className="flex items-end justify-between gap-4 mb-5 sm:mb-7">
        <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] border-l-2 border-[#38A169] pl-3">
          Similar Cars
        </h2>
        <Link
          href={`/cars/${make?.toLowerCase() || ""}`}
          className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#38A169] transition-colors"
        >
          All {make} →
        </Link>
      </div>
      <div className="relative -mx-4 sm:mx-0">
        <div className="flex flex-col gap-3 px-4 sm:px-0">
          {displayed.map((sc) => {
            const thumbUrl = sc.images?.[0]?.url ? getThumbnailUrl(sc.images[0].url, 400, saveDataQuality(saveData, 80)) : null;
            const variantParts = [];
            if (sc.engineCC) variantParts.push(`${(Number(sc.engineCC) / 1000).toFixed(1)}L`);
            if (sc.turbo) variantParts.push("Turbo");
            const title = `${sc.make} ${sc.model}${sc.variant ? ` (${sc.variant})` : ""}`;

            return (
              <Link
                key={sc.id}
                href={carListingPath(sc)}
                className="group flex gap-3 sm:gap-4 bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 rounded-sm overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="relative w-28 sm:w-36 shrink-0 aspect-[4/3] bg-slate-100 dark:bg-zinc-800">
                  {thumbUrl ? (
                    <Image
                      src={thumbUrl}
                      alt={sc.images?.[0]?.alt || `${sc.year} ${sc.make} ${sc.model}`}
                      fill
                      loading="lazy"
                      decoding="async"
                      quality={75}
                      className="object-cover"
                      sizes="144px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-black text-slate-400 dark:text-zinc-500">{formatCarPrice(sc)}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center py-2.5 pr-3 min-w-0 flex-1">
                  <div className="flex items-start gap-1.5 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-zinc-500 mt-0.5 shrink-0">
                      {sc.year}
                    </span>
                    <h3 className="text-[13px] sm:text-[15px] font-bold text-[#111827] dark:text-white leading-tight truncate group-hover:text-[#38A169] transition-colors">
                      {title}
                    </h3>
                  </div>
                  {variantParts.length > 0 && (
                    <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 leading-tight truncate mb-1.5">
                      {variantParts.join(" · ")}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {sc.mileage != null && (
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="w-3 h-3 shrink-0" />
                        {`${(Number(sc.mileage) / 1000).toFixed(0)}k km`}
                      </span>
                    )}
                    {sc.transmission && (
                      <span className="inline-flex items-center gap-1">
                        <Settings className="w-3 h-3 shrink-0" />
                        {sc.transmission === "AUTOMATIC" ? "Auto" : "Manual"}
                      </span>
                    )}
                    {sc.fuelType && (
                      <span className="inline-flex items-center gap-1">
                        <Fuel className="w-3 h-3 shrink-0" />
                        {sc.fuelType === "HYBRID" ? "Hybrid" : sc.fuelType === "ELECTRIC" ? "Electric" : sc.fuelType === "DIESEL" ? "Diesel" : "Petrol"}
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] sm:text-[15px] font-black text-[#111827] dark:text-white tracking-tight">
                    {formatCarPrice(sc)}
                    {sc.negotiable && <span className="text-[10px] font-semibold text-slate-400 ml-1.5">nego</span>}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {hasMore && (
          <div className="mt-4 px-4 sm:px-0">
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-[11px] font-bold tracking-wide text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {showAll ? "Show less" : `Show ${cars.length - INITIAL_COUNT} more similar cars`}
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${showAll ? "rotate-90" : ""}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
