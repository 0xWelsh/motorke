// src/app/admin/cars/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import ClearAllButton from "@/components/ClearAllButton";

export const metadata = { title: "All Cars — Admin" };

export default async function AdminCarsPage({ searchParams }) {
  await requireAdmin();
  const sp       = await searchParams;
  const search   = sp.search   || "";
  const dealerId = sp.dealerId || "";
  const status   = sp.status   || "";
  const page     = parseInt(sp.page || "1");
  const limit    = 20;

  const where = {
    ...(search   && { OR: [
      { make:  { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ]}),
    ...(dealerId && { dealerId }),
    ...(status === "live"   && { available: true  }),
    ...(status === "hidden" && { available: false }),
  };

  const [cars, total, dealers] = await Promise.all([
    db.car.findMany({
      where,
      include: {
        dealer: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    db.car.count({ where }),
    db.dealer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const pages = Math.ceil(total / limit);
  const s = { background: "#fff", border: "1px solid #E2E2E2", borderRadius: 14 };
  const inputStyle = { background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 9, padding: "8px 13px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "#1A1A1A" };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0A2640" }}>
            All cars <span style={{ fontWeight: 400, fontSize: "1rem", color: "#999" }}>({total})</span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/cars/bulk" style={{ background: "#0A2640", color: "white", textDecoration: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13 }}>⬆ Bulk upload</Link>
          <ClearAllButton />
          <Link href="/admin/cars/new"  style={{ background: "#E8490F", color: "white", textDecoration: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13 }}>+ Add car</Link>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, padding: "14px 18px", background: "#fff", borderRadius: 12, border: "1px solid #E2E2E2" }}>
        <input name="search" defaultValue={search} placeholder="Search make / model…" style={{ ...inputStyle, minWidth: 180 }} />
        <select name="dealerId" defaultValue={dealerId} style={{ ...inputStyle }}>
          <option value="">All dealers</option>
          {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select name="status" defaultValue={status} style={{ ...inputStyle }}>
          <option value="">All statuses</option>
          <option value="live">Live only</option>
          <option value="hidden">Hidden only</option>
        </select>
        <button type="submit" style={{ background: "#0A2640", color: "white", border: "none", borderRadius: 9, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Filter</button>
        {(search || dealerId || status) && <a href="/admin/cars" style={{ color: "#E8490F", fontSize: 13, padding: "8px 4px", textDecoration: "none" }}>Clear ×</a>}
      </form>

      {/* Table */}
      <div style={{ ...s, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F5F5", borderBottom: "1px solid #E2E2E2" }}>
              {["Car", "Dealer", "Price", "Views", "Leads", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car, i) => (
              <tr key={car.id} style={{ borderBottom: i < cars.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 48, height: 36, borderRadius: 6, background: "#f0ede8", overflow: "hidden", flexShrink: 0 }}>
                      {car.images[0]
                        ? <img src={car.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 16 }}>🚗</div>
                      }
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#1A1A1A" }}>{car.year} {car.make} {car.model}</p>
                      {car.variant && <p style={{ fontSize: 11, color: "#999" }}>{car.variant}</p>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "#555" }}>{car.dealer.name}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#E8490F" }}>{formatPrice(car.price)}</td>
                <td style={{ padding: "12px 16px", color: "#555" }}>{car.views}</td>
                <td style={{ padding: "12px 16px", color: "#555" }}>{car._count.leads}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, borderRadius: 99, padding: "3px 10px", fontWeight: 600, background: car.available ? "#dcfce7" : "#f5f5f5", color: car.available ? "#16a34a" : "#999" }}>
                    {car.available ? "Live" : "Hidden"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                    <a href={`/admin/cars/${car.id}/edit`} style={{ fontSize: 12, border: "1px solid #E2E2E2", borderRadius: 7, padding: "4px 10px", color: "#444", textDecoration: "none", whiteSpace: "nowrap" }}>Edit</a>
                    <form action={`/api/admin/cars/${car.id}/toggle`} method="POST" style={{ display: "inline" }}>
                      <button type="submit" style={{ fontSize: 12, border: "1px solid #E2E2E2", borderRadius: 7, padding: "4px 10px", color: car.available ? "#666" : "#16a34a", background: "none", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        {car.available ? "Hide" : "Show"}
                      </button>
                    </form>
                    <a href={`/cars/${car.id}`} target="_blank" style={{ fontSize: 12, border: "1px solid #E2E2E2", borderRadius: 7, padding: "4px 10px", color: "#0A2640", textDecoration: "none" }}>View ↗</a>
                    <DeleteButton action={`/api/admin/cars/${car.id}/delete`} message="Delete this car permanently?" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cars.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#bbb" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🚗</p>
            <p>No cars found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <a key={p} href={`/admin/cars?page=${p}&search=${search}&dealerId=${dealerId}&status=${status}`}
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none", background: p === page ? "#E8490F" : "#fff", color: p === page ? "white" : "#555", border: p === page ? "none" : "1px solid #E2E2E2" }}>
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}