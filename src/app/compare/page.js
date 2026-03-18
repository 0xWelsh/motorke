// src/app/compare/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Compare Cars — Motorke Kenya" };

export default async function ComparePage({ searchParams }) {
  const ids = [searchParams.a, searchParams.b, searchParams.c].filter(Boolean);

  const cars = ids.length > 0
    ? await db.car.findMany({
        where:   { id: { in: ids }, available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { name: true, slug: true, location: true } },
        },
      })
    : [];

  // Sort by the order they were requested
  const orderedCars = ids.map((id) => cars.find((c) => c.id === id)).filter(Boolean);

  const specRows = [
    { label: "Price",           key: (c) => ({ value: formatPrice(c.price), raw: c.price }) },
    { label: "Year",            key: (c) => ({ value: c.year, raw: c.year }) },
    { label: "Mileage",         key: (c) => ({ value: formatMileage(c.mileage), raw: c.mileage }) },
    { label: "Fuel type",       key: (c) => ({ value: FUEL_LABELS[c.fuelType], raw: c.fuelType }) },
    { label: "Transmission",    key: (c) => ({ value: TRANSMISSION_LABELS[c.transmission], raw: c.transmission }) },
    { label: "Body type",       key: (c) => ({ value: BODY_TYPE_LABELS[c.bodyType], raw: c.bodyType }) },
    { label: "Engine",          key: (c) => ({ value: c.engineCC ? `${c.engineCC}cc` : "N/A", raw: c.engineCC }) },
    { label: "Drive type",      key: (c) => ({ value: c.driveType, raw: c.driveType }) },
    { label: "Seats",           key: (c) => ({ value: c.seats || "N/A", raw: c.seats }) },
    { label: "Colour",          key: (c) => ({ value: c.color || "N/A", raw: c.color }) },
    { label: "Condition",       key: (c) => ({ value: c.condition, raw: c.condition }) },
    { label: "Duty paid",       key: (c) => ({ value: c.dutyPaid ? "Yes" : "No", raw: c.dutyPaid }) },
    { label: "Dealership",      key: (c) => ({ value: c.dealer?.name, raw: c.dealer?.name }) },
    { label: "Location",        key: (c) => ({ value: c.dealer?.location, raw: c.dealer?.location }) },
  ];

  // Helper: highlight best value for numeric rows
  function isBest(row, car, cars) {
    if (cars.length < 2) return false;
    const vals = cars.map((c) => row.key(c).raw).filter((v) => v != null && !isNaN(v));
    if (vals.length < 2) return false;
    const mine = row.key(car).raw;
    if (mine == null || isNaN(mine)) return false;
    // For price and mileage, lower is better
    if (row.label === "Price" || row.label === "Mileage") return mine === Math.min(...vals);
    // For year and engine, higher is better
    if (row.label === "Year" || row.label === "Engine") return mine === Math.max(...vals);
    return false;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2">Compare cars</h1>
        <p className="text-white/40">Pick up to 3 cars to compare side by side</p>
      </div>

      {/* Empty state */}
      {orderedCars.length === 0 && (
        <div className="text-center py-24">
          <p className="text-6xl mb-4">⚖️</p>
          <p className="text-xl font-bold mb-2">No cars selected</p>
          <p className="text-white/40 mb-6">Browse cars and click "Add to comparison" on any car page</p>
          <Link href="/cars" className="bg-[#f97316] hover:bg-[#ea6c0b] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Browse cars
          </Link>
        </div>
      )}

      {orderedCars.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-xs text-white/30 uppercase tracking-wider pb-6 pr-4 w-32">Spec</th>
                {orderedCars.map((car) => {
                  const img = car.images[0]?.url;
                  return (
                    <th key={car.id} className="pb-6 px-3 align-top">
                      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="aspect-[16/10] bg-white/5">
                          {img
                            ? <img src={img} alt={car.model} className="w-full h-full object-cover" />
                            : <div className="flex items-center justify-center h-full text-3xl">🚗</div>
                          }
                        </div>
                        <div className="p-3 text-left">
                          <p className="font-black text-sm">{car.year} {car.make} {car.model}</p>
                          {car.variant && <p className="text-[10px] text-white/40 mt-0.5 truncate">{car.variant}</p>}
                          <p className="text-[#f97316] font-black mt-1">{formatPrice(car.price)}</p>
                          <Link
                            href={`/cars/${car.id}`}
                            className="mt-2 block text-center text-[10px] border border-white/10 rounded-lg py-1.5 text-white/50 hover:text-white transition-colors"
                          >
                            View details
                          </Link>
                          <a
                            href={`/compare?${orderedCars.filter((c) => c.id !== car.id).map((c, i) => `${"abc"[i]}=${c.id}`).join("&")}`}
                            className="mt-1 block text-center text-[10px] text-red-400/50 hover:text-red-400 transition-colors"
                          >
                            Remove ×
                          </a>
                        </div>
                      </div>
                    </th>
                  );
                })}
                {/* Empty slot */}
                {orderedCars.length < 3 && (
                  <th className="pb-6 px-3 align-top">
                    <Link
                      href="/cars"
                      className="flex flex-col items-center justify-center bg-white/[0.02] border border-dashed border-white/10 hover:border-[#f97316]/30 rounded-2xl h-48 transition-colors text-white/30 hover:text-[#f97316]"
                    >
                      <span className="text-3xl mb-2">+</span>
                      <span className="text-xs">Add car</span>
                    </Link>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {specRows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
                  <td className="text-xs text-white/40 py-3 pr-4 font-medium">{row.label}</td>
                  {orderedCars.map((car) => {
                    const { value } = row.key(car);
                    const best = isBest(row, car, orderedCars);
                    return (
                      <td key={car.id} className="py-3 px-3 text-center">
                        <span className={`text-sm font-semibold ${best ? "text-green-400" : "text-white/80"}`}>
                          {best && <span className="text-[10px] mr-1">✓</span>}
                          {value}
                        </span>
                      </td>
                    );
                  })}
                  {orderedCars.length < 3 && <td />}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
