"use client";
/**
 * SearchMapLeaflet.js
 * Pure Leaflet map for search results — one pin per dealer, popup lists their cars.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function formatPrice(p) {
  if (!p) return null;
  if (p >= 1_000_000) return `$${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000)     return `$${(p / 1_000).toFixed(0)}K`;
  return `$${p}`;
}

export default function SearchMapLeaflet({ dealers }) {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Default centre = Nairobi
    const map = L.map(mapRef.current, {
      center: [-1.2921, 36.8219],
      zoom: 7,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const markers = [];

    dealers.forEach((dealer) => {
      const icon = L.divIcon({
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
            <div style="
              background:#111111;color:#fff;
              font-size:10px;font-weight:900;letter-spacing:0.5px;
              padding:3px 8px;
              border:2px solid #fff;
              box-shadow:0 2px 6px rgba(0,0,0,0.2);
              white-space:nowrap;
            ">
              ${dealer.name} · ${dealer.cars.length}
            </div>
            <div style="width:2px;height:6px;background:#ff5a2f"></div>
            <div style="width:7px;height:7px;border-radius:50%;background:#ff5a2f;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>
          </div>
        `,
        iconSize: [null, null],
        iconAnchor: [0, 0],
        className: "",
      });

      const carListHtml = dealer.cars.slice(0, 5).map((c) => {
        const price = formatPrice(c.computedLandedPrice ?? c.price);
        return `
          <a href="/cars/${c.id}" style="display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid #f1f5f9;text-decoration:none;color:inherit">
            <span style="font-size:11px;font-weight:700;color:#0f172a">${c.year} ${c.make} ${c.model}</span>
            ${price ? `<span style="font-size:11px;font-weight:800;color:#ff5a2f;white-space:nowrap">${price}</span>` : ""}
          </a>
        `;
      }).join("");

      const moreCount = dealer.cars.length - 5;

      const popup = `
        <div style="min-width:220px;font-family:system-ui,sans-serif">
          <div style="margin-bottom:8px">
            <p style="font-weight:900;font-size:13px;margin:0 0 2px">${dealer.name}</p>
            ${dealer.location ? `<p style="font-size:11px;color:#64748b;margin:0">${dealer.location}${dealer.county ? `, ${dealer.county}` : ""}</p>` : ""}
          </div>
          <div style="margin-bottom:8px">${carListHtml}</div>
          ${moreCount > 0 ? `<p style="font-size:10px;color:#94a3b8;margin:4px 0 6px">+${moreCount} more ${moreCount === 1 ? "car" : "cars"}</p>` : ""}
          <a href="/dealers/${dealer.slug}" style="font-size:11px;font-weight:800;color:#ff5a2f;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em">
            View Dealer →
          </a>
        </div>
      `;

      const m = L.marker([dealer.lat, dealer.lng], { icon, title: dealer.name })
        .addTo(map)
        .bindPopup(popup, { maxWidth: 280 })
        .on("mouseover", function () { this.openPopup(); });

      markers.push(m);
    });

    // Fit bounds to all dealer pins
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 13 });
    }

    instanceRef.current = map;

    // FIX: Ensure map tiles load correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, [dealers]);

  return <div ref={mapRef} style={{ width: "100%", height: "460px" }} />;
}
