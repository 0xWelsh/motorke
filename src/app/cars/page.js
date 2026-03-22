// src/app/cars/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/utils";
import Link from "next/link";
import { CompareButton } from "@/components/CompareSelector";

export const metadata = { title: "Browse Cars — Motorke Kenya" };

// Haversine distance in km between two lat/lng points
function distance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lat2) return 9999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const COUNTIES = ["Nairobi","Mombasa","Nakuru","Kisumu","Uasin Gishu","Kiambu","Machakos","Meru","Eldoret"];

export default async function CarsPage({ searchParams }) {
  const sp       = await searchParams;
  const page     = parseInt(sp.page  || "1");
  const limit    = 12;
  const search   = sp.search   || "";
  const make     = sp.make     || "";
  const bodyType = sp.bodyType || "";
  const fuelType = sp.fuelType || "";
  const county   = sp.county   || "";
  const minPrice = sp.minPrice ? parseInt(sp.minPrice) : undefined;
  const maxPrice = sp.maxPrice ? parseInt(sp.maxPrice) : undefined;
  const userLat  = sp.lat  ? parseFloat(sp.lat)  : null;
  const userLng  = sp.lng  ? parseFloat(sp.lng)  : null;

  const where = {
    available: true,
    ...(make     && { make: { equals: make, mode: "insensitive" } }),
    ...(bodyType && { bodyType }),
    ...(fuelType && { fuelType }),
    ...(minPrice || maxPrice ? { price: { ...(minPrice && { gte: minPrice }), ...(maxPrice && { lte: maxPrice }) } } : {}),
    ...(county   && { dealer: { county: { equals: county, mode: "insensitive" } } }),
    ...(search   && { OR: [
      { make:    { contains: search, mode: "insensitive" } },
      { model:   { contains: search, mode: "insensitive" } },
      { variant: { contains: search, mode: "insensitive" } },
    ]}),
  };

  const [cars, total, allMakes] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        images:  { where: { isPrimary: true }, take: 1 },
        dealer:  { select: { id: true, name: true, slug: true, location: true, verified: true, lat: true, lng: true, county: true } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.car.count({ where }),
    db.car.findMany({ where: { available: true }, distinct: ["make"], select: { make: true }, orderBy: { make: "asc" } }),
  ]);

  // Sort by distance if user location provided
  const sortedCars = userLat && userLng
    ? [...cars].sort((a, b) => {
        const da = distance(userLat, userLng, a.dealer?.lat, a.dealer?.lng);
        const db2 = distance(userLat, userLng, b.dealer?.lat, b.dealer?.lng);
        return da - db2;
      })
    : cars;

  const pages = Math.ceil(total / limit);
  const hasFilters = search || make || bodyType || fuelType || county || minPrice || maxPrice;

  const inputCls = { background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#1A1A1A" };
  const selectCls = { background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#1A1A1A" };

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", color: "#111827" }}>
          {search ? `Results for "${search}"` : county ? `Cars in ${county}` : "Browse all cars"}
        </h1>
        <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>
          {total} car{total !== 1 ? "s" : ""} available
          {userLat && " · Sorted by distance from you"}
        </p>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28, padding: "16px 20px", background: "#fff", borderRadius: 14, border: "1px solid #E2E2E2" }}>
        <input name="search" defaultValue={search} placeholder="Search make or model…" style={{ ...inputCls, minWidth: 180 }} />

        <select name="make" defaultValue={make} style={selectCls}>
          <option value="">All makes</option>
          {allMakes.map(m => <option key={m.make} value={m.make}>{m.make}</option>)}
        </select>

        <select name="bodyType" defaultValue={bodyType} style={selectCls}>
          <option value="">All types</option>
          {Object.entries(BODY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select name="fuelType" defaultValue={fuelType} style={selectCls}>
          <option value="">All fuels</option>
          {Object.entries(FUEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        <select name="county" defaultValue={county} style={selectCls}>
          <option value="">All counties</option>
          {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select name="minPrice" defaultValue={sp.minPrice || ""} style={selectCls}>
          <option value="">Min price</option>
          {[500000,1000000,2000000,3000000,5000000].map(p => (
            <option key={p} value={p}>KSh {(p/1000000).toFixed(1)}M</option>
          ))}
        </select>

        <select name="maxPrice" defaultValue={sp.maxPrice || ""} style={selectCls}>
          <option value="">Max price</option>
          {[1000000,2000000,3000000,5000000,8000000,15000000].map(p => (
            <option key={p} value={p}>KSh {(p/1000000).toFixed(1)}M</option>
          ))}
        </select>

        {/* Pass lat/lng through if set */}
        {userLat && <input type="hidden" name="lat" value={userLat} />}
        {userLng && <input type="hidden" name="lng" value={userLng} />}

        <button type="submit" style={{ background: "#111827", color: "white", border: "none", borderRadius: 10, padding: "9px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          Filter
        </button>

        {hasFilters && (
          <a href="/cars" style={{ display: "flex", alignItems: "center", fontSize: 13, color: "#1D4ED8", textDecoration: "none", padding: "9px 4px", fontWeight: 500 }}>
            Clear all ×
          </a>
        )}
      </form>

      {/* Results */}
      {sortedCars.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E2E2E2", borderRadius: 16, padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>🔍</p>
          <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "#1A1A1A", marginBottom: 8 }}>No cars match your filters</p>
          <a href="/cars" style={{ color: "#1D4ED8", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Clear all filters →</a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18 }}>
          {sortedCars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.year} ${car.make} ${car.model}`;
            const dist  = userLat && car.dealer?.lat ? Math.round(distance(userLat, userLng, car.dealer.lat, car.dealer.lng)) : null;

            return (
              <div key={car.id} className="mk-car-card" style={{ background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 12, overflow: "hidden" }}>

                <Link href={`/cars/${car.id}`} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{ position: "relative", aspectRatio: "16/10", background: "#f0ede8", overflow: "hidden" }}>
                    {img
                      ? <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 40 }}>🚗</div>
                    }
                    {car.featured && (
                      <span style={{ position: "absolute", top: 10, left: 10, background: "#1D4ED8", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" }}>Featured</span>
                    )}
                    {dist !== null && (
                      <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(10,38,64,0.85)", color: "white", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>
                        📍 {dist} km
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>{title}</p>
                    {car.variant && <p style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{car.variant}</p>}
                    <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                      {[car.transmission, FUEL_LABELS[car.fuelType], car.mileage ? formatMileage(car.mileage) : null].filter(Boolean).map(tag => (
                        <span key={tag} style={{ fontSize: 11, background: "#F5F5F5", color: "#666", borderRadius: 5, padding: "2px 7px" }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
                      <p style={{ fontWeight: 800, fontSize: 16, color: "#1D4ED8" }}>{formatPrice(car.price)}</p>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 11, color: "#555", fontWeight: 500 }}>{car.dealer?.name}</p>
                        <p style={{ fontSize: 10, color: "#999" }}>{car.dealer?.location}</p>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Compare button outside the Link */}
                <div style={{ padding: "0 16px 14px", borderTop: "1px solid #F5F5F5", paddingTop: 10 }}>
                  <CompareButton carId={car.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 36 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <a key={p}
              href={`/cars?page=${p}&search=${search}&make=${make}&bodyType=${bodyType}&fuelType=${fuelType}&county=${county}`}
              style={{
                width: 38, height: 38, borderRadius: 10,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 600, textDecoration: "none",
                background: p === page ? "#1D4ED8" : "#fff",
                color:      p === page ? "white"   : "#555",
                border:     p === page ? "none"    : "1.5px solid #E2E2E2",
              }}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}