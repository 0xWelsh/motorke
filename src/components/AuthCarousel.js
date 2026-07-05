"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Globe, Star } from 'lucide-react';

const SLIDES = [
  {
    title: "Verified Cars",
    desc: "Every car on BIDGARI is inspected before it goes live."
  },
  {
    title: "Fair Pricing",
    desc: "We analyze local listings to ensure you always get the best value."
  },
  {
    title: "Direct Chat",
    desc: "Speak with verified dealers in real-time to close deals faster."
  }
];

export default function AuthCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full w-full flex flex-col justify-center p-12 md:p-20 text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md"
        >
          <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-[1.1] mb-6">
            {SLIDES[index].title}
          </h3>
          <p className="text-lg text-white/70 font-medium leading-relaxed">
            {SLIDES[index].desc}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-12 left-12 md:left-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${i === index ? 'w-12 bg-[#38A169]' : 'w-3 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
