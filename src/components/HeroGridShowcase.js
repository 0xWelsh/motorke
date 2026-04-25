"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Quote, ArrowRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroGridShowcase({ cars = [], reviews = [] }) {
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (reviews.length === 0) return;
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews]);

  if (!cars || cars.length < 2) return null;

  const mainCar = cars[0];
  const secondaryCar = cars[1];
  const currentReview = reviews[reviewIndex];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full min-h-[450px] animate-in fade-in slide-in-from-right-8 duration-1000">
      {/* Primary Hot Deal - Large Vertical Card */}
      <div className="relative group overflow-hidden bg-white dark:bg-[#111111] border border-slate-100 dark:border-slate-800 shadow-xl rounded-[40px] flex flex-col transition-all hover:shadow-2xl">
        <div className="relative flex-1 min-h-[240px] overflow-hidden">
          <Image 
            src={mainCar.images?.[0]?.url || "/images/placeholder.jpg"} 
            alt={mainCar.model} 
            fill 
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-6 left-6 z-10">
            <span className="bg-red-600 text-white text-[10px] font-black px-4 py-2 uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg rounded-full">
              <Flame className="w-4 h-4" />
              Hot Deal
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
        </div>
        <div className="p-8">
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            {mainCar.year} {mainCar.make}
          </p>
          <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-6 line-clamp-1 italic tracking-tighter">{mainCar.model}</h4>
          <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mb-1">Asking Price</span>
              <span className="text-2xl font-black text-[#38A169]">KSh {(mainCar.price/1000000).toFixed(2)}M</span>
            </div>
            <Link href={`/cars/${mainCar.id}`} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white p-4 rounded-[20px] hover:scale-105 transition-all active:scale-95 shadow-md">
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column - Two Square-ish Cards */}
      <div className="grid grid-rows-2 gap-4">
        {/* Secondary Hot Deal */}
        <div className="relative group overflow-hidden bg-white dark:bg-[#111111] border border-slate-100 dark:border-slate-800 shadow-lg rounded-[40px] transition-all hover:shadow-xl">
          <div className="absolute inset-0 z-0">
            <Image 
              src={secondaryCar.images?.[0]?.url || "/images/placeholder.jpg"} 
              alt={secondaryCar.model} 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 dark:opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#111111] via-white/80 dark:via-[#111111]/80 to-transparent" />
          </div>
          <div className="relative z-10 p-8 flex flex-col h-full">
            <span className="bg-[#38A169]/10 text-[#38A169] text-[9px] font-black px-3 py-1 uppercase tracking-widest self-start rounded-full border border-[#38A169]/20 mb-3">
              Hot Deal
            </span>
            <h4 className="text-xl font-black text-slate-900 dark:text-white line-clamp-1 tracking-tight">{secondaryCar.year} {secondaryCar.model}</h4>
            <p className="text-lg font-black text-[#38A169] mt-2">KSh {(secondaryCar.price/1000000).toFixed(2)}M</p>
            <Link href={`/cars/${secondaryCar.id}`} className="mt-auto text-slate-900 dark:text-white text-[11px] font-black uppercase tracking-[0.25em] flex items-center gap-2 hover:opacity-70 transition-opacity">
              View Unit <ArrowRight className="w-4 h-4 text-[#38A169]" />
            </Link>
          </div>
        </div>

        {/* Reviews Slideshow */}
        <div className="relative bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-slate-800 shadow-lg rounded-[40px] overflow-hidden p-8">
          <Quote className="absolute top-6 right-8 w-16 h-16 text-slate-200/50 dark:text-white/5 pointer-events-none" />
          <AnimatePresence mode="wait">
            <motion.div
              key={reviewIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full flex flex-col"
            >
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (currentReview?.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 line-clamp-3 italic mb-6 leading-relaxed">
                &ldquo;{currentReview?.comment || "Excellent service, the deal was very straightforward."}&rdquo;
              </p>
              <div className="mt-auto">
                <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">{currentReview?.user?.name || "Verified Client"}</p>
                <p className="text-[10px] font-bold text-[#38A169] uppercase tracking-[0.2em] mt-1">Purchased from {currentReview?.dealer?.name || "Premium Dealer"}</p>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Slideshow Progress Bar */}
          <div className="absolute bottom-0 left-0 h-1.5 bg-slate-100 dark:bg-white/5 w-full overflow-hidden">
             <motion.div 
               key={reviewIndex}
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 5, ease: "linear" }}
               className="h-full bg-[#38A169] w-full"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
