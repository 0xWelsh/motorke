"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Quote, ArrowRight } from 'lucide-react';
import { carListingPath } from "@/lib/car-listing-url";
import { getHeroImageUrl, saveDataQuality, saveDataWidth } from "@/lib/image-transform";
import { useSaveData } from "@/components/SaveDataProvider";

export default function HeroShowcase({ items }) {
  const saveData = useSaveData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!items || items.length === 0) return;
    
    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [items, currentIndex]);

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setIsAnimating(false);
    }, 500);
  };

  if (!items || items.length === 0) return null;

  const current = items[currentIndex];

  return (
    <div className="relative w-full max-w-sm mx-auto lg:ml-auto group">
      <div 
        className={`bg-[#0f0f0f] border border-white/[0.06] shadow-2xl transition-all duration-500 overflow-hidden ${isAnimating ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}
        style={{ borderRadius: 'var(--radius)' }}
      >
        {current.type === 'car' ? (
          <div className="flex flex-col">
            <div className="relative aspect-[16/10] overflow-hidden">
              <Image 
                src={getHeroImageUrl(current.images?.[0]?.url, saveDataQuality(saveData, 85), saveDataWidth(saveData, 800)) || "/images/placeholder.jpg"} 
                alt={current.model} 
                fill 
                className="object-cover"
                priority={!saveData}
              />
              <div className="absolute top-3 left-3">
                <span className="bg-[var(--accent)] text-white text-[8px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '1px' }}>
                  Featured Listing
                </span>
              </div>
            </div>
            <div className="p-5">
               <p className="text-[10px] font-sans font-semibold text-zinc-400 tracking-widest mb-1">{current.year} {current.make}</p>
               <h4 className="text-xl font-sans font-semibold text-white mb-4">{current.model}</h4>
               <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                 <span className="text-lg font-bold text-[var(--accent)]">KSh {(current.price/1000000).toFixed(2)}M</span>
                 <Link href={carListingPath(current)} className="text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                   View Details <ArrowRight className="w-3. h-3" />
                 </Link>
               </div>
            </div>
          </div>
        ) : (
          <div className="p-8 flex flex-col min-h-[300px] justify-center text-center">
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-white/[0.03] flex items-center justify-center rounded-full">
                <Quote className="w-5 h-5 text-[var(--accent)] fill-[var(--accent)]/10" />
              </div>
            </div>
            <div className="flex justify-center gap-0.5 mb-4">
              {Array.from({ length: current.rating || 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-base font-medium text-zinc-300 leading-relaxed mb-6">
              &ldquo;{current.comment}&rdquo;
            </p>
            <div className="mt-auto">
              <p className="text-xs font-bold text-white uppercase tracking-widest">{current.user?.name || "Verified Buyer"}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Purchased from {current.dealer?.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {items.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentIndex(i)}
            className={`h-1 transition-all duration-300 ${i === currentIndex ? 'w-8 bg-[var(--accent)]' : 'w-2 bg-white/10'}`}
          />
        ))}
      </div>
    </div>
  );
}
