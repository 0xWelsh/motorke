"use client";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { createPickerDivIcon } from "@/lib/map-pin";

function LocationMarker({ position, setPosition, icon }) {
  useMapEvents({
    click(e) {
      if (setPosition) setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position} icon={icon} />;
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const refresh = () => map.invalidateSize();
    const t1 = setTimeout(refresh, 100);
    const t2 = setTimeout(refresh, 400);

    if (typeof window !== "undefined") {
      window.addEventListener("resize", refresh);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", refresh);
      }
    };
  }, [map]);

  return null;
}

export default function MapComponent({ defaultLat, defaultLng, onChange }) {
  const initialPosition =
    defaultLat && defaultLng
      ? { lat: parseFloat(defaultLat), lng: parseFloat(defaultLng) }
      : { lat: -1.2921, lng: 36.8219 };

  const [position, setPosition] = useState(
    defaultLat && defaultLng ? initialPosition : null,
  );

  const pickerIcon = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return createPickerDivIcon(L);
  }, []);

  useEffect(() => {
    if (position && onChange) {
      onChange(position.lat, position.lng);
    }
  }, [position, onChange]);

  if (typeof window === "undefined") return null;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-[#ddd4c8] dark:border-slate-800 z-0">
      <MapContainer
        center={initialPosition}
        zoom={defaultLat && defaultLng ? 16 : 12}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          setPosition={setPosition}
          icon={pickerIcon}
        />
      </MapContainer>
    </div>
  );
}
