// src/app/admin/page.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Admin Dashboard — Motorke" };

export default async function AdminDashboard() {
  await requireAdmin();

  const now   = new Date();
  const week  = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const month = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalCars, totalDealers, totalLeads, totalUsers,
    carsThisWeek, leadsThisWeek, leadsThisMonth,
    recentLeads, topCars, recentCars,
    leadsByDealer, whatsappLeads, webLeads,
  ] = await Promise.all([
    db.car.count({ where: { available: true } }),
    db.dealer.count(),
    db.lead.count(),
    db.user.count({ where: { role: "BUYER" } }),
    db.car.count({ where: { createdAt: { gte: week } } }),
    db.lead.count({ where: { createdAt: { gte: week } } }),
    db.lead.count({ where: { createdAt: { gte: month } } }),
    db.lead.findMany({
      take: 6, orderBy: { createdAt: "desc" },
      include: { car: { select: { make: true, model: true, year: true } }, dealer: { select: { name: true } } },
    }),
    db.car.findMany({
      where: { available: true }, take: 5,
      orderBy: { views: "desc" },
      include: { images: { where: { isPrimary: true }, take: 1 }, dealer: { select: { name: true } } },
    }),
    db.car.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      include: { dealer: { select: { name: true } } },
    }),
    db.lead.groupBy({ by: ["dealerId"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
    db.lead.count({ where: { channel: "whatsapp" } }),
    db.lead.count({ where: { channel: "web" } }),
  ]);

  // Enrich leadsByDealer with dealer names
  const dealerIds   = leadsByDealer.map(l => l.dealerId);
  const dealerNames = await db.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, name: true } });
  const dealerMap   = Object.fromEntries(dealerNames.map(d => [d.id, d.name]));

  const s = { background: "#fff", border: "1px solid #E2E2E2", borderRadius: 14, padding: "20px 24px" };

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", color: "#0A2640" }}>Dashboard</h1>
        <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>Overview of Motorke activity</p>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Live listings",    value: totalCars,       sub: `+${carsThisWeek} this week`,  color: "#E8490F" },
          { label: "Dealerships",      value: totalDealers,    sub: "registered",                   color: "#0A2640" },
          { label: "Buyer enquiries",  value: totalLeads,      sub: `+${leadsThisWeek} this week`,  color: "#16a34a" },
          { label: "Buyer accounts",   value: totalUsers,      sub: "registered buyers",            color: "#7c3aed" },
          { label: "Enquiries (month)",value: leadsThisMonth,  sub: "last 30 days",                 color: "#0891b2" },
          { label: "WhatsApp leads",   value: whatsappLeads,   sub: `${webLeads} via web form`,     color: "#25D366" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={s}>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 8, fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { href: "/admin/cars/new",       label: "+ Add car",          bg: "#E8490F", color: "white" },
          { href: "/admin/cars/bulk",      label: "⬆ Bulk CSV upload",  bg: "#0A2640", color: "white" },
          { href: "/admin/dealers/new",    label: "+ Add dealership",   bg: "#fff",    color: "#0A2640", border: "1.5px solid #E2E2E2" },
          { href: "/admin/users/new",      label: "+ Create user",      bg: "#fff",    color: "#0A2640", border: "1.5px solid #E2E2E2" },
        ].map(({ href, label, bg, color, border }) => (
          <Link key={href} href={href} style={{ background: bg, color, border: border || "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, textDecoration: "none", display: "inline-block" }}>
            {label}
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>

        {/* ── TOP CARS BY VIEWS ── */}
        <div style={s}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0A2640" }}>Most viewed cars</h2>
            <Link href="/admin/cars" style={{ fontSize: 12, color: "#E8490F", textDecoration: "none" }}>View all →</Link>
          </div>
          {topCars.length === 0 ? (
            <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No cars yet — add your first listing</p>
          ) : topCars.map((car, i) => (
            <div key={car.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topCars.length - 1 ? "1px solid #F5F5F5" : "none" }}>
              <div style={{ width: 44, height: 33, borderRadius: 6, background: "#f0ede8", overflow: "hidden", flexShrink: 0 }}>
                {car.images[0] ? <img src={car.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 16 }}>🚗</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#1A1A1A" }}>{car.year} {car.make} {car.model}</p>
                <p style={{ fontSize: 11, color: "#999" }}>{car.dealer?.name}</p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#E8490F" }}>{formatPrice(car.price)}</p>
                <p style={{ fontSize: 11, color: "#999" }}>{car.views} views</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── RECENT ENQUIRIES ── */}
        <div style={s}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0A2640" }}>Recent enquiries</h2>
            <Link href="/admin/leads" style={{ fontSize: 12, color: "#E8490F", textDecoration: "none" }}>View all →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No enquiries yet</p>
          ) : recentLeads.map((lead, i) => (
            <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < recentLeads.length - 1 ? "1px solid #F5F5F5" : "none" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#1A1A1A" }}>{lead.name}</p>
                <p style={{ fontSize: 11, color: "#999" }}>{lead.car.year} {lead.car.make} {lead.car.model} · {lead.dealer.name}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 10, borderRadius: 99, padding: "2px 8px", fontWeight: 600, background: lead.channel === "whatsapp" ? "#dcfce7" : "#f0f0f0", color: lead.channel === "whatsapp" ? "#16a34a" : "#666" }}>
                  {lead.channel === "whatsapp" ? "WhatsApp" : "Web"}
                </span>
                <p style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>{new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

        {/* ── ENQUIRIES BY DEALER ── */}
        <div style={s}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0A2640", marginBottom: 16 }}>Enquiries by dealer</h2>
          {leadsByDealer.length === 0 ? (
            <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "24px 0" }}>No enquiries yet</p>
          ) : leadsByDealer.map(({ dealerId, _count }, i) => {
            const name  = dealerMap[dealerId] || "Unknown";
            const total = leadsByDealer.reduce((s, l) => s + l._count.id, 0);
            const pct   = total ? Math.round((_count.id / total) * 100) : 0;
            return (
              <div key={dealerId} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#333" }}>{name}</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2640" }}>{_count.id}</p>
                </div>
                <div style={{ height: 6, background: "#F5F5F5", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "#E8490F", borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── RECENTLY ADDED CARS ── */}
        <div style={s}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0A2640" }}>Recently added</h2>
            <Link href="/admin/cars/new" style={{ fontSize: 12, color: "#E8490F", textDecoration: "none" }}>+ Add car →</Link>
          </div>
          {recentCars.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <p style={{ color: "#bbb", fontSize: 13, marginBottom: 12 }}>No cars listed yet</p>
              <Link href="/admin/cars/new" style={{ background: "#E8490F", color: "white", borderRadius: 8, padding: "8px 18px", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>Add your first car</Link>
            </div>
          ) : recentCars.map((car, i) => (
            <div key={car.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < recentCars.length - 1 ? "1px solid #F5F5F5" : "none" }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: "#1A1A1A" }}>{car.year} {car.make} {car.model}</p>
                <p style={{ fontSize: 11, color: "#999" }}>{car.dealer?.name}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: "#E8490F" }}>{formatPrice(car.price)}</p>
                <span style={{ fontSize: 10, borderRadius: 99, padding: "2px 8px", background: car.available ? "#dcfce7" : "#f0f0f0", color: car.available ? "#16a34a" : "#999" }}>
                  {car.available ? "Live" : "Hidden"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}