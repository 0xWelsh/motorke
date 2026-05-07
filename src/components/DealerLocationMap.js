"use client";
/**
 * DealerLocationMap.js
 * Single-dealer embedded Leaflet map for the dealer profile page sidebar.
 * Shows a branded pin at the dealer's exact lat/lng with a popup.
 * Falls back gracefully if no coordinates are available.
 */
import dynamic from "next/dynamic";
import { MapPin, ExternalLink } from "lucide-react";

const LeafletSinglePin = dynamic(() => import("./DealerLocationMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] bg-slate-50 animate-pulse flex items-center justify-center">
      <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading map…</span>
    </div>
  ),
});

export default function DealerLocationMap({ dealer }) {
  const lat = Number.parseFloat(dealer?.lat);
  const lng = Number.parseFloat(dealer?.lng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapsQuery = encodeURIComponent(
    [dealer?.address || dealer?.location, dealer?.county, "Kenya"].filter(Boolean).join(", ")
  );
  const googleHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div className="border border-[#ddd4c8] dark:border-slate-800 bg-white overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#ff5a2f]" />
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-700">Location</p>
        </div>
        <a
          href={googleHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#ff5a2f] transition-colors"
        >
          Open in Google <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {hasCoords ? (
        <LeafletSinglePin
          lat={lat}
          lng={lng}
          name={dealer.name}
          address={dealer.address || dealer.location}
          county={dealer.county}
          slug={dealer.slug}
          verified={dealer.verified}
        />
      ) : (
        <div className="mx-5 mb-5 overflow-hidden border border-slate-200" style={{ borderRadius: "8px" }}>
          <iframe
            title={`Map of ${dealer?.name || "dealer location"}`}
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            className="w-full h-[200px] border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      <div className="px-5 py-3 border-t border-[#e8e2d9] bg-slate-50">
        <p className="text-xs font-semibold text-slate-600">
          {dealer.address || dealer.location}
          {dealer.county ? `, ${dealer.county} County` : ""}
        </p>
      </div>
    </div>
  );
}
