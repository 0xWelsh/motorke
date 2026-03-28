"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, ChevronRight, Sparkles, User } from "lucide-react";
import { formatPrice } from "@/lib/utils";

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
    <section className="bg-surface border-b border-white/5 py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* PERSONALIZED HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center shadow-2xl">
              {user ? (
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-pureWhite font-bold">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <Clock className="w-6 h-6 text-white/40" />
              )}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                {user ? `Welcome back, ${user.name.split(' ')[0]}!` : "Welcome back!"}
              </h2>
              <p className="text-white/50 text-sm font-medium">Picking up where you left off...</p>
            </div>
          </div>
          <Link href="/account/saved" className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-sm font-bold text-white/70 hover:border-white/20 hover:text-white transition-all shadow-sm flex items-center gap-2">
            My Saved Collection <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* RECENTLY VIEWED */}
        {recent.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Recently Viewed</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recent.map((car) => (
                <CarMiniCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        )}

        {/* RECOMMENDATIONS */}
        {recommended.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Recommended for You</span>
              </div>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommended.map((car) => (
                <CarMiniCard key={car.id} car={{
                  id: car.id,
                  title: `${car.year} ${car.make} ${car.model}`,
                  price: car.price,
                  image: car.images?.[0]?.url
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CarMiniCard({ car }) {
  return (
    <Link href={`/cars/${car.id}`} className="group bg-background border border-white/10 rounded-2xl overflow-hidden hover:border-orange-500 hover:shadow-2xl transition-all duration-500">
      <div className="aspect-[16/10] overflow-hidden bg-white/5 relative">
        {car.image ? (
          <img src={car.image} alt={car.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-[10px] font-black uppercase tracking-widest">No Image</div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
      </div>
      <div className="p-5">
        <h3 className="font-bold text-white text-sm truncate group-hover:text-orange-500 transition-colors mb-1">{car.title}</h3>
        <p className="text-orange-500 font-black text-base">{formatPrice(car.price)}</p>
      </div>
    </Link>
  );
}
