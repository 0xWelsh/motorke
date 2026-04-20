"use client";
/**
 * DealerLocationMapLeaflet.js
 * Pure Leaflet (no react-leaflet) single-dealer pin map.
 * Loaded only client-side via DealerLocationMap's dynamic import.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function DealerLocationMapLeaflet({ lat, lng, name, address, county, slug, verified }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    // Fix Leaflet default icon paths (Next.js asset handling breaks them)
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false, // disable scroll-hijack on page
      attributionControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Branded dealer pin
    const icon = L.divIcon({
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
          <div style="
            background:#111111;color:#fff;
            font-size:11px;font-weight:900;letter-spacing:1px;
            padding:5px 10px;
            border:2px solid #fff;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            white-space:nowrap;
          ">
            ${name}${verified ? " ✓" : ""}
          </div>
          <div style="width:2px;height:8px;background:#ff5a2f"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#ff5a2f;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>
        </div>
      `,
      iconSize: [null, null],
      iconAnchor: [0, 0],
      className: "",
    });

    const popup = `
      <div style="min-width:180px;font-family:system-ui,sans-serif">
        <p style="font-weight:900;font-size:13px;margin:0 0 4px">${name}</p>
        ${address ? `<p style="font-size:11px;color:#64748b;margin:0 0 2px">${address}</p>` : ""}
        ${county  ? `<p style="font-size:11px;color:#64748b;margin:0 0 8px">${county} County</p>` : ""}
        ${slug    ? `<a href="/dealers/${slug}" style="font-size:11px;font-weight:800;color:#ff5a2f;text-decoration:none;text-transform:uppercase;letter-spacing:0.08em">View Profile →</a>` : ""}
      </div>
    `;

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(popup, { maxWidth: 260 })
      .openPopup();

    instanceRef.current = map;

    return () => {
      map.remove();
      instanceRef.current = null;
    };
  }, [lat, lng, name, address, county, slug, verified]);

  return <div ref={mapRef} style={{ width: "100%", height: "280px" }} />;
}
