"use client";
import React from "react";
import Link from "next/link";
import { MapPin, ImageOff, X } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { useSaveData } from "@/components/SaveDataProvider";
import { trackUiEvent } from "@/lib/analytics";
import { carListingPath } from "@/lib/car-listing-url";
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
  layout = "grid",
}) {
  const spotlightActive = showSpotlight || isActiveSpotlight(car) || spotlightProminent;
  const isList = layout === "list";
  const saveData = useSaveData();
  const boost = getListingBoostVisuals(car, {
    spotlight: spotlightActive,
    prominent: spotlightProminent,
  });
  const primaryImg = car.images?.[0]?.url;
  const sold = !car.available || isInSoldGracePeriod(car);
  const titleCase = (s) =>
    String(s || "").replace(/\S+/g, (word) =>
      word === word.toUpperCase() && word.length > 1
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  const make = titleCase(car.make);
  const model = titleCase(`${car.model || ""}${car.variant ? ` ${car.variant}` : ""}`).trim();
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
      style={{ borderColor, touchAction: "manipulation" }}
      {...(boost.active
        ? {
            "data-boost": boost.spotlight && boost.hot ? "spotlight-hot" : boost.spotlight ? "spotlight" : "hot",
          }
        : {})}
    >
      <Link
        href={carListingPath(car)}
        onClick={() => onCarClick(isList ? "card_list" : "card")}
        className={clsx(isList ? "flex" : "flex flex-1 flex-col")}
      >
        {/* Image */}
        <div
          className={
            isList
              ? "relative w-[42%] shrink-0 sm:w-64 aspect-[4/3] overflow-hidden bg-slate-100"
              : "relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100"
          }
        >
          {primaryImg ? (
            <PictureImage
              src={primaryImg}
              alt={`${car.year} ${car.make} ${car.model}`}
              priority={priority}
              className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-110"
              sizes={isList ? "(max-width: 768px) 42vw, 16vw" : "(max-width: 768px) 96vw, (max-width: 1200px) 25vw, 12vw"}
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
        <div className="flex flex-1 flex-col gap-y-1 min-w-0 p-3 md:p-3">
          <h3
            className="line-clamp-1 text-[14px] font-bold italic leading-tight tracking-tight text-[#13356f]"
            title={`${car.make} ${car.model}${car.variant ? ` (${car.variant})` : ""}`}
          >
            {make}
          </h3>
          <p className="line-clamp-1 text-[14px] font-semibold leading-tight tracking-tight text-[#0066ff] underline-offset-2 group-hover:underline">
            {titleHtml ? (
              <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
            ) : (
              model
            )}
          </p>

          <p className="mt-1 text-[16px] font-bold leading-snug tracking-tight text-[#a94442]">
            {formatCarPrice(car)}
          </p>

          <p className="text-[12px] leading-snug text-slate-500">
            {car.year}
            {car.mileage != null ? ` · ${formatMileage(car.mileage)}` : ""}
          </p>
          {(car.location || distanceLabel) && (
            <p className="flex min-w-0 items-center gap-1 text-[12px] leading-snug text-slate-500">
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 truncate">
                {car.location}
                {car.location && distanceLabel ? " · " : ""}
                {distanceLabel}
              </span>
            </p>
          )}
        </div>
      </Link>

      {/* List bottom row: call to action */}
      {isList && (
        <div className="flex items-stretch border-t" style={{ borderColor }}>
          <Link
            href={carListingPath(car)}
            onClick={() => onCarClick("card_detail")}
            className="flex flex-1 items-center justify-center bg-[#d9534f] px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#c9302c]"
          >
            View Details
          </Link>
        </div>
      )}
    </article>
  );
}
