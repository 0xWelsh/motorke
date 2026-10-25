"use client";
import React from "react";
import Link from "next/link";
import { MapPin, ImageOff, X } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { formatListedAge } from "@/lib/format-age";
import { useSaveData } from "@/components/SaveDataProvider";
import { trackUiEvent } from "@/lib/analytics";
import { carListingPath } from "@/lib/car-listing-url";
import { isActiveSpotlight } from "@/lib/spotlight";
import { getListingBoostVisuals } from "@/lib/listing-boost-visuals";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import { clsx } from "clsx";
import { CarNavPendingSignal } from "@/components/CarNavPending";
import AdminCardControls from "@/components/AdminCardControls";
import { useCarFlag } from "@/hooks/use-car-flag";

/**
 * Dense Nikkyo-style catalog car card: uniform size, hairline border,
 * no shadows/badges/buttons, uppercase make/model, price + spec lines,
 * stock ID. Whole card is clickable; hover only brightens the image.
 */

// Every grid that renders this card is 2-up on mobile, so ~48vw is the true
// slot width there. Declaring that honestly is what lets phones select the
// 400w WebP (~25KB) instead of the 800w one (~100KB).
const GRID_SIZES = "(max-width: 768px) 48vw, (max-width: 1024px) 24vw, 16vw";
export default function CarCard({
  car,
  distance = null,
  onRemove = null,
  showSpotlight = false,
  spotlightProminent = false,
  priority = false,
  titleHtml = null,
  layout = "grid",
  sizes,
}) {
  const spotlightActive = showSpotlight || isActiveSpotlight(car) || spotlightProminent;
  const isList = layout === "list";
  const saveData = useSaveData();
  // Instant admin overrides (mark sold / hide) applied before the server refresh
  // catches up, so the card reacts immediately.
  const soldFlag = useCarFlag(car.id, "sold");
  const hiddenFlag = useCarFlag(car.id, "hidden");
  const boost = getListingBoostVisuals(car, {
    spotlight: spotlightActive,
    prominent: spotlightProminent,
  });
  const primaryImg = car.images?.[0]?.url;
  const sold = soldFlag !== undefined ? Boolean(soldFlag) : !car.available || isInSoldGracePeriod(car);
  const titleCase = (s) =>
    String(s || "").replace(/\S+/g, (word) =>
      word === word.toUpperCase() && word.length > 1
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  const make = titleCase(car.make);
  const model = titleCase(`${car.model || ""}${car.variant ? ` ${car.variant}` : ""}`).trim();
  const fuelLabel = FUEL_LABELS[car.fuelType] || car.fuelType || "";
  const transLabel =
    car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission || "";
  const specBits = [
    car.year,
    car.mileage != null ? formatMileage(car.mileage) : null,
    fuelLabel || null,
    transLabel || null,
  ].filter(Boolean);
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

  if (hiddenFlag) return null;

  // Compact row: tiny thumbnail + one-line title + price/specs inline. Fits
  // ~2-3x more cars per screen than the grid for power browsing.
  if (layout === "compact") {
    return (
      <article
        className="group flex items-stretch bg-white border overflow-hidden transition-colors duration-300"
        style={{ borderColor, touchAction: "manipulation" }}
      >
        <Link
          href={carListingPath(car)}
          onClick={() => onCarClick("card_compact")}
          className="flex w-full items-center gap-2.5 p-2"
        >
          <div className={`relative h-[52px] w-[84px] sm:h-16 sm:w-28 shrink-0 overflow-hidden rounded-md bg-slate-100${sold ? " grayscale" : ""}`}>
            {primaryImg ? (
              <PictureImage
                src={primaryImg}
                alt={`${car.year} ${car.make} ${car.model}`}
                priority={priority}
                className="absolute inset-0 h-full w-full object-cover"
                sizes="120px"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageOff className="h-5 w-5" aria-hidden />
                  </div>
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageOff className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-bold italic leading-tight text-[var(--brand-navy)]">
              {make} {model}
            </h3>
            <p className="mt-0.5 whitespace-nowrap text-[15px] font-bold leading-snug text-[var(--accent)]">
              {formatCarPrice(car)}
            </p>
            <p className="truncate text-[11px] leading-snug text-slate-500">
              {[...specBits, car.location ? car.location : null, distanceLabel ? distanceLabel : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <CarNavPendingSignal />
        </Link>
      </article>
    );
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
            `${isList
              ? "relative w-[42%] shrink-0 sm:w-64 aspect-[4/3] overflow-hidden bg-slate-100"
              : "relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-100"}${sold ? " grayscale" : ""}`
          }
        >
          {primaryImg ? (
            <PictureImage
              src={primaryImg}
              alt={`${car.year} ${car.make} ${car.model}`}
              priority={priority}
              className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-110"
              sizes={sizes || (isList ? "(max-width: 768px) 42vw, 16vw" : GRID_SIZES)}
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
              className="absolute right-1.5 top-1.5 inline-flex h-9 w-9 items-center justify-center rounded bg-white/90 text-slate-600 transition-colors hover:bg-white hover:text-red-600 sm:h-7 sm:w-7"
              aria-label="Remove from watchlist"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <AdminCardControls car={car} />
        </div>

        {/* Details */}
        <div className="flex flex-1 flex-col gap-y-1 min-w-0 p-2.5 md:p-3">
          <h3
            className="line-clamp-1 text-[15px] font-extrabold leading-tight tracking-tight text-slate-900"
            title={`${car.make} ${car.model}${car.variant ? ` (${car.variant})` : ""}`}
          >
            {[car.year, make, model].filter(Boolean).join(" ")}
          </h3>

          <p className="mt-1 text-[16px] font-black leading-snug tracking-tight text-[var(--accent)]">
            {formatCarPrice(car)}
          </p>

          {(() => {
            const featureParts = [
              car.mileage != null ? formatMileage(car.mileage) : null,
              transLabel || null,
              fuelLabel || null,
              car.bodyType || null,
              car.color || null,
            ].filter(Boolean);
            if (!featureParts.length) return null;
            return (
              <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">
                {featureParts.join(", ")}
              </p>
            );
          })()}
          {car.createdAt && (
            <p className="text-[11px] leading-snug text-slate-400">
              Listed {formatListedAge(car.createdAt)}
            </p>
          )}
          {(car.location || distanceLabel) && (
            <p className={clsx("flex min-w-0 items-center gap-1 text-[12px] leading-snug text-slate-500", !isList && "hidden sm:flex")}>
              <MapPin className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
              <span className="min-w-0 truncate">
                {car.location}
                {car.location && distanceLabel ? " · " : ""}
                {distanceLabel}
              </span>
            </p>
          )}
          <CarNavPendingSignal />
        </div>
      </Link>

      {/* List bottom row: call to action */}
      {isList && (
        <div className="flex items-stretch border-t" style={{ borderColor }}>
          <Link
            href={carListingPath(car)}
            onClick={() => onCarClick("card_detail")}
            className="flex flex-1 items-center justify-center bg-[var(--accent)] px-3 py-2.5 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            View Details
          </Link>
        </div>
      )}
    </article>
  );
}
