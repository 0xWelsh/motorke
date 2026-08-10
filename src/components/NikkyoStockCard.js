"use client";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import { formatCarPrice } from "@/lib/utils";
import { stockCode } from "@/lib/stock-code";
import { carListingPath } from "@/lib/car-listing-url";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";

/**
 * Dense Nikkyo-style stock card: 16/10 photo, hairline border,
 * uppercase make/model, price + year/stock line. No shadows or badges.
 */
export default function NikkyoStockCard({ car, priority = false }) {
  const img = car.images?.[0]?.url;
  const code = stockCode(car);
  const sold = !car.available || isInSoldGracePeriod(car);
  const make = (car.make || "").toUpperCase();
  const model = `${car.model || ""}${car.variant ? ` ${car.variant}` : ""}`.toUpperCase();

  return (
    <article className="group flex flex-col overflow-hidden border border-[#D8D8D8] bg-white">
      <Link
        href={carListingPath(car)}
        className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
      >
        {img ? (
          <PictureImage
            src={img}
            alt={`${car.year} ${car.make} ${car.model}`}
            priority={priority}
            className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 12vw"
            fallback={
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageOff className="h-7 w-7" aria-hidden />
              </div>
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageOff className="h-7 w-7" aria-hidden />
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-y-0.5 border-t border-[#D8D8D8] p-2">
        <p className="line-clamp-1 text-[12px] font-bold uppercase leading-tight tracking-tight text-[#222]">
          {make}
        </p>
        <p className="line-clamp-1 text-[12px] font-medium uppercase leading-tight tracking-tight text-[#222]">
          {model}
        </p>
        <p className="mt-1 text-[14px] font-bold leading-snug tracking-tight text-slate-900">
          {formatCarPrice(car)}
        </p>
        <p className="text-[11px] leading-snug text-slate-500">
          {car.year}
          {code ? (
            <span className={sold ? "font-semibold text-red-600" : "font-semibold text-[#0B56B3]"}>
              {" · "}
              {sold ? "SOLD " : ""}#{code}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  );
}
