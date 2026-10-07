"use client";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import { formatCarPrice } from "@/lib/utils";
import { carListingPath } from "@/lib/car-listing-url";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";

const titleCase = (s) =>
  String(s || "").replace(/\S+/g, (word) =>
    word === word.toUpperCase() && word.length > 1
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

function CardImage({ img, alt, priority, fill, sold }) {
  return (
    <>
      {img ? (
        <PictureImage
          src={img}
          alt={alt}
          priority={priority}
          className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-110"
          sizes="(max-width: 768px) 96vw, (max-width: 1200px) 25vw, 12vw"
          fallback={
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageOff className="h-7 w-7" aria-hidden />
            </div>
          }
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-slate-300">
          <ImageOff className="h-7 w-7" />
        </div>
      )}
      {fill && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden />
      )}
      {sold && (
        <div className="absolute top-2 -left-7 z-20 w-[120px] bg-red-600 text-center text-[9px] font-black uppercase tracking-widest text-white py-0.5 rotate-[-35deg] shadow-lg">
          SOLD
        </div>
      )}
    </>
  );
}

/**
 * Airier Nikkyo-style stock card: horizontal on mobile (image left, info right),
 * stacked 4/3 photo + info from md up. Navy italic make, link-blue model,
 * red price. No badges, no stock codes.
 */
export default function NikkyoStockCard({ car, priority = false, fill = false }) {
  const img = car.images?.[0]?.url;
  const sold = !car.available || isInSoldGracePeriod(car);
  const make = titleCase(car.make);
  const model = titleCase(`${car.model || ""}${car.variant ? ` ${car.variant}` : ""}`).trim();
  const alt = `${car.year} ${car.make} ${car.model}`;

  if (fill) {
    return (
      <article className="group relative flex flex-col overflow-hidden border border-[#D8D8D8] bg-white h-full" style={{ touchAction: "manipulation" }}>
        <Link href={carListingPath(car)} className="absolute inset-0 overflow-hidden bg-slate-100">
          <CardImage img={img} alt={alt} priority={priority} fill sold={sold} />
        </Link>
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-y-0.5 p-2.5">
          <p className="line-clamp-1 text-[11px] font-bold leading-tight tracking-tight text-white">
            {make}
          </p>
          <p className="line-clamp-1 text-[11px] font-medium leading-tight tracking-tight text-white/85">
            {model}
          </p>
          <p className="mt-0.5 text-[12px] font-bold leading-snug tracking-tight text-white">
            {formatCarPrice(car)}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col overflow-hidden border border-[#D8D8D8] bg-white" style={{ touchAction: "manipulation" }}>
      <Link href={carListingPath(car)} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100">
          <CardImage img={img} alt={alt} priority={priority} fill={false} sold={sold} />
        </div>

        <div className="flex flex-1 flex-col gap-y-1 min-w-0 p-3">
          <p className="line-clamp-1 text-[14px] font-bold italic leading-tight tracking-tight text-[var(--brand-navy)]">
            {make}
          </p>
          <p className="line-clamp-1 text-[14px] font-semibold leading-tight tracking-tight text-[#0066ff] underline-offset-2 group-hover:underline">
            {model}
          </p>
          {car.marketAnalysis && (
            <span className="mt-0.5 inline-flex w-max items-center rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              {car.marketAnalysis.label}
            </span>
          )}
          <p className="mt-1 text-[16px] font-bold leading-snug tracking-tight text-[var(--accent)]">
            {formatCarPrice(car)}
          </p>
          <p className="text-[12px] leading-snug text-slate-500">
            {car.year}
            {car.mileage != null ? ` · ${Math.round(car.mileage).toLocaleString()} km` : ""}
          </p>
        </div>
      </Link>
    </article>
  );
}