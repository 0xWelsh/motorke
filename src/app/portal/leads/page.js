// src/app/portal/leads/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import LeadManager from "@/components/LeadManager";

export const metadata = { title: "Leads — Motorke Portal" };

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
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900\">Leads</h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 sm:mt-2\">
          {total} active lead{total !== 1 ? "s" : ""}
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
