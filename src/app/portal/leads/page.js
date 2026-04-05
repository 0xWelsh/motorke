// src/app/portal/leads/page.js
export const dynamic = "force-dynamic";
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
    <div className="animate-in fade-in duration-700 max-w-7xl">
      <div className="mb-12">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 mb-2 block">Customer Relations</span>
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Leads & Inquiries</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 flex items-center gap-2">
          {total} Active Enquir{total !== 1 ? "ies" : "y"} Under Management
        </p>
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
