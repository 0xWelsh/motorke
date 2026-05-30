export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isGrowthAgentConfigured } from "@/lib/growth-agent-client";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import GrowthAgentPanel from "@/components/admin/GrowthAgentPanel";

export const metadata = { title: "Growth | Welsh Motorhub Admin" };

export default async function AdminGrowthPage() {
  await requireAdmin();

  const configured = isGrowthAgentConfigured();

  let prospects = [];
  let statusCounts = [];

  try {
    [prospects, statusCounts] = await Promise.all([
      db.growthProspect.findMany({
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: {
          matchedDealer: { select: { name: true, slug: true } },
        },
      }),
      db.growthProspect.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);
  } catch (err) {
    console.error("[admin/growth] load failed (run migrate deploy?):", err?.message || err);
  }

  const total = statusCounts.reduce((n, row) => n + row._count._all, 0);
  const contacted =
    statusCounts.find((r) => r.status === "CONTACTED")?._count._all || 0;
  const interested =
    statusCounts.find((r) => r.status === "INTERESTED")?._count._all || 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Welsh MotorHub Growth Agent"
        title="Dealer acquisition"
        description="Discover showrooms, collect contacts, log outreach, monitor stock changes, and export leads for your sales pipeline."
        stats={[
          { label: "Prospects", value: total },
          { label: "Contacted", value: contacted, tone: "text-amber-700 dark:text-amber-300" },
          { label: "Interested", value: interested, tone: "text-emerald-700 dark:text-emerald-300" },
        ]}
      />

      <GrowthAgentPanel configured={configured} prospects={prospects} />
    </div>
  );
}
