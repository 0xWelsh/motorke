"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ChevronRight, Sparkles, User } from "lucide-react";
import { formatPrice, formatCarPrice } from "@/lib/utils";
import CarCard from "@/components/CarCard";

export default function ClientRecentSection() {
  const [recent, setRecent] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        // 1. Get User Session
        const userRes = await fetch("/api/auth/me");
        const userData = await userRes.json();
        if (userData.user) setUser(userData.user);

        // 2. Get Recent from LocalStorage
        const localData = JSON.parse(localStorage.getItem("motorke_recent") || "[]");
        setRecent(localData.slice(0, 4));

        // 3. Get Recommendations based on most frequent make in history
        if (localData.length > 0) {
          const makes = localData.map(c => c.make).filter(Boolean);
          const topMake = makes.sort((a,b) =>
            makes.filter(v => v===a).length - makes.filter(v => v===b).length
          ).pop();

          if (topMake) {
            const recRes = await fetch(`/api/cars?make=${topMake}&limit=4`);
            const recData = await recRes.json();
            // Filter out cars already in 'recent'
            const filteredRecs = recData.cars.filter(c => !localData.find(r => r.id === c.id));
            setRecommended(filteredRecs.slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to load personalized content", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading || (recent.length === 0 && recommended.length === 0)) return null;

  return (
    <section className="bg-white border-y border-[#ddd4c8] dark:border-slate-800 py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* PERSONALIZED HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
              {user ? (
                <div className="w-10 h-10 bg-[var(--brand)] rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-bold">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <Clock className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {user ? `Welcome back, ${user.name.split(' ')[0]}!` : "Welcome back!"}
              </h2>
              <p className="text-slate-700 text-sm font-medium">Picking up where you left off...</p>
            </div>
          </div>
          <Link href="/account?tab=saved" className="bg-[#fbfcfe] dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 px-6 py-3 rounded-2xl text-sm font-bold text-slate-900 dark:text-white hover:border-[var(--brand-accent)]/30 hover:text-[var(--brand)] transition-all shadow-sm flex items-center gap-2">
            My Saved Collection <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RECENTLY VIEWED */}
        {recent.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Recently Viewed</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {recent.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {recommended.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--brand-accent)] fill-[var(--brand-accent)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Recommended for You</span>
              </div>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {recommended.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
