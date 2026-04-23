"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, MapPin } from "lucide-react";
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

  const specString = specItems.join(" • ");

  return (
    <article className="group flex flex-col h-full bg-white dark:bg-[#0f0f0f] border border-black dark:border-white transition-all hover:shadow-2xl overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
      {/* Image Container */}
      <Link href={`/cars/${car.id}`} className="relative aspect-[16/9] bg-slate-50 dark:bg-[#111111] overflow-hidden block border-b border-black dark:border-white">
        {primaryImg ? (
          <Image
            src={primaryImg}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            No Image Available
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
            <MapPin className="w-3 h-3 text-[#38A169]" />
            {distance}km away
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="flex flex-col flex-1 p-6">
        {/* Title Row */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#F7FAFC] dark:bg-slate-800 text-[#718096] dark:text-slate-400 text-[10px] font-black px-2 py-1 tracking-tighter" style={{ borderRadius: '2px' }}>
            {car.year}
          </span>
          <Link href={`/cars/${car.id}`}>
            <h3 className="text-xl font-bold text-[#111827] dark:text-white tracking-tight group-hover:text-[#38A169] transition-colors line-clamp-1">
              {title}
            </h3>
          </Link>
        </div>

        {/* High-Density Specs Block */}
        <div className="mb-6 h-[72px]"> {/* Fixed height for alignment */}
          <p className="text-[12px] text-[#4A5568] dark:text-slate-400 font-medium leading-relaxed line-clamp-3">
            {specString} {car.description ? ` ${car.description.split('.')[0]}.` : ""}
          </p>
        </div>

        {/* Action Badges Row */}
        <div className="flex flex-wrap gap-2 mb-8">
           <span className="bg-[#F7FAFC] dark:bg-slate-800/50 text-[#718096] dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1.5" style={{ borderRadius: '4px' }}>
              {car.steering || "RHD"}
           </span>
           <span className="bg-[#F7FAFC] dark:bg-slate-800/50 text-[#718096] dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1.5" style={{ borderRadius: '4px' }}>
              {car.engineCC ? `${car.engineCC} CC` : "N/A"}
           </span>
           <span className="bg-[#F7FAFC] dark:bg-slate-800/50 text-[#718096] dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1.5" style={{ borderRadius: '4px' }}>
              {car.fuelType || "PETROL"}
           </span>
           {car.mileage && (
              <span className="bg-[#F7FAFC] dark:bg-slate-800/50 text-[#718096] dark:text-slate-500 text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1.5" style={{ borderRadius: '4px' }}>
                {Math.round(car.mileage).toLocaleString()} KM
              </span>
           )}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-[#111827] dark:text-white">
                {formatCarPrice(car)}
              </p>
              <Info className="w-4 h-4 text-[#CBD5E0] dark:text-slate-600 cursor-help" />
           </div>

           <div className="flex items-center gap-3">
              <CompareButton car={compareData} className="!h-9 !px-3 bg-transparent border-none text-slate-300 hover:text-[#38A169] transition-colors" />
              <Link 
                href={`/cars/${car.id}`} 
                className="bg-[#F7FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 text-[#111827] dark:text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
                style={{ borderRadius: 'var(--radius)' }}
              >
                View Offer
              </Link>
           </div>
        </div>
      </div>
    </article>
  );
}
