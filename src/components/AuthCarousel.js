"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";

const quotes = [
  {
    text: "The cars we drive say a lot about us. They are a reflection of our ambitions, our drive, and the journey we are undertaking. Choose your next machine with purpose and precision.",
    author: "Motorske Intelligence",
    role: "Platform Thesis"
  },
  {
    text: "A dealership is more than a showroom; it is a gateway to mobility. Every vehicle placed on this platform connects a driver with their destination, powered by trust and unparalleled data.",
    author: "Motorske Dealer Hub",
    role: "Partner Manifesto"
  },
  {
    text: "In the modern automotive market, speed is everything. Not just on the road, but in how fast you can connect a high-intent buyer with the exact specifications they are looking for.",
    author: "Yield Streams",
    role: "Market Dynamics"
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
    <section className="hidden lg:flex lg:w-[55%] xl:w-[45%] relative flex-col justify-center p-20 overflow-hidden bg-slate-900 border-r border-slate-800">
      
      {/* Background aesthetics without images */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      <div className="relative z-10 w-full max-w-lg mb-auto">
         <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Partner Portal</span>
        </div>
      </div>

      <div className="relative z-10 max-w-lg mt-auto mb-auto">
        <Quote className="text-emerald-500/30 w-16 h-16 mb-8 -ml-2" strokeWidth={1} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-2xl xl:text-3xl font-medium text-white leading-relaxed mb-10 tracking-tight">
              "{quotes[current].text}"
            </p>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                 <span className="text-emerald-500 font-black tracking-widest">{quotes[current].author[0]}</span>
              </div>
              <div>
                <p className="text-white font-bold tracking-tight">{quotes[current].author}</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500/80">{quotes[current].role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-10 mt-auto pt-12 flex justify-between items-end border-t border-slate-800/50 w-full max-w-lg">
        <div className="flex gap-2">
          {quotes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-1 rounded-full transition-all duration-500 ${current === idx ? "w-8 bg-emerald-500" : "w-2 bg-white/20 hover:bg-white/40"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
