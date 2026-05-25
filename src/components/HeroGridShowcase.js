"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Quote, ArrowRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { carListingPath } from "@/lib/car-listing-url";

export default function HeroGridShowcase({ cars = [], reviews = [], className = "" }) {
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
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-2 w-full h-full min-h-[340px] sm:min-h-[400px] lg:min-h-[520px] lg:max-h-none animate-in fade-in slide-in-from-right-8 duration-1000 ${className}`}
    >
      
      {/* Primary Hot Deal - Large Vertical Card with Full Frame Image */}
      <Link 
        href={carListingPath(mainCar)}
        className="relative group overflow-hidden bg-black shadow-xl rounded-none flex flex-col transition-all hover:ring-1 hover:ring-[#38A169]/50"
      >
        <div className="absolute inset-0 z-0 transition-transform duration-1000 group-hover:scale-110">
          <Image 
            src={mainCar.images?.[0]?.url || "/images/placeholder.jpg"} 
            alt={mainCar.model} 
            fill 
            className="object-cover"
          />
          {/* Darker gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-4 md:p-5">
          <div className="self-start">
            <span className="bg-[#ff5a2f] text-white text-[9px] font-black px-3 py-1.5 uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl">
              <Flame className="w-3.5 h-3.5 fill-white" />
              Hot Deal
            </span>
          </div>
          
          <div className="mt-auto">
             <p className="text-[10px] font-sans font-semibold text-white/60 tracking-[0.3em] mb-1.5">
               {mainCar.year}
             </p>
             <h4 className="text-[2.05rem] md:text-[2.35rem] font-sans font-black text-white tracking-tight leading-[0.82] uppercase group-hover:text-[#38A169] transition-colors line-clamp-1">
               {mainCar.make}
             </h4>
             <p className="mt-1 mb-4 text-[11px] md:text-[12px] font-semibold tracking-[0.08em] uppercase text-white/75 line-clamp-1">
               {mainVariant}
             </p>
             <div className="h-px bg-white/10 w-full mb-4" />
             <h4 className="sr-only">
               {mainCar.year} {mainCar.make} {mainCar.model} {mainCar.variant || ""}
             </h4>
             
             <div className="flex items-center justify-between">
               <div className="flex flex-col">
                 <span className="text-[8px] text-white/40 font-black uppercase tracking-[0.2em] mb-0.5">Asking Price</span>
                 <span className="text-xl font-black text-[#38A169]">KSh {(mainCar.price/1000000).toFixed(2)}M</span>
               </div>
               <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm group-hover:bg-[#38A169] group-hover:border-[#38A169] transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-white" />
               </div>
             </div>
          </div>
        </div>
      </Link>

      {/* Right Column - Two Square-ish Cards */}
      <div className="grid grid-rows-2 gap-2">
        
        {/* Secondary Hot Deal */}
        <Link 
          href={carListingPath(secondaryCar)}
          className="relative group overflow-hidden bg-[#111111] border border-zinc-900 shadow-lg rounded-none transition-all hover:bg-zinc-800"
        >
          <div className="absolute inset-0 z-0">
            <Image 
              src={secondaryCar.images?.[0]?.url || "/images/placeholder.jpg"} 
              alt={secondaryCar.model} 
              fill 
              className="object-cover transition-transform duration-1000 group-hover:scale-105 opacity-30 group-hover:opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/80 to-transparent" />
          </div>
          
          <div className="relative z-10 p-4 flex flex-col h-full">
            <span className="bg-[#ff5a2f]/20 text-[#ff5a2f] text-[8px] font-black px-3 py-1 uppercase tracking-widest self-start border border-[#ff5a2f]/30 mb-2">
              Hot Deal
            </span>
            <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/60 mb-1">{secondaryCar.year}</p>
            <h4 className="text-[1.15rem] font-sans font-black text-white tracking-tight leading-[1] mb-1 uppercase line-clamp-1">{secondaryCar.make}</h4>
            <p className="text-[10px] font-semibold text-white/75 tracking-[0.08em] uppercase mb-1.5 line-clamp-1">{secondaryVariant}</p>
            <p className="text-base font-black text-[#38A169]">KSh {(secondaryCar.price/1000000).toFixed(2)}M</p>
            
            <div className="mt-auto pt-1 flex items-center gap-2 text-slate-400 group-hover:text-white transition-colors duration-300">
              <span className="text-[9px] font-black uppercase tracking-[0.25em]">View Unit</span>
              <ArrowRight className="w-3 h-3 text-[#38A169]" />
            </div>
          </div>
        </Link>

        {/* Reviews Slideshow */}
        <div className="relative bg-[#111111] border border-zinc-900 shadow-lg rounded-none overflow-hidden p-4 md:p-5 flex flex-col">
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
                    <Star key={i} className={`w-3.5 h-3.5 ${i < (currentReview?.rating || 5) ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-800'}`} />
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-200 line-clamp-2 mb-3 leading-relaxed">
                  &ldquo;{currentReview?.comment || "Expert consultation and a very transparent buying process."}&rdquo;
                </p>
                <div className="mt-auto">
                  <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] mb-0.5">{currentReview?.user?.name || "Verified Client"}</p>
                  <p className="text-[8px] font-black text-[#38A169] uppercase tracking-[0.15em]">Purchased from {currentReview?.dealer?.name || "Premium Dealer"}</p>
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
