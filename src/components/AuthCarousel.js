"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";

const quotes = [
  {
    text: "Find the right car faster. Compare listings, prices, and dealer details in one place.",
    author: "Motorke",
    role: "Car Search"
  },
  {
    text: "Dealers can list cars, get leads, and manage their inventory from one dashboard.",
    author: "Motorke",
    role: "Dealer Tools"
  },
  {
    text: "Buyers and dealers connect directly with clear contact info and secure account tools.",
    author: "Motorke",
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
    <section className="hidden lg:flex lg:w-[55%] xl:w-[45%] relative flex-col justify-center p-20 overflow-hidden bg-slate-900 border-r border-[#ddd4c8]">
      
      {/* Background aesthetics without images */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-#ff5a2f/10 rounded-none blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-#ff5a2f/10 rounded-none blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10 max-w-lg my-auto">
        <Quote className="text-#ff5a2f/30 w-16 h-16 mb-8 -ml-2" strokeWidth={1} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-2xl xl:text-3xl font-medium text-slate-900 leading-relaxed tracking-tight">
              "{quotes[current].text}"
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 mt-auto pt-12 flex justify-between items-end border-t border-[#ddd4c8]/50 w-full max-w-lg">
        <div className="flex gap-2">
          {quotes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1 rounded-none transition-all duration-500 ${current === idx ? "w-8 bg-#ff5a2f" : "w-2 bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
