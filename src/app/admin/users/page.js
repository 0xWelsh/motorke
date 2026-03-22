// src/app/admin/users/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db.user.findMany({
    include: { dealer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const s = { background: "#fff", border: "1px solid #E2E2E2", borderRadius: 14 };
  const roleColors = {
    ADMIN:  { bg: "#f3e8ff", color: "#7c3aed", border: "#d8b4fe" },
    DEALER: { bg: "#e8eef4", color: "#0A2640", border: "#c5d5e8" },
    BUYER:  { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0A2640" }}>
          Users <span style={{ fontWeight: 400, fontSize: "1rem", color: "#999" }}>({users.length})</span>
        </h1>
        <Link href="/admin/users/new" style={{ background: "#E8490F", color: "white", textDecoration: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13 }}>+ Create user</Link>
      </div>

      <div style={{ ...s, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F5F5", borderBottom: "1px solid #E2E2E2" }}>
              {["User", "Role", "Dealership", "Status", "Joined", "Actions"].map(h => (
                <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontWeight: 600, color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => {
              const rc = roleColors[user.role] || roleColors.BUYER;
              return (
                <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8490F", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, color: "#1A1A1A" }}>{user.name}</p>
                        <p style={{ fontSize: 11, color: "#999" }}>{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, borderRadius: 99, padding: "3px 10px", fontWeight: 600, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#555" }}>{user.dealer?.name || <span style={{ color: "#bbb" }}>—</span>}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, borderRadius: 99, padding: "3px 10px", fontWeight: 600, background: user.active ? "#dcfce7" : "#fef2f2", color: user.active ? "#16a34a" : "#dc2626" }}>
                      {user.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#999", fontSize: 12 }}>
                    {new Date(user.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <a href={`/admin/users/${user.id}/edit`} style={{ fontSize: 12, border: "1px solid #E2E2E2", borderRadius: 7, padding: "4px 10px", color: "#444", textDecoration: "none" }}>Edit</a>
                      <form action={`/api/admin/users/${user.id}/toggle`} method="POST" style={{ display: "inline" }}>
                        <button type="submit" style={{ fontSize: 12, border: `1px solid ${user.active ? "#fecaca" : "#bbf7d0"}`, borderRadius: 7, padding: "4px 10px", color: user.active ? "#dc2626" : "#16a34a", background: user.active ? "#fef2f2" : "#f0fdf4", cursor: "pointer", fontFamily: "inherit" }}>
                          {user.active ? "Suspend" : "Activate"}
                        </button>
                      </form>
                      <a href={`/admin/users/${user.id}/reset-password`} style={{ fontSize: 12, border: "1px solid #E2E2E2", borderRadius: 7, padding: "4px 10px", color: "#0A2640", textDecoration: "none" }}>Reset pw</a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#bbb" }}>No users yet</div>}
      </div>
    </div>
  );
}