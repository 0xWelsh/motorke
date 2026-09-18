"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { carListingPath } from "@/lib/car-listing-url";
import { absoluteMediaUrl } from "@/lib/site-url";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import { ArrowUpRight } from "lucide-react";

export default function LuxuryVehicleCard({ car, priority = false }) {
  const href = carListingPath(car);
  const primaryImage = car.images?.[0];
  const imgSrc = primaryImage
    ? absoluteMediaUrl(primaryImage.url)
    : "/placeholder-car.jpg";
  const sold = !car.available || isInSoldGracePeriod(car);

  return (
    <Link href={href} className="group block">
      <article className="relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-800/60 transition-[border-color,box-shadow] duration-300 hover:border-zinc-700/80 hover:shadow-2xl hover:shadow-black/40">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
          <Image
            src={imgSrc}
            alt={`${car.year} ${car.make} ${car.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-[transform,filter] duration-300 group-hover:scale-[1.03] group-hover:brightness-110"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {sold && (
            <div className="absolute top-3 -left-8 z-20 w-[130px] bg-red-600 text-center text-[10px] font-black uppercase tracking-widest text-white py-0.5 rotate-[-35deg] shadow-lg">
              SOLD
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1.5">
            {car.make}
          </p>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight mb-3">
            {car.model}
            {car.variant ? ` ${car.variant}` : ""}
          </h3>

          <div className="flex items-baseline justify-between gap-4">
            <p className="text-base sm:text-lg font-bold text-white tabular-nums">
              {formatCarPrice(car)}
            </p>
            {car.mileage ? (
              <p className="text-xs text-zinc-500 font-medium tabular-nums shrink-0">
                {formatMileage(car.mileage)}
              </p>
            ) : null}
          </div>

          {/* CTA */}
          <div className="mt-4 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors duration-300">
              View Vehicle
            </span>
            <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </article>
    </Link>
  );
}
