// src/app/portal/leads/page.js
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import LeadManager from "@/components/LeadManager";

export const metadata = { title: "Lead Management — Motorke Portal" };

export default async function PortalLeadsPage({ searchParams }) {
  const user   = await requireDealer();
  const sp     = await searchParams;
  const status = sp.status || "";
  const search = sp.search || "";

  const where = {
    dealerId: user.dealerId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name:  { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const leads = await db.lead.findMany({
    where,
    include: {
      car:   { include: { images: { where: { isPrimary: true }, take: 1 } } },
      notes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await db.lead.groupBy({
    by:      ["status"],
    where:   { dealerId: user.dealerId },
    _count:  { id: true },
  });
  const countMap = Object.fromEntries(counts.map(c => [c.status, c._count.id]));
  const total    = leads.length;

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.5rem", color: "#1C1C1E" }}>Lead management</h1>
        <p style={{ color: "#6B7280", fontSize: 14, marginTop: 4 }}>{total} enquir{total !== 1 ? "ies" : "y"} total</p>
      </div>
      <LeadManager leads={leads.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        car: { ...l.car, images: l.car.images },
        notes: l.notes,
      }))} countMap={countMap} currentStatus={status} currentSearch={search} />
    </div>
  );
}