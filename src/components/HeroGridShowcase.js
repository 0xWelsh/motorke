"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { carListingPath } from "@/lib/car-listing-url";
import { isActiveSpotlight } from "@/lib/spotlight";

export default function HeroGridShowcase({ cars = [] }) {
  const [carIndex, setCarIndex] = useState(0);

  useEffect(() => {
    if (!cars || cars.length < 2) return undefined;
    const timer = setInterval(() => {
      setCarIndex((prev) => (prev + 1) % cars.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [cars]);

  if (!cars || cars.length < 2) return null;

  const mainCar = cars[carIndex % cars.length];
  const secondaryCar = cars[(carIndex + 1) % cars.length];
  const mainVariant = [mainCar.model, mainCar.variant].filter(Boolean).join(", ");
  const secondaryVariant = [secondaryCar.model, secondaryCar.variant].filter(Boolean).join(", ");

  const mainSpotlightActive = isActiveSpotlight(mainCar);
  const secondarySpotlightActive = isActiveSpotlight(secondaryCar);

  function HotOrSpotBadge({ spotlightActive }) {
    if (spotlightActive) {
      return (
        <span className="bg-[#22c55e]/20 text-[#4ade80] text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-0.5 sm:py-1 uppercase tracking-widest self-start border border-[#22c55e]/30 mb-1 sm:mb-2">
          Spotlight
        </span>
      );
    }

    return (
      <span className="bg-[#ff5a2f]/20 text-[#ff5a2f] text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-0.5 sm:py-1 uppercase tracking-widest self-start border border-[#ff5a2f]/30 mb-1 sm:mb-2 flex items-center gap-1">
        <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        Hot Deal
      </span>
    );
  }

  return (
    <div className="relative w-full animate-in fade-in slide-in-from-right-8 duration-1000">
      {cars.length > 2 ? (
        <div className="absolute top-2 right-2 z-20 bg-black/50 text-white text-[9px] font-black tracking-[0.14em] px-2 py-1 uppercase border border-white/10">
          {carIndex + 1}/{cars.length}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
        <Link
          href={carListingPath(mainCar)}
          className="group relative flex overflow-hidden bg-black shadow-xl rounded-none min-h-[96px] sm:min-h-[112px] transition-all hover:ring-1 hover:ring-[#38A169]/50"
        >
          <div className="relative w-[44%] max-w-[200px] bg-black/30">
            <Image
              src={mainCar.images?.[0]?.url || "/images/placeholder.jpg"}
              alt={mainCar.model}
              fill
              className="object-cover opacity-85 transition-opacity duration-500 group-hover:opacity-100"
              sizes="(max-width: 768px) 44vw, 200px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />
          </div>

          <div className="flex flex-col justify-between flex-1 p-2.5 sm:p-3">
            <div className="flex items-start justify-between gap-3">
              <HotOrSpotBadge spotlightActive={mainSpotlightActive} />
              <span className="hidden sm:inline-flex w-8 h-8 rounded-full border border-white/20 items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-[#38A169] group-hover:border-[#38A169] transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.25em] text-white/60 mb-1">
                {mainCar.year}
              </p>
              <h4 className="text-[14px] sm:text-[16px] font-black text-white tracking-tight uppercase leading-[1.05] line-clamp-1 group-hover:text-[#38A169] transition-colors">
                {mainCar.make}
              </h4>
              <p className="text-[10px] sm:text-[11px] font-semibold text-white/75 tracking-[0.08em] uppercase leading-tight line-clamp-1">
                {mainVariant}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] text-white/40 font-black uppercase tracking-[0.2em]">
                  Asking Price
                </span>
                <span className="text-[12px] sm:text-[13px] font-black text-[#38A169] leading-tight">
                  KSh {(mainCar.price / 1000000).toFixed(2)}M
                </span>
              </div>
              <span className="sm:hidden w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-[#38A169] group-hover:border-[#38A169] transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
            </div>
          </div>
        </Link>

        <Link
          href={carListingPath(secondaryCar)}
          className="group relative flex overflow-hidden bg-[#111111] border border-zinc-900 shadow-lg rounded-none min-h-[96px] sm:min-h-[112px] transition-all hover:bg-zinc-800"
        >
          <div className="relative w-[44%] max-w-[200px] bg-[#111111]">
            <Image
              src={secondaryCar.images?.[0]?.url || "/images/placeholder.jpg"}
              alt={secondaryCar.model}
              fill
              className="object-cover opacity-55 transition-opacity duration-500 group-hover:opacity-75"
              sizes="(max-width: 768px) 44vw, 200px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
          </div>

          <div className="flex flex-col justify-between flex-1 p-2.5 sm:p-3">
            <div className="flex items-start justify-between gap-3">
              <HotOrSpotBadge spotlightActive={secondarySpotlightActive} />
              <span className="hidden sm:inline-flex w-8 h-8 rounded-full border border-white/20 items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-[#38A169] group-hover:border-[#38A169] transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase text-white/60 mb-1">
                {secondaryCar.year}
              </p>
              <h4 className="text-[14px] sm:text-[16px] font-black text-white tracking-tight leading-[1.05] uppercase line-clamp-1">
                {secondaryCar.make}
              </h4>
              <p className="text-[10px] sm:text-[11px] font-semibold text-white/75 tracking-[0.08em] uppercase leading-tight line-clamp-1">
                {secondaryVariant}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <p className="text-[12px] sm:text-[13px] font-black text-[#38A169] leading-tight">
                KSh {(secondaryCar.price / 1000000).toFixed(2)}M
              </p>
              <span className="sm:hidden w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-[#38A169] group-hover:border-[#38A169] transition-all duration-300">
                <ArrowRight className="w-4 h-4 text-white" />
              </span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
