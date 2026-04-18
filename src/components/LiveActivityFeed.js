"use client";
import { useState, useEffect } from "react";
import { Zap, Eye, ShoppingBag, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";

/** Mock live activities if real ones are sparse — "Vibe" creation */
const MOCK_ACTIVITIES = [
  { id: 1, type: 'VIEW', dealer: 'Mombasa Road Motors', car: 'Toyota Harrier', time: 'Just now' },
  { id: 2, type: 'INQUIRY', dealer: 'Executive Car Hub', car: 'BMW X5', time: '2 mins ago' },
  { id: 3, type: 'LISTING', dealer: 'Nairobi Prestige', car: 'Mazda CX-5', time: '5 mins ago' },
  { id: 4, type: 'VIEW', dealer: 'Diamond Dealership', car: 'Toyota Land Cruiser', time: '12 mins ago' },
];

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);

  useEffect(() => {
    // Logic: In a real app, this would use WebSockets (Pusher/Socket.io) or SWR to fetch real events.
    // For the "Vibe", we can occasionally rotate the mock list or fetch from /api/activity.
    const interval = setInterval(() => {
       // Simple rotation for the "Alive" feel
       setActivities(prev => {
         const last = prev[prev.length - 1];
         return [last, ...prev.slice(0, prev.length - 1)];
       });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-200/40 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-light rounded-2xl flex items-center justify-center text-brand">
            <Zap className="w-5 h-5 fill-brand" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Market Pulse</h3>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-2xl bg-brand animate-pulse" /> Live Now
            </p>
          </div>
        </div>
        <Link href="/cars" className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300 hover:text-brand transition-colors">
          View All
        </Link>
      </div>

      <div className="space-y-6 flex-1 overflow-hidden relative">
        {/* Fading bottom overlay for list */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        
        {activities.map((a, i) => (
          <div key={`${a.id}-${i}`} className="flex gap-4 group animate-in slide-in-from-right-4 duration-700">
            <div className="relative shrink-0">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                 a.type === 'VIEW' ? 'bg-blue-50 text-[#ff5a2f]' : 
                 a.type === 'INQUIRY' ? 'bg-emerald-50 text-[#ff5a2f]' : 'bg-orange-50 text-[#ff5a2f]'
               }`}>
                 {a.type === 'VIEW' ? <Eye className="w-5 h-5" /> : 
                  a.type === 'INQUIRY' ? <ShoppingBag className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
               </div>
               {i === 0 && (
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand rounded-2xl border-2 border-white" />
               )}
            </div>
            <div className="flex-1 min-w-0 border-b border-slate-50 pb-6 group-last:border-0">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate pr-4">
                  {a.type === 'VIEW' ? 'Viewing' : a.type === 'INQUIRY' ? 'Enquiry' : 'New Listing'} — {a.car}
                </p>
                <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">{a.time}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-slate-300" /> {a.dealer}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-[#ddd4c8] dark:border-slate-800">
        <Link href="/dealers" className="flex items-center justify-between group">
           <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-8 h-8 rounded-2xl border-2 border-white bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-400">
                  {i}
                </div>
              ))}
              <div className="w-8 h-8 rounded-2xl border-2 border-white bg-brand text-slate-900 dark:text-white flex items-center justify-center text-[11px] font-bold">
                +12
              </div>
           </div>
           <span className="text-xs font-extrabold text-slate-900 dark:text-white group-hover:text-brand transition-colors flex items-center gap-1.5">
              Verified Dealers <ChevronRight className="w-4 h-4" />
           </span>
        </Link>
      </div>
    </div>
  );
}
