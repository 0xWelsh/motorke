// src/app/portal/analytics/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Analytics — Motorke Portal" };

export default async function AnalyticsPage() {
  const user = await requireDealer();

  const subscription = await db.subscription.findUnique({ where: { dealerId: user.dealerId } });
  const isPro        = subscription?.plan === "PRO";

  if (!isPro) {
    return (
      <div style={{ padding: "28px 32px", maxWidth: 700 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#1C1C1E", marginBottom: 8 }}>Analytics</h1>
        <div style={{ background: "#FFFBEB", border: "1.5px solid #F59E0B", borderRadius: 16, padding: "40px 32px", textAlign: "center", marginTop: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 28 }}>
            🔒
          </div>
          <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#1C1C1E", marginBottom: 10 }}>Analytics is a Pro feature</h2>
          <p style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: "0 auto 28px" }}>
            Upgrade to Pro to see detailed performance data — views per listing, peak enquiry times, best performing makes, and conversion rates.
          </p>
          <Link href="/portal/billing" style={{ background: "#F59E0B", color: "#1C1C1E", textDecoration: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 800, fontSize: 14, display: "inline-block" }}>
            Upgrade to Pro — KSh 9,300/mo
          </Link>
        </div>
      </div>
    );
  }

  const now   = new Date();
  const week  = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const month = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [cars, leadsMonth, leadsWeek, viewsWeek] = await Promise.all([
    db.car.findMany({
      where: { dealerId: user.dealerId },
      include: { _count: { select: { leads: true } } },
      orderBy: { views: "desc" },
    }),
    db.lead.count({ where: { dealerId: user.dealerId, createdAt: { gte: month } } }),
    db.lead.count({ where: { dealerId: user.dealerId, createdAt: { gte: week }  } }),
    db.carView.count({ where: { car: { dealerId: user.dealerId }, viewedAt: { gte: week } } }),
  ]);

  const totalViews = cars.reduce((s, c) => s + c.views, 0);
  const totalLeads = cars.reduce((s, c) => s + c._count.leads, 0);
  const convRate   = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : "0.0";

  const s = { background: "#fff", border: "1px solid #E4E4E7", borderRadius: 14 };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#1C1C1E", marginBottom: 24 }}>Analytics</h1>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Total views",      value: totalViews,  sub: `+${viewsWeek} this week`,   color: "#F59E0B" },
          { label: "Total leads",      value: totalLeads,  sub: `+${leadsWeek} this week`,   color: "#10B981" },
          { label: "Conversion rate",  value: `${convRate}%`, sub: "views to leads",         color: "#3B82F6" },
          { label: "Leads this month", value: leadsMonth,  sub: "last 30 days",              color: "#1C1C1E" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{ ...s, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</p>
            <p style={{ fontSize: "2rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Per listing breakdown */}
      <div style={{ ...s, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #F7F8FA" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#1C1C1E" }}>Performance per listing</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F7F8FA" }}>
              {["Car", "Price", "Views", "Leads", "Conversion", "Status"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#6B7280", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cars.map((car, i) => {
              const rate = car.views > 0 ? ((car._count.leads / car.views) * 100).toFixed(1) : "0.0";
              return (
                <tr key={car.id} style={{ borderBottom: i < cars.length - 1 ? "1px solid #F7F8FA" : "none" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <p style={{ fontWeight: 600, color: "#1C1C1E" }}>{car.year} {car.make} {car.model}</p>
                    {car.variant && <p style={{ fontSize: 11, color: "#9CA3AF" }}>{car.variant}</p>}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#F59E0B" }}>{formatPrice(car.price)}</td>
                  <td style={{ padding: "12px 16px", color: "#1C1C1E", fontWeight: 600 }}>{car.views}</td>
                  <td style={{ padding: "12px 16px", color: "#1C1C1E", fontWeight: 600 }}>{car._count.leads}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 60, height: 5, background: "#F5F5F5", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(parseFloat(rate) * 10, 100)}%`, background: "#10B981", borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>{rate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 11, borderRadius: 99, padding: "3px 10px", fontWeight: 600, background: car.available ? "#dcfce7" : "#fef2f2", color: car.available ? "#166534" : "#991b1b" }}>
                      {car.available ? "Live" : "Hidden"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {cars.length === 0 && <p style={{ textAlign: "center", padding: 32, color: "#9CA3AF", fontSize: 13 }}>No listings yet</p>}
      </div>
    </div>
  );
}
