"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapComponent({ defaultLat, defaultLng, onChange }) {
  // Default to Nairobi coordinates if none provided
  const initialPosition = defaultLat && defaultLng 
    ? { lat: defaultLat, lng: defaultLng } 
    : { lat: -1.2921, lng: 36.8219 };
    
  // If editing an existing location, start with it pinned
  const [position, setPosition] = useState(defaultLat && defaultLng ? initialPosition : null);

  useEffect(() => {
    if (position) {
      onChange(position.lat, position.lng);
    }
  }, [position, onChange]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 z-0">
      <MapContainer 
        center={initialPosition} 
        zoom={defaultLat && defaultLng ? 15 : 12} 
        scrollWheelZoom={true} 
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
