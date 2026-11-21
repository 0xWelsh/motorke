"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { absoluteMediaUrl } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import { formatCarPrice } from "@/lib/utils";
import { Eye } from "lucide-react";

export default function AlsoViewed({ carId }) {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!carId) return;
    fetch(`/api/cars/${carId}/related-views`)
      .then((r) => r.json())
      .then((d) => setCars(d.cars || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carId]);

  if (loading || cars.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-dim" />
        <h2 className="text-sm font-bold text-text tracking-tight">
          People who viewed this also looked at
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cars.map((car) => {
          const img = car.images?.[0];
          return (
            <Link
              key={car.id}
              href={carListingPath(car)}
              className="group block rounded-xl border border-border bg-surface overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[16/10] bg-surface-overlay">
                {img ? (
                  <Image
                    src={absoluteMediaUrl(img.url)}
                    alt={`${car.year} ${car.make} ${car.model}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ghost text-xs">
                    No photo
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[9px] font-bold uppercase tracking-wider text-dim">
                  {car.make}
                </p>
                <p className="text-xs font-bold text-text truncate leading-tight">
                  {car.model}
                </p>
                <p className="text-[11px] font-bold text-secondary mt-1">
                  {formatCarPrice(car)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
