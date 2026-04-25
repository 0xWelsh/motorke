"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";

const quotes = [
  {
    text: "Find the right car faster. Compare listings, prices, and dealer details in one place.",
    author: "Welsh Motors",
    role: "Car Search"
  },
  {
    text: "Dealers can list cars, get leads, and manage their inventory from one dashboard.",
    author: "Welsh Motors",
    role: "Dealer Tools"
  },
  {
    text: "Buyers and dealers connect directly with clear contact info and secure account tools.",
    author: "Welsh Motors",
    role: "Trusted Marketplace"
  }
];

export default function AuthCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % quotes.length);
    }, 8000); // Slower interval for reading quotes
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hidden lg:flex lg:w-[55%] xl:w-[45%] relative flex-col justify-center p-20 overflow-hidden border-r border-[#ddd4c8] dark:border-slate-800">
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.img
          src="/images/backgrounds/pexels-mikebirdy-10123994.jpg"
          alt="Premium Car Background"
          className="w-full h-full object-cover"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent" />
      </div>

      <div className="relative z-10 max-w-lg my-auto">
        <Quote className="text-[#ff5a2f]/30 w-16 h-16 mb-8 -ml-2" strokeWidth={1} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-2xl xl:text-3xl font-medium text-slate-900 dark:text-white leading-relaxed tracking-tight">
              "{quotes[current].text}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 mt-auto pt-12 flex justify-between items-end border-t border-[#ddd4c8] dark:border-slate-800/50 w-full max-w-lg">
        <div className="flex gap-2">
          {quotes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1 rounded-2xl transition-all duration-500 ${current === idx ? "w-8 bg-[#ff5a2f]" : "w-2 bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
