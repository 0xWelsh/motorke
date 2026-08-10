"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CarCard from "@/components/CarCard";
import { readRecentCarsFromStorage } from "@/lib/personalization";

export default function ClientRecentSection() {
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const localData = readRecentCarsFromStorage();
        if (localData.length === 0) {
          setLoading(false);
          return;
        }

        const ids = localData.slice(0, 4).map((c) => c.id).join(",");
        const res = await fetch(`/api/cars?ids=${ids}&limit=4`);
        const data = await res.json();
        const cars = data.cars || [];

        const ordered = localData
          .slice(0, 4)
          .map((s) => cars.find((c) => c.id === s.id))
          .filter(Boolean);

        setRecent(ordered);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading || recent.length === 0) return null;

  return (
    <section className="bg-white border-y border-slate-200 py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Recently Viewed
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Pick up where you left off</p>
          </div>
          <Link
            href="/account?tab=saved"
            className="hidden sm:inline-flex items-center gap-2 bg-slate-50 border border-slate-200 px-6 py-3 rounded-2xl text-sm font-bold text-slate-900 hover:border-[var(--accent)]/30 hover:text-[var(--brand)] transition-all shadow-sm"
          >
            Saved cars <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8">
          {recent.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}
