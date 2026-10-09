// src/components/detail/ListingTitleBar.js
// Title, price and the compact spec strip that sits directly under the
// gallery — the first thing a buyer reads. One price, one spec strip: the
// page must not restate the same facts in three different components.
import Link from "next/link";
import { MapPin, Clock, Settings, Fuel, Gauge, Calendar } from "lucide-react";
import { FUEL_LABELS, CAR_STATUS_LABELS, CAR_STATUS_COLORS } from "@/lib/constants";
import { positiveNum } from "@/lib/car-display";
import { ORIGIN_FLAGS } from "@/lib/car-detail-fields";

export default function ListingTitleBar({
  car,
  dealer,
  carName,
  priceLabel,
  locationLabel,
  freshLabel,
  soldGrace,
  quickFacts,
}) {
  const originFlag = ORIGIN_FLAGS[car.importCountry] || "";
  const originLabel =
    car.imported === false
      ? "Local"
      : car.importCountry
        ? `Imported${originFlag ? ` ${originFlag}` : ""}`
        : "Imported";

  const ICONS = {
    calendar: Calendar,
    settings: Settings,
    fuel: Fuel,
    location: MapPin,
    mileage: Gauge,
  };

  return (
    <div>
      {/* Name, then price directly beneath it. Stacked rather than opposed on
          one row so the price never gets squeezed to a truncated column on a
          narrow phone, and so "which car / how much" still reads top-down in
          two short lines. */}
      <h1 className="text-[20px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[26px] lg:text-[32px]">
        {carName}
      </h1>

      <div className="mt-1.5">
        <p className="text-[28px] font-bold leading-none tracking-tight text-[var(--accent)] tabular-nums sm:text-[34px] lg:text-[38px]">
          {priceLabel}
        </p>
        {car.negotiable ? (
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Negotiable
          </p>
        ) : null}
      </div>

      {/* Meta strip — single source of truth for year / transmission / fuel /
          mileage / location / freshness. */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-slate-500">
        {quickFacts.map((fact, i) => {
          const Icon = ICONS[fact.icon];
          if (!fact.value) return null;
          return (
            <span key={i} className="inline-flex items-center gap-1.5">
              {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden /> : null}
              <span className="font-medium capitalize">{fact.value}</span>
            </span>
          );
        })}

        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span className="font-medium">{locationLabel}</span>
        </span>

        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
          <span>{freshLabel}</span>
        </span>
      </div>

      {/* Status chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest ${
            soldGrace ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {soldGrace ? "Sold" : "Available"}
        </span>
        <span className="rounded bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-600">
          {originLabel}
        </span>
        {car.carStatus && (
          <span className={`rounded px-2 py-1 text-[9px] font-black uppercase tracking-widest ${CAR_STATUS_COLORS[car.carStatus]}`}>
            {CAR_STATUS_LABELS[car.carStatus]}
          </span>
        )}
        {positiveNum(car.mileage) ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {car.mileage.toLocaleString("en-KE")} km
          </span>
        ) : null}
      </div>

      {dealer?.slug ? (
        <p className="mt-2.5 text-[11px] text-slate-400">
          Listed by{" "}
          <Link href={`/dealers/${dealer.slug}`} className="font-bold text-slate-600 hover:underline">
            {dealer.name}
          </Link>
        </p>
      ) : null}
    </div>
  );
}