"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Quote, ArrowRight, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HeroGridShowcase({ cars = [], reviews = [] }) {
  const [reviewIndex, setReviewIndex] = useState(0);

  useEffect(() => {
    if (!reviews || reviews.length === 0) return;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full h-full min-h-[450px] animate-in fade-in slide-in-from-right-8 duration-1000">
      
      {/* Primary Hot Deal - Large Vertical Card */}
      <Link 
        href={`/cars/${mainCar.id}`}
        className="relative group overflow-hidden bg-[#0a0a0a] border border-zinc-800 shadow-xl rounded-none flex flex-col transition-all hover:border-[#38A169]/50"
      >
        <div className="relative flex-1 min-h-[300px] overflow-hidden">
          <Image 
            src={mainCar.images?.[0]?.url || "/images/placeholder.jpg"} 
            alt={mainCar.model} 
            fill 
            className="object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute top-6 left-6 z-10">
            <span className="bg-[#ff5a2f] text-white text-[10px] font-black px-4 py-2 uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl">
              <Flame className="w-4 h-4 fill-white" />
              Hot Deal
            </span>
          </div>
          
          {/* Detailed Overlay as per mock-up */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-8 bg-black/90 backdrop-blur-sm border-t border-white/10 transition-transform duration-500 group-hover:bg-slate-900">
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">
               {mainCar.year} {mainCar.make}
             </p>
             <h4 className="text-4xl font-black text-white mb-6 italic tracking-tighter leading-none group-hover:text-[#38A169] transition-colors">
               {mainCar.model.split(' ')[0]}...
             </h4>
             <div className="flex items-center justify-between pt-6 border-t border-white/10">
               <div className="flex flex-col">
                 <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Asking Price</span>
                 <span className="text-3xl font-black text-[#38A169]">KSh {(mainCar.price/1000000).toFixed(2)}M</span>
               </div>
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <ArrowRight className="w-6 h-6 text-black" />
               </div>
             </div>
          </div>
        </div>
      </Link>

      {/* Right Column - Two Square-ish Cards */}
      <div className="grid grid-rows-2 gap-2">
        
        {/* Secondary Hot Deal */}
        <Link 
          href={`/cars/${secondaryCar.id}`}
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
          
          <div className="relative z-10 p-8 flex flex-col h-full">
            <span className="bg-[#38A169]/20 text-[#38A169] text-[9px] font-black px-3 py-1 uppercase tracking-widest self-start border border-[#38A169]/30 mb-3">
              Hot Deal
            </span>
            <h4 className="text-2xl font-black text-white tracking-tighter mb-2 italic">{secondaryCar.year} {secondaryCar.model}</h4>
            <p className="text-xl font-black text-[#38A169]">KSh {(secondaryCar.price/1000000).toFixed(2)}M</p>
            
            <div className="mt-auto pt-4 flex items-center gap-3 text-slate-400 group-hover:text-white transition-colors duration-300">
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">View Unit</span>
              <ArrowRight className="w-4 h-4 text-[#38A169]" />
            </div>
          </div>
        </Link>

        {/* Reviews Slideshow */}
        <div className="relative bg-[#111111] border border-zinc-900 shadow-lg rounded-none overflow-hidden p-8 flex flex-col">
          <Quote className="absolute top-6 right-8 w-20 h-20 text-white/5 pointer-events-none" />
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
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < (currentReview?.rating || 5) ? 'fill-yellow-500 text-yellow-500' : 'text-zinc-800'}`} />
                  ))}
                </div>
                <p className="text-base font-bold text-slate-200 line-clamp-3 italic mb-8 leading-relaxed">
                  &ldquo;{currentReview?.comment || "Expert consultation and a very transparent buying process."}&rdquo;
                </p>
                <div className="mt-auto">
                  <p className="text-[12px] font-black text-white uppercase tracking-[0.4em] mb-1">{currentReview?.user?.name || "Verified Client"}</p>
                  <p className="text-[10px] font-black text-[#38A169] uppercase tracking-[0.2em]">Purchased from {currentReview?.dealer?.name || "Premium Dealer"}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Sub-line indicator at the bottom as per mock-up */}
          <div className="absolute bottom-0 left-0 h-1.5 bg-[#38A169]/10 w-full">
             <motion.div 
               key={reviewIndex}
               initial={{ x: "-100%" }}
               animate={{ x: "0%" }}
               transition={{ duration: 5, ease: "linear" }}
               className="h-full bg-[#38A169] w-full shadow-[0_0_15px_#38A169]"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
