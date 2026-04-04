"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    image: "/signup/main.webp",
    title: "High-Performance",
    subtitle: "Marketplace.",
    description: "Access Kenya's most sophisticated automotive inventory and dealer tools in one seamless dashboard.",
  },
  {
    image: "/signup/land_cruiser.webp",
    title: "Accelerate Your",
    subtitle: "Sales Engine.",
    description: "Reach thousands of verified buyers with our advanced analytics and leading CRM tools.",
  },
  {
    image: "/signup/crown.webp", 
    title: "Intelligence &",
    subtitle: "Analytics.",
    description: "Stay ahead of the curve with real-time market data, trend forecasting, and competitive pricing analysis.",
  }
];

export default function AuthCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hidden lg:flex lg:w-[55%] xl:w-[45%] relative items-end p-20 overflow-hidden bg-slate-900 border-r border-slate-800">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image}
            alt="Premium Car"
            fill
            priority
            className="object-cover opacity-80"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

      <div className="relative z-10 max-w-lg">
        <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Verified Network</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-5xl xl:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-6">
              {slides[current].title}<br />
              <span className="text-emerald-500">{slides[current].subtitle}</span>
            </h2>
            <p className="text-white/60 text-lg font-medium leading-relaxed mb-10 max-w-md">
              {slides[current].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">5,000+</span>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Active Units</span>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-2xl font-black text-white">120+</span>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Verified Dealers</span>
          </div>
        </div>

        <div className="flex gap-2 mt-12">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1 rounded-full transition-all duration-500 ${current === idx ? "w-8 bg-emerald-500" : "w-2 bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
