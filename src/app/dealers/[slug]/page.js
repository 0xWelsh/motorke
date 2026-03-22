// src/app/dealers/[slug]/page.js
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, formatMileage } from "@/lib/utils";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dealer = await db.dealer.findUnique({ where: { slug } });
  if (!dealer) return {};
  return { title: `${dealer.name} — Motorke Kenya` };
}

export default async function DealerPage({ params }) {
  const { slug } = await params;

  const dealer = await db.dealer.findUnique({
    where:   { slug },
    include: {
      cars: {
        where:   { available: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!dealer) notFound();

  const makes = [...new Set(dealer.cars.map((c) => c.make))];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "2rem 1rem 4rem" }}>

      {/* Dealer header */}
      <div style={{ background: "#fff", border: "1px solid #E2E2E2", borderRadius: 16, padding: "28px 32px", marginBottom: 28 }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 16, background: "#fff3e8", color: "#E8490F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, flexShrink: 0 }}>
            {dealer.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
              <h1 style={{ fontWeight: 800, fontSize: "1.6rem", color: "#1A1A1A" }}>{dealer.name}</h1>
              {dealer.verified && (
                <span style={{ fontSize: 11, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 99, padding: "3px 10px", fontWeight: 600 }}>✓ Verified</span>
              )}
            </div>
            <p style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>📍 {dealer.address || dealer.location}</p>
            {dealer.description && <p style={{ color: "#555", fontSize: 14, lineHeight: 1.6, maxWidth: 600 }}>{dealer.description}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {dealer.phone && <a href={`tel:${dealer.phone}`} style={{ fontSize: 13, border: "1px solid #E2E2E2", borderRadius: 8, padding: "6px 14px", color: "#444", textDecoration: "none", fontWeight: 500 }}>📞 {dealer.phone}</a>}
              {dealer.whatsapp && <a href={`https://wa.me/${dealer.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8, padding: "6px 14px", color: "#16a34a", textDecoration: "none", fontWeight: 600 }}>💬 WhatsApp</a>}
              {dealer.email && <a href={`mailto:${dealer.email}`} style={{ fontSize: 13, border: "1px solid #E2E2E2", borderRadius: 8, padding: "6px 14px", color: "#444", textDecoration: "none" }}>✉️ {dealer.email}</a>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ v: dealer.cars.length, l: "Cars" }, { v: makes.length, l: "Makes" }].map(({ v, l }) => (
              <div key={l} style={{ textAlign: "center", background: "#F5F5F5", borderRadius: 12, padding: "12px 20px", minWidth: 72 }}>
                <p style={{ fontWeight: 800, fontSize: "1.4rem", color: "#E8490F" }}>{v}</p>
                <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Makes pills */}
      {makes.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {makes.map(make => (
            <span key={make} style={{ fontSize: 12, background: "#fff", border: "1px solid #E2E2E2", borderRadius: 99, padding: "4px 14px", color: "#555", fontWeight: 500 }}>{make}</span>
          ))}
        </div>
      )}

      {/* Cars grid */}
      <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#1A1A1A", marginBottom: 16 }}>Available inventory</h2>

      {dealer.cars.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E2E2E2", borderRadius: 16, padding: 48, textAlign: "center", color: "#999" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🚗</p>
          <p style={{ fontWeight: 600 }}>No cars listed yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
          {dealer.cars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.year} ${car.make} ${car.model}`;
            return (
              <Link key={car.id} href={`/cars/${car.id}`}
                style={{ background: "#fff", border: "1px solid #E2E2E2", borderRadius: 12, overflow: "hidden", textDecoration: "none", display: "block", transition: "transform 0.2s, box-shadow 0.2s" }}>
                <div style={{ aspectRatio: "16/10", background: "#f0ede8", overflow: "hidden" }}>
                  {img
                    ? <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 40 }}>🚗</div>
                  }
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>{title}</p>
                  {car.variant && <p style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{car.variant}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                    <p style={{ fontWeight: 800, fontSize: 16, color: "#E8490F" }}>{formatPrice(car.price)}</p>
                    {car.mileage && <p style={{ fontSize: 12, color: "#999" }}>{formatMileage(car.mileage)}</p>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
