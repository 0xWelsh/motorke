"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { carListingPath } from "@/lib/car-listing-url";
import { createDealerDivIcon, escapeMapHtml } from "@/lib/map-pin";

function formatPrice(p) {
  if (!p) return null;
  if (p >= 1_000_000) return `KES ${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000) return `KES ${(p / 1_000).toFixed(0)}K`;
  return `KES ${p}`;
}

export default function SearchMapLeaflet({ dealers }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [-1.2921, 36.8219],
      zoom: 7,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markers = [];

    dealers.forEach((dealer) => {
      const lat = Number(dealer.lat);
      const lng = Number(dealer.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const icon = createDealerDivIcon(L, {
        label: dealer.name,
        badge: String(dealer.cars.length),
        verified: dealer.verified,
      });

      const carListHtml = dealer.cars
        .slice(0, 5)
        .map((c) => {
          const price = formatPrice(c.price);
          const href = carListingPath(c);
          const title = escapeMapHtml(`${c.year} ${c.make} ${c.model}`);
          return `
          <a href="${href}" style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;color:inherit">
            <span style="font-size:11px;font-weight:700;color:#0f172a">${title}</span>
            ${price ? `<span style="font-size:11px;font-weight:800;color:#ff5a2f;white-space:nowrap">${price}</span>` : ""}
          </a>
        `;
        })
        .join("");

      const moreCount = dealer.cars.length - 5;
      const popup = `
        <div style="min-width:220px;font-family:system-ui,sans-serif">
          <div style="margin-bottom:8px">
            <p style="font-weight:900;font-size:13px;margin:0 0 2px">${escapeMapHtml(dealer.name)}</p>
            ${dealer.location ? `<p style="font-size:11px;color:#64748b;margin:0">${escapeMapHtml(dealer.location)}${dealer.county ? `, ${escapeMapHtml(dealer.county)}` : ""}</p>` : ""}
          </div>
          <div style="margin-bottom:8px">${carListHtml}</div>
          ${moreCount > 0 ? `<p style="font-size:10px;color:#94a3b8;margin:4px 0 6px">+${moreCount} more ${moreCount === 1 ? "car" : "cars"}</p>` : ""}
          <a href="/dealers/${escapeMapHtml(dealer.slug)}" style="font-size:11px;font-weight:800;color:#ff5a2f;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em">
            View Dealer →
          </a>
        </div>
      `;

      const m = L.marker([lat, lng], { icon, title: dealer.name })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 280 })
        .on("mouseover", function () {
          this.openPopup();
        });

      markers.push(m);
    });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [48, 48], maxZoom: 14 });
    }

    instanceRef.current = map;

    const refresh = () => map.invalidateSize();
    const t1 = setTimeout(refresh, 100);
    const t2 = setTimeout(refresh, 400);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => refresh())
        : null;
    ro?.observe(mapRef.current);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
      map.remove();
      instanceRef.current = null;
    };
  }, [dealers]);

  return <div ref={mapRef} style={{ width: "100%", height: "460px" }} />;
}
