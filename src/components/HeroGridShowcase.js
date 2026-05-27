"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Quote, ArrowRight, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { carListingPath } from "@/lib/car-listing-url";
import { isActiveSpotlight } from "@/lib/spotlight";

function HotOrSpotBadge({ spotlightActive, className = "" }) {
  if (spotlightActive) {
    return (
      <span
        className={`bg-[#22c55e]/20 text-[#4ade80] text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-0.5 sm:py-1 uppercase tracking-widest self-start border border-[#22c55e]/30 mb-1 sm:mb-2 ${className}`}
      >
        Spotlight
      </span>
    );
  }

  return (
    <span
      className={`bg-[#ff5a2f]/20 text-[#ff5a2f] text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-0.5 sm:py-1 uppercase tracking-widest self-start border border-[#ff5a2f]/30 mb-1 sm:mb-2 flex items-center gap-1 ${className}`}
    >
      <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      Hot Deal
    </span>
  );
}

function HeroGridShowcaseMobile({ cars, carIndex }) {
  const mainCar = cars[carIndex % cars.length];
  const secondaryCar = cars[(carIndex + 1) % cars.length];
  const mainVariant = [mainCar.model, mainCar.variant].filter(Boolean).join(", ");
  const secondaryVariant = [secondaryCar.model, secondaryCar.variant].filter(Boolean).join(", ");
  const mainSpotlightActive = isActiveSpotlight(mainCar);
  const secondarySpotlightActive = isActiveSpotlight(secondaryCar);

  return (
    <div className="relative w-full animate-in fade-in slide-in-from-right-8 duration-1000 lg:hidden">
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

function HeroGridShowcaseDesktop({ cars, reviews, carIndex, reviewIndex }) {
  const mainCar = cars[carIndex % cars.length];
  const secondaryCar = cars[(carIndex + 1) % cars.length];
  const currentReview = reviews[reviewIndex];
  const mainVariant = [mainCar.model, mainCar.variant].filter(Boolean).join(", ");
  const secondaryVariant = [secondaryCar.model, secondaryCar.variant].filter(Boolean).join(", ");

  return (
    <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-1.5 sm:gap-2 w-full min-h-[220px] max-h-[280px] sm:min-h-[300px] sm:max-h-[380px] md:min-h-[380px] md:max-h-[520px] animate-in fade-in slide-in-from-right-8 duration-1000">
      <Link
        href={carListingPath(mainCar)}
        className="relative group overflow-hidden bg-black shadow-xl rounded-none flex flex-col min-h-[200px] sm:min-h-[280px] md:min-h-0 transition-all hover:ring-1 hover:ring-[#38A169]/50"
      >
        <div className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-110">
          <Image
            src={mainCar.images?.[0]?.url || "/images/placeholder.jpg"}
            alt={mainCar.model}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent md:from-black md:via-black/40 md:to-transparent md:opacity-90" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-3 sm:p-4 md:p-5">
          <div className="self-start">
            <span className="bg-[#ff5a2f] text-white text-[8px] sm:text-[9px] font-black px-2.5 sm:px-3 py-1 sm:py-1.5 uppercase tracking-[0.18em] sm:tracking-[0.2em] flex items-center gap-1.5 sm:gap-2 shadow-2xl">
              <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
              Hot Deal
            </span>
          </div>

          <div className="mt-auto">
            <p className="text-[9px] sm:text-[10px] font-sans font-semibold text-white/60 tracking-[0.25em] sm:tracking-[0.3em] mb-1">
              {mainCar.year}
            </p>
            <h4 className="text-[1.45rem] sm:text-[1.75rem] md:text-[2.35rem] font-sans font-black text-white tracking-tight leading-[0.88] uppercase group-hover:text-[#38A169] transition-colors line-clamp-1">
              {mainCar.make}
            </h4>
            <p className="mt-0.5 sm:mt-1 mb-2 sm:mb-4 text-[10px] sm:text-[11px] md:text-[12px] font-semibold tracking-[0.08em] uppercase text-white/75 line-clamp-1">
              {mainVariant}
            </p>
            <div className="hidden sm:block h-px bg-white/10 w-full mb-4" />
            <h4 className="sr-only">
              {mainCar.year} {mainCar.make} {mainCar.model} {mainCar.variant || ""}
            </h4>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] text-white/40 font-black uppercase tracking-[0.2em] mb-0.5">
                  Asking Price
                </span>
                <span className="text-base sm:text-lg md:text-xl font-black text-[#38A169]">
                  KSh {(mainCar.price / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-[#38A169] group-hover:border-[#38A169] transition-all duration-300">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="grid grid-rows-2 gap-1.5 sm:gap-2 min-h-[200px] sm:min-h-0">
        <Link
          href={carListingPath(secondaryCar)}
          className="relative group overflow-hidden bg-[#111111] border border-zinc-900 shadow-lg rounded-none transition-all hover:bg-zinc-800 min-h-[96px] sm:min-h-0"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src={secondaryCar.images?.[0]?.url || "/images/placeholder.jpg"}
              alt={secondaryCar.model}
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-45 sm:opacity-30 group-hover:opacity-55 sm:group-hover:opacity-50"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/35 to-transparent md:from-black md:via-black/80 md:to-transparent" />
          </div>

          <div className="relative z-10 p-2.5 sm:p-4 flex flex-col h-full">
            <span className="bg-[#ff5a2f]/20 text-[#ff5a2f] text-[7px] sm:text-[8px] font-black px-2 sm:px-3 py-0.5 sm:py-1 uppercase tracking-widest self-start border border-[#ff5a2f]/30 mb-1 sm:mb-2">
              Hot Deal
            </span>
            <p className="text-[8px] sm:text-[9px] font-semibold tracking-[0.2em] uppercase text-white/60 mb-0.5 sm:mb-1">
              {secondaryCar.year}
            </p>
            <h4 className="text-[0.95rem] sm:text-[1.15rem] font-sans font-black text-white tracking-tight leading-[1] mb-0.5 sm:mb-1 uppercase line-clamp-1">
              {secondaryCar.make}
            </h4>
            <p className="text-[9px] sm:text-[10px] font-semibold text-white/75 tracking-[0.08em] uppercase mb-1 sm:mb-1.5 line-clamp-1">
              {secondaryVariant}
            </p>
            <p className="text-sm sm:text-base font-black text-[#38A169]">
              KSh {(secondaryCar.price / 1000000).toFixed(2)}M
            </p>

            <div className="mt-auto pt-1 flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors duration-300">
              <span className="text-[9px] font-black uppercase tracking-[0.25em]">View Unit</span>
              <ArrowRight className="w-3 h-3 text-[#38A169]" />
            </div>
          </div>
        </Link>

        <div className="relative bg-[#111111] border border-zinc-900 shadow-lg rounded-none overflow-hidden p-2.5 sm:p-4 md:p-5 flex flex-col min-h-[96px] sm:min-h-0">
          <Quote className="absolute top-4 right-5 w-12 h-12 text-white/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={reviewIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="h-full flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < (currentReview?.rating || 5) ? "fill-yellow-500 text-yellow-500" : "text-zinc-800"}`}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-200 line-clamp-2 mb-3 leading-relaxed">
                  &ldquo;{currentReview?.comment || "Expert consultation and a very transparent buying process."}&rdquo;
                </p>
                <div className="mt-auto">
                  <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-0.5">
                    {currentReview?.user?.name || "Verified Client"}
                  </p>
                  <p className="text-[8px] font-black text-[#38A169] uppercase tracking-[0.15em]">
                    Purchased from {currentReview?.dealer?.name || "Premium Dealer"}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-0 left-0 h-1.5 bg-[#38A169]/10 w-full">
            <motion.div
              key={reviewIndex}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-[#38A169] w-full shadow-[0_0_15px_#38A169]"
            />
          </div>
          {cars.length > 2 && (
            <div className="absolute top-4 right-4 z-20 bg-black/35 text-white text-[9px] font-black tracking-[0.14em] px-2 py-1 uppercase border border-white/10">
              {carIndex + 1}/{cars.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HeroGridShowcase({ cars = [], reviews = [] }) {
  const [carIndex, setCarIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (!cars || cars.length < 2) return undefined;
    const timer = setInterval(() => {
      setCarIndex((prev) => (prev + 1) % cars.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [cars]);

  useEffect(() => {
    if (!reviews || reviews.length === 0) return undefined;
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews]);

  if (!cars || cars.length < 2) return null;

  return (
    <>
      <HeroGridShowcaseMobile cars={cars} carIndex={carIndex} />
      <HeroGridShowcaseDesktop cars={cars} reviews={reviews} carIndex={carIndex} reviewIndex={reviewIndex} />
    </>
  );
}
