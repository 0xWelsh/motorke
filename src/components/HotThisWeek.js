"use client";

import { TrendingUp, Crown } from "lucide-react";

export default function HotThisWeek({ trending = [] }) {
  const defaultTrending = [
    { make: "Toyota Prado", change: 24, units: 47 },
    { make: "BMW X5", change: 18, units: 32 },
    { make: "Mazda CX-5", change: 15, units: 28 },
    { make: "Nissan Note", change: 12, units: 21 },
  ];

  const trendData = trending.length > 0 ? trending : defaultTrending;

  return (
    <div className="relative overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 p-6 sm:p-8">
      {/* Crown icon */}
      <div className="absolute -right-2 -top-2 text-yellow-300">
        <Crown className="w-12 h-12 fill-yellow-300" />
      </div>

      {/* Radiant glow effect */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-2xl bg-yellow-200/40 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-yellow-600" />
          <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-yellow-700">Trending Now</p>
        </div>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 leading-tight">Hot This Week</h3>
        <p className="text-xs text-slate-500 font-semibold mb-6">Most loved cars right now</p>

        <div className="space-y-3">
          {trendData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/80 border border-yellow-100 hover:border-yellow-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.make}</p>
                <p className="text-[11px] text-slate-500 font-semibold">{item.units} viewed this week</p>
              </div>
              <div className="ml-3 flex-shrink-0 flex items-center gap-1">
                <span className="text-base font-black text-yellow-600">+{item.change}%</span>
                <TrendingUp className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 font-semibold mt-4 pt-4 border-t border-yellow-100">
          Updated daily • Based on views, saves, and enquiries
        </p>
      </div>
    </div>
  );
}
