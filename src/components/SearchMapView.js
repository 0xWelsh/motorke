"use client";
/**
 * SearchMapView.js
 * Client component shown on the car search page when the user toggles Map View.
 * Groups cars by dealer, shows each dealer as a pin, popup lists available cars.
 */
import dynamic from "next/dynamic";
import { carListingPath } from "@/lib/car-listing-url";
import { Loader2 } from "lucide-react";

const SearchMapLeaflet = dynamic(() => import("./SearchMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[460px] bg-slate-50 animate-pulse flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
    </div>
  ),
});

export default function SearchMapView({ cars }) {
  // Group cars by dealer, keep only dealers with coordinates
  const dealerMap = {};
  for (const car of cars) {
    if (!car.dealer?.lat || !car.dealer?.lng) continue;
    const key = car.dealer.id;
    if (!dealerMap[key]) {
      dealerMap[key] = {
        id: car.dealer.id,
        name: car.dealer.name,
        slug: car.dealer.slug,
        lat: parseFloat(car.dealer.lat),
        lng: parseFloat(car.dealer.lng),
        location: car.dealer.location,
        county: car.dealer.county,
        verified: car.dealer.verified,
        cars: [],
      };
    }
    dealerMap[key].cars.push({
      id: car.id,
      publicSlug: car.publicSlug,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
    });
  }

  const dealers = Object.values(dealerMap);

  if (dealers.length === 0) {
    return (
      <div className="w-full h-[320px] bg-white border border-[#ddd4c8] flex flex-col items-center justify-center gap-3">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          No dealer locations available for these results
        </p>
        <p className="text-xs text-slate-400 font-medium">Add latitude/longitude to dealers in the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#ddd4c8] overflow-hidden">
      <div className="px-4 py-3 bg-white border-b border-[#e8e2d9] flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-600">
          {dealers.length} dealer location{dealers.length !== 1 ? "s" : ""} on this page
        </p>
        <p className="text-[10px] text-slate-400 font-semibold">Click a pin to see cars</p>
      </div>
      <SearchMapLeaflet dealers={dealers} />
    </div>
  );
}
