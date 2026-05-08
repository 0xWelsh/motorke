// src/app/portal/leads/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import LeadManager from "@/components/LeadManager";

export const metadata = { title: "Leads — Welsh Motorhub Portal" };

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
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const newToday = leads.filter((lead) => new Date(lead.createdAt).getTime() >= startOfToday.getTime()).length;
  const unanswered = leads.filter((lead) => lead.status === "NEW").length;
  const followUpDue = leads.filter((lead) => {
    if (!["CONTACTED", "INTERESTED", "NEGOTIATING"].includes(lead.status)) return false;
    const lastTouch = lead.notes?.[0]?.createdAt
      ? new Date(lead.notes[0].createdAt).getTime()
      : new Date(lead.createdAt).getTime();
    return now - lastTouch > 48 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Leads</h1>
        <p className="text-[10px] uppercase font-black tracking-[0.12em] text-slate-700 font-medium mt-1">
          {total} active lead{total !== 1 ? "s" : ""} • {newToday} new today • {unanswered} unanswered • {followUpDue} follow-up due
        </p>
      </div>

      <LeadManager leads={leads.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        car: { ...l.car, images: l.car.images },
        notes: l.notes,
      }))}
        countMap={countMap}
        currentStatus={status}
        currentSearch={search}
        metrics={{ newToday, unanswered, followUpDue }}
      />
    </div>
  );
}
