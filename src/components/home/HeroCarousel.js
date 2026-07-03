"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { carListingPath } from "@/lib/car-listing-url";
import { getThumbnailUrl } from "@/lib/image-transform";

export default function HeroCarousel({ cars = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (cars.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % cars.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [cars.length]);

  if (!cars.length) return null;

  const safeIndex = index % cars.length;
  const car = cars[safeIndex];
  const imgUrl = car?.images?.[0]?.url ?? car?.image;

  const details = [
    car.mileage ? `${Number(car.mileage).toLocaleString("en-KE")} km` : null,
    car.fuelType || null,
    car.transmission || null,
  ].filter(Boolean);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="relative flex items-center">
        {cars.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((safeIndex - 1 + cars.length) % cars.length)}
            className="absolute -left-3 z-10 w-7 h-7 flex items-center justify-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            style={{ borderRadius: "var(--radius)" }}
            aria-label="Previous car"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </button>
        )}

        <Link
          href={carListingPath(car)}
          className="flex w-full overflow-hidden bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors group"
          style={{ borderRadius: "var(--radius)" }}
        >
          <div className="relative w-[140px] shrink-0 bg-slate-100 dark:bg-slate-900">
            {imgUrl ? (
              <Image
                src={getThumbnailUrl(imgUrl, 140)}
                alt={`${car.year} ${car.make} ${car.model}`}
                fill
                className="object-cover"
                sizes="140px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-black text-slate-400 dark:text-slate-600">{car.make?.[0]}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col justify-between min-w-0 flex-1 px-3 py-2.5 gap-1">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500">
                {car.year}  ·  {car.make}
              </p>
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#38A169] transition-colors">
                {car.model}{car.variant ? ` ${car.variant}` : ""}
              </h3>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[#38A169]">
                KSh {Number(car.price).toLocaleString("en-KE")}
              </span>
            </div>
            {details.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {details.map((d) => (
                  <span
                    key={d}
                    className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5"
                    style={{ borderRadius: "var(--radius)" }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>

        {cars.length > 1 && (
          <button
            type="button"
            onClick={() => setIndex((safeIndex + 1) % cars.length)}
            className="absolute -right-3 z-10 w-7 h-7 flex items-center justify-center bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            style={{ borderRadius: "var(--radius)" }}
            aria-label="Next car"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          </button>
        )}
      </div>

      {cars.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-1.5">
          {cars.slice(0, Math.min(cars.length, 8)).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all ${
                i === safeIndex ? "w-4 h-1.5 bg-[#38A169]" : "w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
              }`}
              aria-label={`View car ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
