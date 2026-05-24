"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Quote, ArrowRight, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { carListingPath } from "@/lib/car-listing-url";

export default function HeroGridShowcase({ cars = [], reviews = [] }) {
  const [carIndex, setCarIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (!cars || cars.length < 2) return;
    const timer = setInterval(() => {
      setCarIndex((prev) => (prev + 1) % cars.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [cars]);

  useEffect(() => {
    if (!reviews || reviews.length === 0) return;
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews]);

  if (!cars || cars.length < 2) return null;

  const mainCar = cars[carIndex % cars.length];
  const secondaryCar = cars[(carIndex + 1) % cars.length];
  const currentReview = reviews[reviewIndex];
  const mainVariant = [mainCar.model, mainCar.variant].filter(Boolean).join(", ");
  const secondaryVariant = [secondaryCar.model, secondaryCar.variant].filter(Boolean).join(", ");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full min-h-[400px] max-h-[540px] animate-in fade-in slide-in-from-right-8 duration-1000">
      <Link
        href={carListingPath(mainCar)}
        className="relative group overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)] ring-1 ring-white/10 flex flex-col transition-all duration-500 hover:ring-[#38A169]/40 hover:shadow-[0_28px_70px_-18px_rgba(56,161,105,0.25)]"
      >
        <div className="absolute inset-0 z-0 transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]">
          <Image
            src={mainCar.images?.[0]?.url || "/images/placeholder.jpg"}
            alt={mainCar.model}
            fill
            className="object-cover brightness-[0.92] contrast-[1.05] saturate-[1.08] group-hover:brightness-100 transition-[filter] duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#38A169]/10 via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-4 md:p-5">
          <div className="self-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md shadow-lg">
              <Flame className="w-3.5 h-3.5 fill-[#ff8a65] text-[#ff8a65]" />
              Featured
            </span>
          </div>

          <div className="mt-auto">
            <p className="text-[10px] font-semibold text-white/55 tracking-[0.28em] mb-1.5 uppercase">
              {mainCar.year}
            </p>
            <h4 className="text-[2rem] md:text-[2.35rem] font-bold text-white tracking-tight leading-[0.88] uppercase group-hover:text-[#6ee7a8] transition-colors line-clamp-1">
              {mainCar.make}
            </h4>
            <p className="mt-1 mb-4 text-[11px] md:text-xs font-medium tracking-[0.06em] uppercase text-white/70 line-clamp-1">
              {mainVariant}
            </p>
            <div className="h-px bg-white/12 w-full mb-4" />
            <h4 className="sr-only">
              {mainCar.year} {mainCar.make} {mainCar.model} {mainCar.variant || ""}
            </h4>

            <div className="flex items-end justify-between gap-3">
              <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
                <span className="text-[8px] text-white/45 font-bold uppercase tracking-[0.2em] block mb-0.5">
                  Asking price
                </span>
                <span className="text-xl font-bold text-[#6ee7a8]">
                  KSh {(mainCar.price / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-md group-hover:bg-[#38A169] group-hover:border-[#38A169] transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>

      <div className="grid grid-rows-2 gap-3">
        <Link
          href={carListingPath(secondaryCar)}
          className="relative group overflow-hidden rounded-2xl bg-[#0c0c0c] ring-1 ring-white/10 shadow-[0_16px_48px_-20px_rgba(0,0,0,0.65)] transition-all duration-500 hover:ring-white/20"
        >
          <div className="absolute inset-0 z-0">
            <Image
              src={secondaryCar.images?.[0]?.url || "/images/placeholder.jpg"}
              alt={secondaryCar.model}
              fill
              className="object-cover opacity-45 brightness-90 contrast-105 transition-all duration-700 group-hover:opacity-60 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/75 to-black/25" />
          </div>

          <div className="relative z-10 p-4 flex flex-col h-full">
            <span className="self-start rounded-full border border-[#ff8a65]/30 bg-[#ff8a65]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-[#ffb199] mb-2 backdrop-blur-sm">
              Hot deal
            </span>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/55 mb-1">
              {secondaryCar.year}
            </p>
            <h4 className="text-lg font-bold text-white tracking-tight leading-tight uppercase line-clamp-1 group-hover:text-[#6ee7a8] transition-colors">
              {secondaryCar.make}
            </h4>
            <p className="text-[10px] font-medium text-white/65 tracking-wide uppercase mb-1 line-clamp-1">
              {secondaryVariant}
            </p>
            <p className="text-base font-bold text-[#6ee7a8]">
              KSh {(secondaryCar.price / 1000000).toFixed(2)}M
            </p>

            <div className="mt-auto pt-2 flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors">
              <span className="text-[9px] font-black uppercase tracking-[0.22em]">View listing</span>
              <ArrowRight className="w-3 h-3 text-[#6ee7a8]" />
            </div>
          </div>
        </Link>

        <div className="relative rounded-2xl border border-white/10 bg-black/40 shadow-[0_16px_48px_-24px_rgba(0,0,0,0.6)] overflow-hidden p-4 md:p-5 flex flex-col backdrop-blur-md">
          <Quote className="absolute top-4 right-5 w-12 h-12 text-white/[0.04] pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={reviewIndex}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.45, ease: "circOut" }}
                className="h-full flex flex-col"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < (currentReview?.rating || 5)
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-slate-200 line-clamp-3 mb-3 leading-relaxed">
                  &ldquo;{currentReview?.comment || "Expert consultation and a very transparent buying process."}&rdquo;
                </p>
                <div className="mt-auto">
                  <p className="text-[9px] font-bold text-white uppercase tracking-[0.22em] mb-0.5">
                    {currentReview?.user?.name || "Verified buyer"}
                  </p>
                  <p className="text-[8px] font-bold text-[#6ee7a8] uppercase tracking-[0.14em]">
                    via {currentReview?.dealer?.name || "trusted dealer"}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute bottom-0 left-0 h-0.5 bg-white/5 w-full">
            <motion.div
              key={reviewIndex}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-[#38A169] origin-left shadow-[0_0_12px_rgba(56,161,105,0.6)]"
            />
          </div>
          {cars.length > 2 && (
            <div className="absolute top-4 right-4 z-20 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[9px] font-black tracking-wider text-white/80 uppercase backdrop-blur-sm">
              {carIndex + 1}/{cars.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
