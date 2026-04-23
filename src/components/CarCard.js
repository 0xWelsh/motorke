"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, MapPin, ImageOff } from "lucide-react";
import { formatCarPrice, formatMileage } from "@/lib/utils";
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
    <article className="group flex flex-col h-full bg-white dark:bg-[#0a0a0a] border border-black dark:border-white transition-all hover:shadow-2xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
      {/* Image Container */}
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/9] bg-slate-50 dark:bg-zinc-900 overflow-hidden block border-b border-black dark:border-white">
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

        {/* Badge: top right */}
        <div className="absolute top-4 right-4">
          <span className="bg-[#38A169] text-white text-[9px] font-black px-2.5 py-1.5 uppercase tracking-widest shadow-xl" style={{ borderRadius: '2px' }}>
            {car.available ? "AVAILABLE" : "RESERVED"}
          </span>
        </div>

        {/* Remove Button: top left (optional) */}
        {onRemove && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(car.id);
            }}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md flex items-center justify-center text-[#111827] dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-xl z-10"
          >
            <span className="text-sm font-bold">×</span>
          </button>
        )}

        {/* Distance: bottom right (if available) */}
        {distance !== null && (
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 flex items-center gap-1.5" style={{ borderRadius: '2px' }}>
            <MapPin className="w-3 h-3" /> {distance.toFixed(1)} km
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-6 flex flex-col flex-1">
        {/* Header Row: Year + Title */}
        <div className="flex items-center gap-3 mb-5">
          <span className="bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-[2px] uppercase">
            {car.year}
          </span>
          <Link href={`/cars/${car.id}`}>
            <h3 className="text-[15px] font-extrabold text-[#111827] dark:text-white tracking-tight hover:text-[#38A169] transition-colors line-clamp-1">
              {car.make} {car.model} {car.variant ? `( ${car.variant} )` : ""}
            </h3>
          </Link>
        </div>

        {/* High-Density Tech Specs + Snippet */}
        <div className="flex-1">
          <p className="text-[12px] font-medium text-[#4A5568] dark:text-slate-400 leading-[1.6] mb-6 line-clamp-3">
            {specString && <span className="text-slate-900 dark:text-slate-200 font-bold">{specString}</span>}
            {specString && " • "}
            {car.description || "Premium verified vehicle available in our showroom."}
          </p>
        </div>

        {/* Bottom Badges Row: Steering, CC, Fuel, Mileage */}
        <div className="flex flex-wrap gap-2 mb-8">
           {[
             car.steering && (car.steering === "RHD" ? "RHD" : "LHD"),
             car.engineCC && `${car.engineCC} CC`,
             car.fuelType && (FUEL_LABELS[car.fuelType] || car.fuelType.toUpperCase()),
             car.mileage && `${Math.round(car.mileage).toLocaleString()} KM`
           ].filter(Boolean).map((badge, idx) => (
              <span key={idx} className="bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-[2px] border border-slate-100 dark:border-zinc-800">
                {badge}
              </span>
           ))}
        </div>

        {/* Footer Row: Price + Action Button */}
        <div className="pt-5 border-t border-slate-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-extrabold text-[#111827] dark:text-white uppercase tracking-tight">
               {car.currency || "KSh"} {formatCarPrice(car).replace("KSh", "").trim()}
            </span>
            <div className="w-4 h-4 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold italic">
               i
            </div>
          </div>

          <Link 
            href={`/cars/${car.id}`} 
            className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-slate-800 text-[#111827] dark:text-white px-5 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white dark:hover:bg-zinc-800 transition-all shadow-sm"
            style={{ borderRadius: '2px' }}
          >
            View Offer
          </Link>
        </div>
      </div>
    </article>
  );
}
