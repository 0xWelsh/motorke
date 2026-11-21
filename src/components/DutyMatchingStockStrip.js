"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Car } from "lucide-react";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { carListingPath } from "@/lib/car-listing-url";
import TrackedLink from "@/components/TrackedLink";
import { getThumbnailUrl } from "@/lib/image-transform";

function StripCard({ car }) {
  const title = `${car.year} ${car.make} ${car.model}`;
  return (
    <TrackedLink
      href={carListingPath(car)}
      eventName="duty_matching_strip_click"
      eventPayload={{ car_id: car.id, make: car.make, model: car.model }}
      className="group flex w-56 shrink-0 flex-col overflow-hidden border border-border bg-surface hover:border-strong transition-colors"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="relative h-28 w-full bg-surface-overlay">
        {car.image ? (
          <Image src={getThumbnailUrl(car.image, 320)} alt="" fill className="object-cover" sizes="224px" />
        ) : (
          <div className="flex h-full items-center justify-center text-dim">
            <Car className="w-7 h-7" aria-hidden />
          </div>
        )}
      </div>
      <div className="p-3 min-w-0">
        <p className="text-xs font-bold text-text truncate group-hover:text-accent transition-colors">
          {title}
        </p>
        <p className="text-[10px] text-muted mt-0.5 truncate">
          {car.engineCC ? `${car.engineCC}cc` : "n/a"}, {FUEL_LABELS[car.fuelType] || car.fuelType}
          {car.mileage ? `, ${formatMileage(car.mileage)}` : ""}
        </p>
        <p className="text-sm font-bold text-accent mt-1.5 tabular-nums">{formatCarPrice(car)}</p>
      </div>
    </TrackedLink>
  );
}

export default function DutyMatchingStockStrip({ make, model }) {
  const [cars, setCars] = useState([]);
  const [hubPath, setHubPath] = useState("/cars");

  useEffect(() => {
    if (!make) {
      setCars([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({ make });
        if (model) params.set("model", model);
        const res = await fetch(`/api/duty/similar-stock?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setCars((data.cars || []).slice(0, 4));
          setHubPath(data.hubPath || "/cars");
        }
      } catch {
        if (!cancelled) setCars([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [make, model]);

  if (!make || cars.length === 0) return null;

  return (
    <div className="duty-print-hide mt-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          {make} {model || ""} for sale now
        </p>
        <TrackedLink
          href={hubPath}
          eventName="duty_matching_strip_view_all"
          eventPayload={{ make, model: model || "" }}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-accent hover:opacity-80"
        >
          View all <ArrowUpRight className="w-3.5 h-3.5" />
        </TrackedLink>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {cars.map((car) => (
          <div key={car.id} className="snap-start">
            <StripCard car={car} />
          </div>
        ))}
      </div>
    </div>
  );
}
