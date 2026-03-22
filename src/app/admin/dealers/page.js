// src/app/admin/dealers/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";

export const metadata = { title: "Dealerships — Admin" };

export default async function AdminDealersPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    include: { _count: { select: { cars: true, users: true, leads: true } } },
    orderBy: { createdAt: "desc" },
  });

  const s = { background: "#fff", border: "1px solid #E2E2E2", borderRadius: 14 };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0A2640" }}>
          Dealerships <span style={{ fontWeight: 400, fontSize: "1rem", color: "#999" }}>({dealers.length})</span>
        </h1>
        <Link href="/admin/dealers/new" style={{ background: "#E8490F", color: "white", textDecoration: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13 }}>+ Add dealership</Link>
      </div>

      <div style={{ ...s, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F5F5", borderBottom: "1px solid #E2E2E2" }}>
              {["Dealership", "County", "Cars", "Users", "Leads", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dealers.map((dealer, i) => (
              <tr key={dealer.id} style={{ borderBottom: i < dealers.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: "#e8eef4", color: "#0A2640", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                      {dealer.name[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: "#1A1A1A" }}>{dealer.name}</p>
                      <p style={{ fontSize: 11, color: "#999" }}>{dealer.location}</p>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: "#555" }}>{dealer.county}</td>
                <td style={{ padding: "12px 16px", fontWeight: 700, color: "#E8490F" }}>{dealer._count.cars}</td>
                <td style={{ padding: "12px 16px", color: "#555" }}>{dealer._count.users}</td>
                <td style={{ padding: "12px 16px", color: "#555" }}>{dealer._count.leads}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {dealer.verified && <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>✓ Verified</span>}
                    {dealer.featured && <span style={{ fontSize: 10, background: "#fff3e8", color: "#E8490F", border: "1px solid #ffd0b0", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>⭐ Featured</span>}
                    {!dealer.verified && !dealer.featured && <span style={{ fontSize: 10, color: "#999" }}>Basic</span>}
                  </div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={`/admin/dealers/${dealer.id}/edit`} style={{ fontSize: 12, border: "1px solid #E2E2E2", borderRadius: 7, padding: "4px 10px", color: "#444", textDecoration: "none" }}>Edit</a>
                    {/* Toggle verified */}
                    <form action={`/api/admin/dealers/${dealer.id}/toggle-verified`} method="POST" style={{ display: "inline" }}>
                      <button type="submit" style={{ fontSize: 12, border: `1px solid ${dealer.verified ? "#E2E2E2" : "#bbf7d0"}`, borderRadius: 7, padding: "4px 10px", color: dealer.verified ? "#666" : "#16a34a", background: dealer.verified ? "#fff" : "#f0fdf4", cursor: "pointer", fontFamily: "inherit" }}>
                        {dealer.verified ? "Unverify" : "Verify ✓"}
                      </button>
                    </form>
                    {/* Toggle featured */}
                    <form action={`/api/admin/dealers/${dealer.id}/toggle-featured`} method="POST" style={{ display: "inline" }}>
                      <button type="submit" style={{ fontSize: 12, border: `1px solid ${dealer.featured ? "#E2E2E2" : "#ffd0b0"}`, borderRadius: 7, padding: "4px 10px", color: dealer.featured ? "#666" : "#E8490F", background: dealer.featured ? "#fff" : "#fff3e8", cursor: "pointer", fontFamily: "inherit" }}>
                        {dealer.featured ? "Unfeature" : "⭐ Feature"}
                      </button>
                    </form>
                    <a href={`/dealers/${dealer.slug}`} target="_blank" style={{ fontSize: 12, border: "1px solid #E2E2E2", borderRadius: 7, padding: "4px 10px", color: "#0A2640", textDecoration: "none" }}>View ↗</a>
                    {/* Delete — only if no cars */}
                    {dealer._count.cars === 0 && (
                      <DeleteButton action={`/api/admin/dealers/${dealer.id}/delete`} message="Delete this dealership and ALL their cars? Cannot be undone." label="Delete" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dealers.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>No dealerships yet</div>
        )}
      </div>
    </div>
  );
}