"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { carListingPath } from "@/lib/car-listing-url";
import { getThumbnailUrl } from "@/lib/image-transform";
import { trackUiEvent } from "@/lib/analytics";
import { FUEL_LABELS } from "@/lib/constants";

export default function HeroCarousel({ cars = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (cars.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % cars.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [cars.length]);

  if (!cars.length) return null;

  const safeIndex = index % cars.length;
  const featured = cars[safeIndex];

  const images = Array.isArray(featured?.images) ? featured.images.filter(Boolean) : [];
  const mainImg = images[0]?.url ?? featured?.images?.[0]?.url ?? featured?.image;
  const thumbs = images.slice(1, 4);

  const details = [
    featured.mileage ? `${Number(featured.mileage).toLocaleString("en-KE")} km` : null,
    featured.engineCC ? `${Number(featured.engineCC).toLocaleString("en-KE")} cc` : null,
    featured.fuelType ? FUEL_LABELS[featured.fuelType] || String(featured.fuelType) : null,
    featured.location || featured.dealer?.location || null,
  ].filter(Boolean);

  return (
    <div className="mt-6 sm:mt-8">
      <div className="mb-3 sm:mb-4">
        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.28em] text-[var(--accent)]">
          Featured
        </p>
        <h2 className="mt-1 text-[clamp(1.5rem,4vw,2.4rem)] font-black leading-[1.05] tracking-tight text-slate-900">
          Spotlight
        </h2>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Link
          href={carListingPath(featured)}
          onClick={() =>
            trackUiEvent("hero_spotlight_click", {
              car_id: featured.id,
              make: featured.make,
              model: featured.model,
            })
          }
          className="group block"
        >
          <div className="relative aspect-[16/9] sm:aspect-[16/8] lg:aspect-[16/7] w-full overflow-hidden bg-slate-100">
            {mainImg ? (
              <Image
                src={getThumbnailUrl(mainImg, 1920)}
                alt={`${featured.year} ${featured.make} ${featured.model}`}
                fill
                priority={safeIndex === 0}
                sizes="(min-width:1280px) 1100px, (min-width:1024px) 920px, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-7xl font-black text-slate-200">{featured.make?.[0]}</span>
              </div>
            )}
          </div>
        </Link>

        {thumbs.length > 0 && (
          <div className="grid grid-cols-3 gap-px bg-slate-200">
            {thumbs.map((thumb, i) => {
              const turl = typeof thumb === "string" ? thumb : thumb?.url;
              if (!turl) return null;
              return (
                <Link
                  key={`${featured.id}-gallery-${i + 1}`}
                  href={carListingPath(featured)}
                  onClick={() =>
                    trackUiEvent("hero_spotlight_thumb_click", {
                      car_id: featured.id,
                      make: featured.make,
                      model: featured.model,
                    })
                  }
                  className="group relative aspect-[4/3] overflow-hidden bg-slate-100"
                >
                  <Image
                    src={getThumbnailUrl(turl, 800)}
                    alt={`${featured.year} ${featured.make} ${featured.model} photo ${i + 2}`}
                    fill
                    sizes="(min-width:1024px) 300px, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Link href={carListingPath(featured)} className="group/link inline-flex items-center gap-2">
              <h3 className="truncate text-lg font-black text-slate-900 sm:text-xl lg:text-2xl">
                {featured.year} {featured.make} {featured.model}
                {featured.variant ? ` ${featured.variant}` : ""}
              </h3>
              <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover/link:text-[var(--accent)]" />
            </Link>
            {details.length > 0 && (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
                {details.map((d, i) => (
                  <span key={d} className="inline-flex items-center gap-x-2">
                    {d}
                    {i < details.length - 1 && <span className="text-slate-300">•</span>}
                  </span>
                ))}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-black text-[var(--accent)] sm:text-2xl">
              KES {Number(featured.price || 0).toLocaleString("en-KE")}
            </span>
            <Link
              href={carListingPath(featured)}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              View listing
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}




