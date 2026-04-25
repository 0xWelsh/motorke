"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, MapPin, ImageOff, Sparkles, ArrowUpRight } from "lucide-react";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import { FUEL_LABELS } from "@/lib/constants";
import { CompareButton } from "./CompareSelector";

/**
 * Universal premium CarCard matching the G99 reference design.
 * @param {Object} car - The car data object.
 * @param {number} distance - Pre-calculated distance in km (optional).
 * @param {function} onRemove - Optional callback for a remove action.
 */
export default function CarCard({ car, distance = null, onRemove = null }) {
  const primaryImg = car.images?.[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ( ${car.variant} )` : ""}`;
  
  const compareData = {
    ...car,
    image: primaryImg,
    model: `${car.make} ${car.model}`,
  };

  // Build the high-density spec string
  const specItems = [
    car.horsepower ? `${car.horsepower} HP` : null,
    car.torque ? `${car.torque} Nm` : null,
    car.engineCC ? `${(car.engineCC / 1000).toFixed(1)}L` : null,
    car.cylinders ? `V${car.cylinders}` : null,
    car.turbo ? "Twin Turbo" : null,
    car.transmission ? (car.transmission === "AUTOMATIC" ? "AT" : "MT") : null,
    car.drivetrain || null,
    car.fuelType ? (car.fuelType.charAt(0) + car.fuelType.slice(1).toLowerCase()) : null,
    // Add some common "flavor" specs if available
    car.sunroof ? "Panoramic glass roof" : null,
    car.description?.toLowerCase().includes("leather") ? "Leather interior" : null,
  ].filter(Boolean);

  const specString = specItems.join(" • ");  return (
    <article className="group flex flex-col bg-white dark:bg-[#0a0a0a] border-2 border-slate-100 dark:border-zinc-900 transition-all hover:shadow-2xl overflow-hidden" style={{ borderRadius: '4px' }}>
      {/* Image Container */}
      <Link href={`/cars/${car.id}`} className="relative aspect-[4/3] bg-slate-50 dark:bg-zinc-900 overflow-hidden block">
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
          <span className="bg-[#38A169] text-white text-[9px] font-black px-3 py-1.5 uppercase tracking-widest shadow-xl flex items-center gap-1.5" style={{ borderRadius: '2px' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {car.available ? "AVAILABLE" : "RESERVED"}
          </span>
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1">
        {/* Title & Year */}
        <div className="flex items-start gap-4 mb-4">
          <span className="mt-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">
            {car.year}
          </span>
          <Link href={`/cars/${car.id}`}>
            <h3 className="text-lg font-black font-playfair text-slate-900 dark:text-white tracking-tighter leading-snug hover:text-[#38A169] transition-colors uppercase truncate" title={`${car.make} ${car.model} ${car.variant ? `(${car.variant})` : ""}`}>
              {car.make} {car.model} {car.variant ? `(${car.variant})` : ""}
            </h3>
          </Link>
        </div>

        {/* High-Density Info Area */}
        <div className="flex-1 space-y-5">
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
             {specString && <span className="text-slate-900 dark:text-slate-200 font-bold block mb-1">{specString}</span>}
             {car.description || "Premium verified vehicle available in our showroom."}
          </p>

          {/* Secondary Badges Row */}
          <div className="flex flex-wrap gap-2">
            {[
              car.steering && (car.steering === "RHD" ? "RHD" : "LHD"),
              car.engineCC && `${car.engineCC} CC`,
              car.fuelType && (FUEL_LABELS[car.fuelType] || car.fuelType.toUpperCase()),
            ].filter(Boolean).map((badge, idx) => (
              <span key={idx} className="bg-slate-50 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-none border border-slate-100 dark:border-zinc-800">
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Price & Action */}
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
               USD {formatCarPrice(car).replace("KSh", "").trim()}
            </span>
            <div 
              className="w-4 h-4 rounded-full border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-[10px] text-slate-400 font-bold cursor-help"
              title={car.dutyPaid ? "Locally available. Price inclusive of registration and all duties." : "Direct import. Price includes shipping, tax, and clearing fees to Nairobi."}
            >
               i
            </div>
          </div>

          <Link 
            href={`/cars/${car.id}`} 
            className="group/btn flex items-center gap-4 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-[#111827] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
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
