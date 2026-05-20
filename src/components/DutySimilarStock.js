"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Car } from "lucide-react";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { carListingPath } from "@/lib/car-listing-url";
import TrackedLink from "@/components/TrackedLink";

function CompactListing({ car }) {
  const title = `${car.year} ${car.make} ${car.model}`;
  const href = carListingPath(car);

  return (
    <TrackedLink
      href={href}
      eventName="duty_similar_stock_click"
      eventPayload={{ car_id: car.id, make: car.make, model: car.model }}
      className="flex gap-3 p-3 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 hover:border-slate-400 dark:hover:border-zinc-600 transition-colors group"
      style={{ borderRadius: "var(--radius)" }}
    >
      <div className="relative w-20 h-16 shrink-0 bg-slate-100 dark:bg-zinc-800 overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
        {car.image ? (
          <Image src={car.image} alt="" fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <Car className="w-6 h-6" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#b91c1c] dark:group-hover:text-red-400 transition-colors">
          {title}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {car.engineCC ? `${car.engineCC}cc` : "n/a"} · {FUEL_LABELS[car.fuelType] || car.fuelType}
          {car.mileage ? ` · ${formatMileage(car.mileage)}` : ""}
        </p>
        <p className="text-sm font-bold text-[#b91c1c] dark:text-red-400 mt-1 tabular-nums">
          {formatCarPrice(car)}
        </p>
      </div>
    </TrackedLink>
  );
}

export default function DutySimilarStock({ make, model }) {
  const [cars, setCars] = useState([]);
  const [hubPath, setHubPath] = useState("/cars");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!make) {
      setCars([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ make });
        if (model) params.set("model", model);
        const res = await fetch(`/api/duty/similar-stock?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setCars(data.cars || []);
          setHubPath(data.hubPath || "/cars");
        }
      } catch {
        if (!cancelled) setCars([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [make, model]);

  return (
    <aside className="space-y-6">
      <div
        className="border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 p-5"
        style={{ borderRadius: "var(--radius)" }}
      >
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
          Similar stock on Welsh Motorhub
        </h2>

        {!make && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Run an estimate to see matching listings from verified dealers.
          </p>
        )}

        {make && loading && (
          <p className="text-sm text-slate-500 animate-pulse">Loading inventory…</p>
        )}

        {make && !loading && cars.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            No {make} {model || ""} listings right now. Browse all stock.
          </p>
        )}

        {cars.length > 0 && (
          <ul className="space-y-2">
            {cars.map((car) => (
              <li key={car.id}>
                <CompactListing car={car} />
              </li>
            ))}
          </ul>
        )}

        {make && (
          <TrackedLink
            href={hubPath}
            eventName="duty_similar_stock_view_all"
            eventPayload={{ make, model: model || "" }}
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[#b91c1c] dark:text-red-400 hover:opacity-80"
          >
            View all {make} {model || "cars"} <ArrowUpRight className="w-3.5 h-3.5" />
          </TrackedLink>
        )}
      </div>

      <div
        className="border border-slate-200 dark:border-zinc-800 p-5 text-sm text-slate-600 dark:text-slate-400"
        style={{ borderRadius: "var(--radius)" }}
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Why use this tool?</h3>
        <ul className="space-y-2 list-disc pl-4">
          <li>KRA-style IDF, excise, VAT, and levy breakdown</li>
          <li>Jump straight to matching cars for sale</li>
          <li>Share estimates with your importer or buyer</li>
        </ul>
        <Link href="/contact" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest hover:underline">
          Need help importing? Contact us
        </Link>
      </div>
    </aside>
  );
}
