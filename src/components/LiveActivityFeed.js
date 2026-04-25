"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Zap, MapPin } from "lucide-react";
import Link from "next/link";

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // In a real app, this would be a WebSocket or better polling. 
    // We'll mock some data based on real listings if possible, or just mock for now.
    const mockActivities = [
      { id: 1, type: "VIEW", user: "Someone in Nairobi", car: "2019 Toyota Prado", time: "just now" },
      { id: 2, type: "NEW", user: "Welsh Motors", car: "2021 Mercedes-Benz E63", time: "2 mins ago" },
      { id: 3, type: "VIEW", user: "Someone in Mombasa", car: "2018 Honda Fit", time: "5 mins ago" },
      { id: 4, type: "NEW", user: "Japanese Car Exports", car: "2022 Toyota Vitz", time: "10 mins ago" },
    ];
    setActivities(mockActivities);

    const interval = setInterval(() => {
      // Rotate or add new mock activity
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 left-6 z-[60] hidden md:block">
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {activities.slice(0, 2).map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.9 }}
              transition={{ delay: idx * 0.2 }}
              className="bg-white/80 dark:bg-black/80 backdrop-blur-xl border border-slate-200 dark:border-zinc-800 p-4 shadow-2xl flex items-start gap-4 min-w-[300px]"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                activity.type === "VIEW" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
              }`} style={{ borderRadius: '2px' }}>
                {activity.type === "VIEW" ? <Eye size={18} /> : <Zap size={18} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
                  {activity.user}
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  {activity.time}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activity.type === "VIEW" ? "Viewed " : "New Listing: "}
                  <span className={activity.type === "VIEW" ? "text-slate-900 dark:text-white" : "text-emerald-500"}>
                    {activity.car}
                  </span>
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
