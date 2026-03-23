// src/app/portal/inventory/page.js
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice, formatMileage } from "@/lib/utils";
import InventoryToggle from "@/components/InventoryToggle";

export const metadata = { title: "Inventory — Motorke Portal" };

export default async function InventoryPage({ searchParams }) {
  const user   = await requireDealer();
  const sp     = await searchParams;
  const filter = sp.filter || "all";

  const where = {
    dealerId: user.dealerId,
    ...(filter === "live"   && { available: true  }),
    ...(filter === "sold"   && { available: false }),
  };

  const cars = await db.car.findMany({
    where,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const [liveCount, soldCount, totalCount] = await Promise.all([
    db.car.count({ where: { dealerId: user.dealerId, available: true  } }),
    db.car.count({ where: { dealerId: user.dealerId, available: false } }),
    db.car.count({ where: { dealerId: user.dealerId } }),
  ]);

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#1C1C1E" }}>Inventory</h1>
          <p style={{ color: "#6B7280", fontSize: 14, marginTop: 4 }}>{totalCount} total · {liveCount} live · {soldCount} sold</p>
        </div>
        <a href="/portal/cars/new" style={{ background: "#F59E0B", color: "#1C1C1E", textDecoration: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 700, fontSize: 13 }}>
          + Add car
        </a>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", border: "1px solid #E4E4E7", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {[
          { key: "all",  label: "All",       count: totalCount },
          { key: "live", label: "Available",  count: liveCount  },
          { key: "sold", label: "Sold/Hidden",count: soldCount  },
        ].map(({ key, label, count }) => (
          <a key={key} href={`/portal/inventory?filter=${key}`}
            style={{ padding: "7px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: "none", transition: "all 0.15s",
              background: filter === key ? "#1C1C1E" : "transparent",
              color:      filter === key ? "white"   : "#6B7280",
            }}>
            {label} <span style={{ opacity: 0.6, fontSize: 11 }}>({count})</span>
          </a>
        ))}
      </div>

      {/* Cars grid */}
      {cars.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #E4E4E7", borderRadius: 14, padding: 48, textAlign: "center", color: "#9CA3AF" }}>
          <p style={{ fontSize: 13 }}>No cars in this category</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {cars.map(car => (
            <div key={car.id} style={{ background: "#fff", border: "1.5px solid #E4E4E7", borderRadius: 12, overflow: "hidden" }}>
              {/* Image */}
              <div style={{ position: "relative", aspectRatio: "16/10", background: "#F7F8FA" }}>
                {car.images[0]
                  ? <img src={car.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 36 }}>🚗</div>
                }
                <span style={{
                  position: "absolute", top: 10, left: 10,
                  fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "3px 10px",
                  background: car.available ? "#dcfce7" : "#fef2f2",
                  color:      car.available ? "#166534" : "#991b1b",
                }}>
                  {car.available ? "Live" : "Hidden"}
                </span>
                {car.featured && (
                  <span style={{ position: "absolute", top: 10, right: 10, fontSize: 10, fontWeight: 700, borderRadius: 99, padding: "3px 10px", background: "#FEF3C7", color: "#92400e" }}>
                    Featured
                  </span>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "14px 16px" }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1C1C1E" }}>{car.year} {car.make} {car.model}</p>
                {car.variant && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{car.variant}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#F59E0B" }}>{formatPrice(car.price)}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF" }}>{car.views} views · {car._count.leads} leads</p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "10px 16px 14px", borderTop: "1px solid #F7F8FA", display: "flex", gap: 8 }}>
                <a href={`/portal/cars/${car.id}/edit`} style={{ flex: 1, textAlign: "center", padding: "7px", border: "1.5px solid #E4E4E7", borderRadius: 8, color: "#1C1C1E", textDecoration: "none", fontWeight: 600, fontSize: 12 }}>
                  Edit
                </a>
                <InventoryToggle carId={car.id} available={car.available} />
                <a href={`/cars/${car.id}`} target="_blank" style={{ padding: "7px 12px", border: "1.5px solid #E4E4E7", borderRadius: 8, color: "#6B7280", textDecoration: "none", fontSize: 12 }}>
                  ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}