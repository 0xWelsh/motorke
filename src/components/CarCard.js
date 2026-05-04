"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, MapPin, ImageOff, Sparkles, ArrowUpRight } from "lucide-react";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { buildCarSpecSummaryItems, meaningfulFeatureList, positiveNum } from "@/lib/car-display";
import { CompareButton } from "./CompareSelector";
import FeatureMarquee from "./FeatureMarquee";

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
  const specString = specItems.join(" • ");
  const featureChips = meaningfulFeatureList(car.features);

  return (
    <article className="group flex flex-col bg-white dark:bg-[#0a0a0a] border-2 border-slate-100 dark:border-zinc-900 transition-all hover:shadow-2xl overflow-hidden" style={{ borderRadius: '4px' }}>
      {/* Image Container */}
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/11] bg-slate-50 dark:bg-zinc-900 overflow-hidden block">
        {primaryImg ? (
          <Image
            src={primaryImg}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
             <ImageOff className="w-8 h-8" />
          </div>
        )}

        {/* Status Badge: Top Right */}
        <div className="absolute top-4 right-4">
          <span
            className="bg-[#38A169] text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-[0.12em] border border-white/20"
            style={{ borderRadius: "2px" }}
          >
            Available
          </span>
        </div>

        {/* Distance Badge: Top Left */}
        {distanceLabel && (
          <div className="absolute top-4 left-4">
            <span
              className="inline-flex items-center gap-1.5 bg-white/95 dark:bg-[#111111]/95 text-slate-900 dark:text-white text-[9px] font-bold px-2.5 py-1 border border-slate-200/80 dark:border-zinc-700/80"
              style={{ borderRadius: "2px" }}
            >
              <MapPin className="w-3 h-3 text-[#38A169]" />
              {distanceLabel}
            </span>
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Title & Year */}
        <div className="flex items-start gap-3 mb-3">
          <span className="mt-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {car.year}
          </span>
          <Link href={`/cars/${car.id}`}>
            <h3 className="text-base sm:text-[17px] font-black font-sans text-slate-900 dark:text-white tracking-tighter leading-snug hover:text-[#38A169] transition-colors truncate" title={`${car.make} ${car.model} ${car.variant ? `(${car.variant})` : ""}`}>
              {car.make} {car.model} {car.variant ? `(${car.variant})` : ""}
            </h3>
          </Link>
        </div>

        {/* High-Density Info Area */}
        <div className="flex-1 space-y-4">
          <p className="min-h-[56px] text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
             {specString && <span className="text-slate-900 dark:text-slate-200 font-bold block mb-1">{specString}</span>}
             {car.description || "Premium verified vehicle available in our showroom."}
          </p>

          {/* Secondary Badges Row */}
          <div className="min-h-[36px] flex flex-wrap gap-2 content-start">
            {[
              car.steering && (car.steering === "RHD" ? "RHD" : car.steering === "LHD" ? "LHD" : null),
              positiveNum(car.engineCC) ? `${Number(car.engineCC)} CC` : null,
              car.fuelType && (FUEL_LABELS[car.fuelType] || car.fuelType.toUpperCase()),
            ].filter(Boolean).map((badge, idx) => (
              <span key={idx} className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-none border border-slate-100 dark:border-zinc-800 whitespace-nowrap">
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
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tighter">
               {formatCarPrice(car)}
            </span>
            <div 
              className="w-4 h-4 rounded-full border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-[10px] text-slate-400 font-bold cursor-help"
              title="Final listed price"
            >
               i
            </div>
          </div>

          <Link 
            href={`/cars/${car.id}`} 
            className="group/btn flex items-center gap-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#111827] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            style={{ borderRadius: '2px' }}
          >
            View Offer
            <div className="w-5 h-5 flex items-center justify-center bg-slate-200 dark:bg-zinc-800 group-hover/btn:bg-[#38A169] group-hover/btn:text-white transition-colors" style={{ borderRadius: '1px' }}>
              <ArrowUpRight className="w-3 h-3 translate-y-[0.5px]" />
            </div>
          </Link>
        </div>
      </div>
    </article>
  );
}
