"use client";
import React from "react";
import Link from "next/link";
import { MapPin, ImageOff, ArrowUpRight, Share2, Gauge, Settings, Fuel, X } from "lucide-react";
import PictureImage from "@/components/PictureImage";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { useSaveData } from "@/components/SaveDataProvider";
import { trackUiEvent } from "@/lib/analytics";
import { carListingPath } from "@/lib/car-listing-url";
import { isActiveHotBadge } from "@/lib/hot-badge";
import { isActiveSpotlight } from "@/lib/spotlight";
import { getListingBoostVisuals } from "@/lib/listing-boost-visuals";
import { isInSoldGracePeriod } from "@/lib/car-sold-status";
import { clsx } from "clsx";

/**
 * Premium dark-mode CarCard with glassmorphism.
 */
export default function CarCard({
  car,
  distance = null,
  onRemove = null,
  showSpotlight = false,
  spotlightProminent = false,
  hideSpotlightBadge = false,
  compact = false,
  spacious = false,
  priority = false,
  titleHtml = null,
}) {
  const spotlightActive = showSpotlight || isActiveSpotlight(car) || spotlightProminent;
  const showSpotlightBadge =
    !hideSpotlightBadge && (showSpotlight || isActiveSpotlight(car));
  const showHot = isActiveHotBadge(car);
  const saveData = useSaveData();
  const boost = getListingBoostVisuals(car, {
    spotlight: spotlightActive,
    prominent: spotlightProminent,
  });
  const primaryImg = car.images?.[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ( ${car.variant} )` : ""}`;
  const distanceKm = Number.isFinite(distance) ? distance : (Number.isFinite(car?.distance) ? car.distance : null);
  const distanceLabel =
    distanceKm == null
      ? null
      : distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`;

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

  function handleShare() {
    const titleText = `${car.year} ${car.make} ${car.model}`.replace(/\s+/g, " ").trim();
    const isSold = !car.available || isInSoldGracePeriod(car);
    const soldPrefix = isSold ? "SOLD " : "";
    const path = carListingPath(car);
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    const shareText = `${soldPrefix}${titleText} - ${formatCarPrice(car)}. View photos and details: ${shareUrl}`;

    trackUiEvent("share_car_click", {
      ...eventPayload,
      placement: "card",
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `${soldPrefix}${titleText}`,
        text: `${soldPrefix}${titleText} - ${formatCarPrice(car)}`,
        url: shareUrl,
      }).catch(() => {});
      return;
    }

    if (typeof window !== "undefined") {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <article
      className={clsx(
        "group flex flex-col bg-[#0f0f0f] border border-white/[0.06] overflow-hidden transition-all duration-300 ease-out rounded-xl",
        "hover:border-white/[0.12] hover:shadow-glass hover:-translate-y-1",
        boost.cardBorderClass && `!${boost.cardBorderClass}`
      )}
      {...(boost.active
        ? {
            "data-boost": boost.spotlight && boost.hot ? "spotlight-hot" : boost.spotlight ? "spotlight" : "hot",
          }
        : {})}
    >
      {/* Image Container */}
      <Link
        href={carListingPath(car)}
        onClick={() => onCarClick("image")}
        className={clsx(
          "relative bg-[#111111] overflow-hidden block",
          compact
            ? "aspect-[16/10] lg:aspect-[16/11]"
            : spacious
              ? "aspect-[16/10] sm:aspect-[16/9]"
              : "aspect-[16/11]"
        )}
      >
        {primaryImg ? (
          <PictureImage
            src={primaryImg}
            alt={title}
            priority={priority}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes={
              spacious
                ? "(max-width: 1024px) 100vw, 33vw"
                : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
            fallback={
              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                <ImageOff className="w-8 h-8" aria-hidden />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-700">
             <ImageOff className="w-8 h-8" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top overlays */}
        <div
          className={clsx(
            "pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex items-start justify-between gap-2",
            compact ? "lg:inset-x-4 lg:top-4 lg:gap-2" : "sm:inset-x-4 sm:top-4 sm:gap-2"
          )}
        >
          <div
            className={
              distanceLabel || showSpotlightBadge || showHot
                ? "min-w-0 max-w-[calc(100%-5.5rem)] sm:max-w-[calc(100%-7rem)]"
                : "min-w-0 flex-1"
            }
          >
            {!car.available || isInSoldGracePeriod(car) ? (
              <span
                className="pointer-events-auto mb-1 inline-flex max-w-full items-center bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white border border-white/10 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.16em] rounded-md"
              >
                Sold
              </span>
            ) : null}
            {showHot ? (
              <span
                className="pointer-events-auto mb-1 inline-flex max-w-full items-center bg-[var(--accent-red)]/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white border border-white/10 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.16em] rounded-md"
              >
                Hot
              </span>
            ) : null}
            {showSpotlightBadge ? (
              <span
                className="pointer-events-auto mb-1 inline-flex max-w-full items-center bg-[var(--accent)]/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-black border border-white/10 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.16em] rounded-md"
              >
                Spotlight
              </span>
            ) : null}
            {car.vehicleType === "MOTORBIKE" ? (
              <span
                className="pointer-events-auto mb-1 inline-flex max-w-full items-center bg-[var(--accent-blue)]/90 backdrop-blur-sm px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-white border border-white/10 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.16em] rounded-md"
              >
                Motorbike
              </span>
            ) : null}
            {distanceLabel ? (
              <span
                className="pointer-events-auto inline-flex max-w-full items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.12em] border border-white/10 rounded-md"
                title={`${distanceLabel} away`}
              >
                <MapPin className="h-2.5 w-2.5 shrink-0 text-[var(--accent)] sm:h-3 sm:w-3" aria-hidden />
                <span className="min-w-0 truncate tabular-nums">{distanceLabel}</span>
              </span>
            ) : null}
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-1.5">
            {onRemove && (
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onRemove(car.id);
                }}
                className="inline-flex h-7 w-7 items-center justify-center bg-black/50 backdrop-blur-md text-zinc-400 transition-colors hover:bg-black/70 hover:text-white sm:h-8 sm:w-8 border border-white/10 rounded-lg"
                aria-label="Remove from watchlist"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleShare();
              }}
              className="inline-flex h-7 w-7 items-center justify-center bg-black/50 backdrop-blur-md text-zinc-400 transition-colors hover:bg-black/70 hover:text-white sm:h-8 sm:w-8 border border-white/10 rounded-lg"
              aria-label="Share car"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Link>

      {/* Content Area */}
      <div
        className={clsx(
          "flex flex-col flex-1",
          compact ? "p-2.5 sm:p-3 lg:p-4" : spacious ? "p-3.5 sm:p-5" : "p-3 sm:p-4"
        )}
      >
        {/* Title & Year */}
        <div
          className={clsx(
            "flex items-start gap-2",
            compact
              ? "mb-1.5 lg:gap-3 lg:mb-2.5"
              : spacious
                ? "gap-2.5 sm:gap-3 mb-2.5 sm:mb-3"
                : "gap-2 sm:gap-3 mb-2 sm:mb-3"
          )}
        >
          <span
            className={clsx(
              "meta-label shrink-0 mt-0.5",
              compact ? "text-[8px] lg:text-[10px] lg:mt-1" : "sm:mt-1 text-[9px] sm:text-[10px]"
            )}
          >
            {car.year}
          </span>
          <Link href={carListingPath(car)} onClick={() => onCarClick("title")}>
            <h3
              className={clsx(
                "font-bold font-sans text-white tracking-tight leading-snug hover:text-[var(--accent)] transition-colors line-clamp-2",
                compact
                  ? "text-[12px] sm:text-[14px] lg:text-[16px] lg:tracking-tighter"
                  : spacious
                    ? "text-[14px] sm:text-[17px] sm:tracking-tighter"
                    : "text-[13px] sm:text-[16px] sm:tracking-tighter"
              )}
              title={`${car.make} ${car.model} ${car.variant ? `(${car.variant})` : ""}`}
            >
              {titleHtml ? (
                <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
              ) : (
                <>{car.make} {car.model} {car.variant ? `(${car.variant})` : ""}</>
              )}
            </h3>
          </Link>
        </div>

        {/* Spec Chips */}
        <div className="flex-1">
          <div className={clsx(
            "flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-500",
            compact
              ? "text-[9px] lg:text-[10px]"
              : spacious
                ? "text-[10px] sm:text-[11px]"
                : "text-[10px] sm:text-[10px]"
          )}>
            {car.mileage != null && (
              <span className="inline-flex items-center gap-1">
                <Gauge size={compact ? 10 : spacious ? 12 : 11} className="shrink-0 text-zinc-600" />
                {formatMileage(car.mileage)}
              </span>
            )}
            {car.transmission && (
              <span className="inline-flex items-center gap-1">
                <Settings size={compact ? 10 : spacious ? 12 : 11} className="shrink-0 text-zinc-600" />
                {car.transmission}
              </span>
            )}
            {car.fuelType && (
              <span className="inline-flex items-center gap-1">
                <Fuel size={compact ? 10 : spacious ? 12 : 11} className="shrink-0 text-zinc-600" />
                {car.fuelType}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar: Price & Action */}
        <div
          className={clsx(
            "border-t border-white/[0.06] flex items-center justify-between gap-2",
            compact ? "mt-2 pt-2 lg:mt-4 lg:pt-3" : spacious ? "mt-3 sm:mt-5 pt-3 sm:pt-3.5" : "mt-3 sm:mt-5 pt-2.5 sm:pt-3"
          )}
        >
          <div className="flex items-center min-w-0">
            <div className="flex flex-col min-w-0">
              <span
                className={clsx(
                  "font-bold text-white tracking-tight truncate",
                  compact
                    ? "text-[13px] sm:text-[15px] lg:text-lg lg:tracking-tighter"
                    : spacious
                      ? "text-[15px] sm:text-xl sm:tracking-tighter"
                      : "text-[14px] sm:text-lg sm:tracking-tighter"
                )}
              >
                {formatCarPrice(car)}
              </span>
            </div>
          </div>

          <Link
            href={carListingPath(car)}
            onClick={() => onCarClick("cta")}
            className={clsx(
              "group/btn inline-flex items-center bg-[var(--accent)] text-black font-bold uppercase tracking-widest hover:bg-[var(--accent-hover)] active:scale-95 transition-all duration-200",
              compact
                ? "gap-1.5 px-2 py-1 text-[8px] sm:text-[9px] lg:gap-2 lg:px-3.5 lg:py-1.5 lg:text-[10px]"
                : "gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[9px] sm:text-[10px]"
            )}
            style={{ borderRadius: "8px" }}
          >
            View
            <div
              className={clsx(
                "flex items-center justify-center bg-black/15 group-hover/btn:bg-black/25 transition-colors",
                compact ? "w-4 h-4 lg:w-5 lg:h-5" : "w-4 h-4 sm:w-5 sm:h-5"
              )}
              style={{ borderRadius: "4px" }}
            >
              <ArrowUpRight
                    className={clsx(
                      compact ? "w-2.5 h-2.5 lg:w-3 lg:h-3" : "w-3 h-3"
                    )}
              />
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}
