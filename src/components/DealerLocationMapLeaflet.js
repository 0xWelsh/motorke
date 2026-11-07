"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createDealerDivIcon, escapeMapHtml } from "@/lib/map-pin";

export default function DealerLocationMapLeaflet({ lat, lng, name, address, county, slug, verified }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || instanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const icon = createDealerDivIcon(L, {
      label: name,
      verified: Boolean(verified),
      sublabel: county ? `${county}` : undefined,
    });

    const popup = `
      <div style="min-width:180px;font-family:system-ui,sans-serif">
        <p style="font-weight:900;font-size:13px;margin:0 0 4px">${escapeMapHtml(name)}</p>
        ${address ? `<p style="font-size:11px;color:#64748b;margin:0 0 2px">${escapeMapHtml(address)}</p>` : ""}
        ${county ? `<p style="font-size:11px;color:#64748b;margin:0 0 8px">${escapeMapHtml(county)} County</p>` : ""}
        ${slug ? `<a href="/dealers/${escapeMapHtml(slug)}" style="font-size:11px;font-weight:800;color:var(--accent);text-decoration:none;text-transform:uppercase;letter-spacing:0.08em">View Profile →</a>` : ""}
      </div>
    `;

    L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(popup, { maxWidth: 260 })
      .openPopup();

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
  }, [lat, lng, name, address, county, slug, verified]);

  return <div ref={mapRef} style={{ width: "100%", height: "280px" }} />;
}
