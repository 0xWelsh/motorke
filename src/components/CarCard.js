"use client";
import React from "react";
import Link from "next/link";
import { MapPin, ImageOff, X } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { useSaveData } from "@/components/SaveDataProvider";
import { trackUiEvent } from "@/lib/analytics";
import { carListingPath } from "@/lib/car-listing-url";
import { stockCode } from "@/lib/stock-code";
import { isActiveSpotlight } from "@/lib/spotlight";
import { getListingBoostVisuals } from "@/lib/listing-boost-visuals";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import { clsx } from "clsx";

/**
 * Dense Nikkyo-style catalog car card: uniform size, hairline border,
 * no shadows/badges/buttons, uppercase make/model, price + spec lines,
 * stock ID. Whole card is clickable; hover only brightens the image.
 */
export default function CarCard({
  car,
  distance = null,
  onRemove = null,
  showSpotlight = false,
  spotlightProminent = false,
  priority = false,
  titleHtml = null,
}) {
  const spotlightActive = showSpotlight || isActiveSpotlight(car) || spotlightProminent;
  const saveData = useSaveData();
  const boost = getListingBoostVisuals(car, {
    spotlight: spotlightActive,
    prominent: spotlightProminent,
  });
  const primaryImg = car.images?.[0]?.url;
  const code = stockCode(car);
  const sold = !car.available || isInSoldGracePeriod(car);
  const make = (car.make || "").toUpperCase();
  const model = `${car.model || ""}${car.variant ? ` ${car.variant}` : ""}`.toUpperCase();
  const distanceKm = Number.isFinite(distance) ? distance : (Number.isFinite(car?.distance) ? car.distance : null);
  const distanceLabel =
    distanceKm == null
      ? null
      : distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`;

  const borderColor = boost.spotlight && boost.hot
    ? "rgba(220,38,38,0.55)"
    : boost.spotlight
      ? "rgba(220,38,38,0.45)"
      : boost.hot
        ? "rgba(249,115,22,0.45)"
        : "#D8D8D8";

  const eventPayload = {
    car_id: car.id,
    dealer_id: car?.dealer?.id || "",
    make: car.make || "",
    model: car.model || "",
    price: Number(car.price || 0),
  };

  function onCarClick(placement) {
    trackUiEvent("view_car_click", {
      ...eventPayload,
      placement,
    });
  }

  return (
    <article
      className="group flex flex-col bg-white border overflow-hidden transition-colors duration-300"
      style={{ borderColor }}
      {...(boost.active
        ? {
            "data-boost": boost.spotlight && boost.hot ? "spotlight-hot" : boost.spotlight ? "spotlight" : "hot",
          }
        : {})}
    >
      <Link
        href={carListingPath(car)}
        onClick={() => onCarClick("card")}
        className="flex flex-1 flex-col"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
          {primaryImg ? (
            <PictureImage
              src={primaryImg}
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
              <ImageOff className="h-7 w-7" />
            </div>
          )}

          {onRemove && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRemove(car.id);
              }}
              className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded bg-white/90 text-slate-600 transition-colors hover:bg-white hover:text-red-600"
              aria-label="Remove from watchlist"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-y-0.5 p-2.5">
          <h3
            className="line-clamp-1 text-[13px] font-bold uppercase leading-tight tracking-tight text-[#222]"
            title={`${car.make} ${car.model}${car.variant ? ` (${car.variant})` : ""}`}
          >
            {make}
          </h3>
          <p className="line-clamp-1 text-[13px] font-medium uppercase leading-tight tracking-tight text-[#222]">
            {titleHtml ? (
              <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
            ) : (
              model
            )}
          </p>

          <p className="mt-1 text-[15px] font-bold leading-snug tracking-tight text-slate-900">
            {formatCarPrice(car)}
          </p>

          <p className="text-[11px] leading-snug text-slate-500">
            {car.year}
            {car.mileage != null ? ` · ${formatMileage(car.mileage)}` : ""}
          </p>
          <p className="text-[11px] leading-snug text-slate-500">
            {car.transmission ? car.transmission : ""}
            {car.transmission && car.fuelType ? " · " : ""}
            {car.fuelType ? car.fuelType : ""}
          </p>
          {(car.location || distanceLabel) && (
            <p className="flex min-w-0 items-center gap-1 text-[11px] leading-snug text-slate-500">
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 truncate">
                {car.location}
                {car.location && distanceLabel ? " · " : ""}
                {distanceLabel}
              </span>
            </p>
          )}
          {code && (
            <p className={clsx("mt-0.5 text-[11px] font-semibold leading-snug", sold ? "text-red-600" : "text-[#0B56B3]")}>
              {sold ? "SOLD " : ""}#{code}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
