"use client";
import React from "react";
import Link from "next/link";
import { MapPin, ImageOff, ArrowUpRight, Share2 } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { buildCarSpecSummaryItems, meaningfulFeatureList, positiveNum } from "@/lib/car-display";
import { CompareButton } from "./CompareSelector";
import FeatureMarquee from "./FeatureMarquee";
import { trackUiEvent } from "@/lib/analytics";
import { carListingPath } from "@/lib/car-listing-url";

/**
 * Universal premium CarCard matching the G99 reference design.
 * @param {Object} car - The car data object.
 * @param {number} distance - Pre-calculated distance in km (optional).
 * @param {function} onRemove - Optional callback for a remove action.
 */
export default function CarCard({ car, distance = null, onRemove = null }) {
  const primaryImg = car.images?.[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ( ${car.variant} )` : ""}`;
  const distanceKm = Number.isFinite(distance) ? distance : (Number.isFinite(car?.distance) ? car.distance : null);
  const distanceLabel =
    distanceKm == null
      ? null
      : distanceKm < 1
        ? `${Math.round(distanceKm * 1000)} m`
        : `${distanceKm.toFixed(1)} km`;
  
  const compareData = {
    ...car,
    image: primaryImg,
    model: `${car.make} ${car.model}`,
  };

  const specItems = buildCarSpecSummaryItems(car);
  const specString = specItems.join(", ");
  const featureChips = meaningfulFeatureList(car.features);
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
    const path = carListingPath(car);
    const shareUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    const shareText = `${titleText} - ${formatCarPrice(car)}. View photos and details: ${shareUrl}`;

    trackUiEvent("share_car_click", {
      ...eventPayload,
      placement: "card",
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: titleText,
        text: `${titleText} - ${formatCarPrice(car)}`,
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
    <article className="group flex flex-col bg-white dark:bg-[#0a0a0a] border-2 border-slate-100 dark:border-zinc-900 transition-all hover:shadow-2xl overflow-hidden" style={{ borderRadius: '4px' }}>
      {/* Image Container */}
      <Link href={carListingPath(car)} onClick={() => onCarClick("image")} className="relative aspect-[16/11] bg-slate-50 dark:bg-zinc-900 overflow-hidden block">
        {primaryImg ? (
          <SafeImage
            src={primaryImg}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            fallback={
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <ImageOff className="w-8 h-8" aria-hidden />
              </div>
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
             <ImageOff className="w-8 h-8" />
          </div>
        )}

        {/* Top overlays: single row avoids overlap on narrow (mobile) cards */}
        <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4 sm:gap-2">
          <div
            className={
              distanceLabel
                ? "min-w-0 max-w-[calc(100%-5.5rem)] sm:max-w-[calc(100%-7rem)]"
                : "min-w-0 flex-1"
            }
          >
            {distanceLabel ? (
              <span
                className="pointer-events-auto inline-flex max-w-full items-center gap-1 bg-white/95 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-900 dark:bg-[#111111]/95 dark:text-white sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[9px] sm:tracking-[0.12em] border border-slate-200/80 dark:border-zinc-700/80"
                style={{ borderRadius: "2px" }}
                title={`${distanceLabel} away`}
              >
                <MapPin className="h-2.5 w-2.5 shrink-0 text-[#38A169] sm:h-3 sm:w-3" aria-hidden />
                <span className="min-w-0 truncate tabular-nums">{distanceLabel}</span>
              </span>
            ) : null}
          </div>
          <div className="pointer-events-auto flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleShare();
              }}
              className="inline-flex h-6 w-6 items-center justify-center bg-white/95 text-slate-700 transition-colors hover:bg-white dark:bg-[#111111]/95 dark:text-slate-200 dark:hover:bg-[#151515] sm:h-8 sm:w-8 border border-slate-200/80 dark:border-zinc-700/80"
              style={{ borderRadius: "2px" }}
              aria-label="Share car"
            >
              <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
            <span
              className="bg-[#38A169] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-white border border-white/20 sm:px-2 sm:py-1 sm:text-[9px] sm:tracking-[0.12em]"
              style={{ borderRadius: "2px" }}
            >
              Available
            </span>
          </div>
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-2.5 sm:p-5 flex flex-col flex-1">
        {/* Title & Year */}
        <div className="flex items-start gap-2 sm:gap-3 mb-2.5 sm:mb-3">
          <span className="mt-0.5 sm:mt-1 text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {car.year}
          </span>
          <Link href={carListingPath(car)} onClick={() => onCarClick("title")}>
            <h3 className="text-[12px] sm:text-[17px] font-black font-sans text-slate-900 dark:text-white tracking-tight sm:tracking-tighter leading-snug hover:text-[#38A169] transition-colors line-clamp-2" title={`${car.make} ${car.model} ${car.variant ? `(${car.variant})` : ""}`}>
              {car.make} {car.model} {car.variant ? `(${car.variant})` : ""}
            </h3>
          </Link>
        </div>

        {/* High-Density Info Area */}
        <div className="flex-1 space-y-2.5 sm:space-y-4">
          <p className="min-h-[46px] sm:min-h-[56px] text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-3">
             {specString && <span className="text-slate-900 dark:text-slate-200 font-bold block mb-0.5 sm:mb-1">{specString}</span>}
             {car.description || "Premium verified vehicle available in our showroom."}
          </p>

          {/* Secondary Badges Row */}
          <div className="min-h-[30px] sm:min-h-[36px] flex flex-wrap gap-1.5 sm:gap-2 content-start">
            {[
              car.steering && (car.steering === "RHD" ? "RHD" : car.steering === "LHD" ? "LHD" : null),
              positiveNum(car.engineCC) ? `${Number(car.engineCC)} CC` : null,
              car.fuelType && (FUEL_LABELS[car.fuelType] || car.fuelType.toUpperCase()),
            ].filter(Boolean).map((badge, idx) => (
              <span key={idx} className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-1 sm:px-3 sm:py-1.5 rounded-none border border-slate-100 dark:border-zinc-800 whitespace-nowrap">
                {badge}
              </span>
            ))}
          </div>

          {/* Listing features as horizontal scroll chips (card width) */}
          {featureChips.length > 0 && (
            <div className="pt-1 -mx-1">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 mb-2">Features</p>
              <FeatureMarquee features={featureChips} variant="card" />
            </div>
          )}
        </div>

        {/* Bottom Bar: Price & Action */}
        <div className="mt-3.5 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between gap-2">
          <div className="flex items-center min-w-0">
            <span className="text-[13px] sm:text-lg font-black text-slate-900 dark:text-white tracking-tight sm:tracking-tighter truncate">
               {formatCarPrice(car)}
            </span>
          </div>

          <Link 
            href={carListingPath(car)} 
            onClick={() => onCarClick("cta")}
            className="group/btn inline-flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-[#111827] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            style={{ borderRadius: '2px' }}
          >
            View
            <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center bg-slate-200 dark:bg-zinc-800 group-hover/btn:bg-[#38A169] group-hover/btn:text-white transition-colors" style={{ borderRadius: '1px' }}>
              <ArrowUpRight className="w-3 h-3 translate-y-[0.5px]" />
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}
