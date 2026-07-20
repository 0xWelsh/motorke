export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import AdminTrendsChart from "@/components/admin/AdminTrendsChart";
import AdminActionFeed from "@/components/admin/AdminActionFeed";
import RunWatchAlertsButton from "@/components/admin/RunWatchAlertsButton";
import RecacheHomepageButton from "@/components/admin/RecacheHomepageButton";
import { Car, Users, Bolt, Plus, UserCheck, TrendingUp } from "lucide-react";

export const metadata = { title: "Admin Dashboard | BIDGARI" };

export default async function AdminDashboard({ searchParams }) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const range = resolvedParams?.range || "30";
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startDate = new Date(0);
  let rangeLabel = "All Time";
  if (range === "7") {
    startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    rangeLabel = "7d";
  } else if (range === "30") {
    startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    rangeLabel = "30d";
  }

  const [
    totalCars, totalLeads, totalUsers,
    carsInRange, leadsInRange,
    inventoryValueAgg,
    carsToday, leadsToday, viewsToday,
    rawCarsForChart, rawLeadsForChart, rawViewsForChart,
    listingsThisWeek, listingsPrevWeek, leadsThisWeek, leadsPrevWeek,
    staleListings,
    recentCars, recentLeads, salesmenLeads, salesmenConversion,
  ] = await Promise.all([
    db.car.count({ where: { available: true } }),
    db.lead.count(),
    db.user.count(),
    db.car.count({ where: { createdAt: { gte: startDate } } }),
    db.lead.count({ where: { createdAt: { gte: startDate } } }),
    db.car.aggregate({ _sum: { price: true }, where: { available: true } }),
    db.car.count({ where: { createdAt: { gte: todayStart } } }),
    db.lead.count({ where: { createdAt: { gte: todayStart } } }),
    db.marketingEvent.count({ where: { createdAt: { gte: todayStart } } }),
    db.car.findMany({
      where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
    }),
    db.lead.findMany({
      where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
    }),
    db.marketingEvent.findMany({
      where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
    }),
    db.car.count({ where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
    db.car.count({
      where: {
        createdAt: {
          gte: new Date(now - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    db.lead.count({ where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
    db.lead.count({
      where: {
        createdAt: {
          gte: new Date(now - 14 * 24 * 60 * 60 * 1000),
          lt: new Date(now - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    db.car.count({
      where: {
        available: true,
        updatedAt: { lt: new Date(now - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.car.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, make: true, model: true, createdAt: true },
    }),
    db.lead.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    }),
    db.user.findMany({
      where: { role: "ADMIN", active: true },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            assignedLeads: {
              where: { status: { not: "DEAD" } },
            },
          },
        },
      },
    }),
    (async () => {
      const [soldRows, respRows] = await Promise.all([
        db.lead.groupBy({
      by: ["assignedToId"],
        where: { assignedToId: { not: null }, status: "SOLD" },
        _count: { id: true },
      }),
      db.lead.findMany({
        where: { assignedToId: { not: null } },
        select: {
          assignedToId: true,
          createdAt: true,
          notes: { take: 1, orderBy: { createdAt: "asc" }, select: { createdAt: true } },
        },
      }),
    ]);
    const soldMap = {};
    soldRows.forEach((r) => { soldMap[r.assignedToId] = r._count.id; });
    const respMap = {};
    respRows.forEach((l) => {
      if (l.notes.length > 0) {
        const hrs = (l.notes[0].createdAt.getTime() - l.createdAt.getTime()) / 3600000;
        if (!respMap[l.assignedToId]) respMap[l.assignedToId] = [];
        respMap[l.assignedToId].push(hrs);
      }
    });
    return { soldMap, respMap };
  })(),
  ]);

  const ago = (ts) => {
    if (!ts) return "never";
    const d = now.getTime() - ts;
    if (d < 60_000) return "now";
    const m = Math.floor(d / 60_000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  const fmt = (n) => {
    if (!n) return "0";
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return formatPrice(n);
  };

  const totalValue = inventoryValueAgg?._sum?.price || 0;

  // Salesman performance
  const salesmanPerformance = salesmenLeads.map((s) => {
    const total = s._count.assignedLeads;
    const sold = salesmenConversion.soldMap[s.id] || 0;
    const rate = total > 0 ? Math.round((sold / total) * 100) : 0;
    const hrsArr = salesmenConversion.respMap[s.id];
    const avgResp = hrsArr && hrsArr.length > 0
      ? Math.round(hrsArr.reduce((a, b) => a + b, 0) / hrsArr.length)
      : null;
    return { ...s, total, sold, rate, avgResp };
  });

  // Chart
  const chartMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const k = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    chartMap[k] = { date: k, cars: 0, leads: 0, views: 0 };
  }
  rawCarsForChart.forEach((c) => {
    const k = c.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    if (chartMap[k]) chartMap[k].cars += 1;
  });
  rawLeadsForChart.forEach((l) => {
    const k = l.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    if (chartMap[k]) chartMap[k].leads += 1;
  });
  rawViewsForChart.forEach((v) => {
    const k = v.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    if (chartMap[k]) chartMap[k].views += 1;
  });
  const chartData = Object.values(chartMap);

  const actions = [
    ...(staleListings > 0
      ? [{
          id: "stale",
          type: "stale",
          title: "Stale Inventory",
          subtitle: `${staleListings} listings untouched for 30+ days.`,
          href: "/admin/cars",
          timeAgo: "weekly",
          priority: "medium",
        }]
      : []),
    ...(leadsInRange > 100
      ? [{
          id: "leads",
          type: "lead",
          title: "High Lead Volume",
          subtitle: `${leadsInRange} leads in ${rangeLabel}.`,
          href: "/admin/leads",
          timeAgo: rangeLabel,
          priority: "low",
        }]
      : []),
  ];

  const activity = [
    ...recentCars.map((c) => ({
      id: `c-${c.id}`, type: "car", label: `${c.make} ${c.model}`,
      href: `/admin/cars/${c.id}/edit`, time: c.createdAt,
    })),
    ...recentLeads.map((l) => ({
      id: `l-${l.id}`, type: "lead", label: l.name || "Buyer",
      href: "/admin/leads", time: l.createdAt,
    })),
  ].sort((a, b) => b.time - a.time).slice(0, 8);

  const cG = listingsPrevWeek > 0
    ? Math.round(((listingsThisWeek - listingsPrevWeek) / listingsPrevWeek) * 100)
    : listingsThisWeek > 0 ? 100 : 0;

  const lG = leadsPrevWeek > 0
    ? Math.round(((leadsThisWeek - leadsPrevWeek) / leadsPrevWeek) * 100)
    : leadsThisWeek > 0 ? 100 : 0;

  const stat = (label, value, opts = {}) => (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold text-white tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</span>
        {opts.trend != null && (
          <span className={`text-xs font-bold tabular-nums ${opts.trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {opts.trend >= 0 ? "+" : ""}{opts.trend}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-1 rounded-lg bg-zinc-900/60 p-0.5">
          {[
            { v: "7", l: "7d" },
            { v: "30", l: "30d" },
            { v: "all", l: "All" },
          ].map((o) => (
            <Link
              key={o.v}
              href={`?range=${o.v}`}
              className={`rounded-md px-3 py-1 text-[11px] font-bold transition ${
                range === o.v
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {o.l}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {stat("Live Listings", totalCars)}
        {stat("Views Today", viewsToday)}
        {stat("Total Leads", totalLeads)}
        {stat("Leads Today", leadsToday, { trend: lG })}
        {stat("Added Today", carsToday, { trend: cG })}
        {stat("Stale", staleListings)}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Left - 3/4 */}
        <div className="lg:col-span-3 space-y-4">

          {/* Chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                All Metrics &middot; 30d
              </span>
            </div>
            <AdminTrendsChart data={chartData} />
          </div>

          {/* Activity */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="px-4 py-3 border-b border-zinc-800">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Recent Activity
              </span>
            </div>
            {activity.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {activity.map((e) => (
                  <Link
                    key={e.id}
                    href={e.href}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      e.type === "car" ? "bg-blue-950/40 text-blue-400" : "bg-emerald-950/40 text-emerald-400"
                    }`}>
                      {e.type === "car" ? <Car size={12} /> : <Users size={12} />}
                    </div>
                    <span className="flex-1 text-sm font-medium text-white truncate">{e.label}</span>
                    <span className="text-[11px] font-medium text-zinc-500 tabular-nums">{ago(e.time)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Right - 1/4 */}
        <div className="space-y-4">

          {/* Attention Queue */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Queue
              </span>
              <span className="text-[10px] font-bold text-zinc-500">{actions.length}</span>
            </div>
            <AdminActionFeed actions={actions} />
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Inventory Value</p>
              <p className="text-lg font-bold text-white mt-0.5 tabular-nums">{fmt(totalValue)}</p>
            </div>
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              {[
                { l: "Live Listings", v: totalCars },
                { l: "Users", v: totalUsers },
                { l: "Leads", v: totalLeads },
              ].map((s) => (
                <div key={s.l} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{s.l}</span>
                  <span className="text-xs font-bold text-white tabular-nums">{s.v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Salesman Performance */}
          {salesmanPerformance.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-zinc-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Salesman Performance</span>
              </div>
              <div className="space-y-3">
                {salesmanPerformance.map((s) => (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-300 font-medium">{s.name}</span>
                      <span className="text-xs font-bold text-white tabular-nums">{s.total} leads</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="text-emerald-400 font-bold tabular-nums">{s.sold} sold</span>
                      <span className={`font-bold tabular-nums ${s.rate >= 30 ? "text-emerald-400" : s.rate >= 10 ? "text-amber-400" : "text-zinc-500"}`}>
                        {s.rate}% conv.
                      </span>
                      {s.avgResp !== null && (
                        <span className="text-zinc-500 tabular-nums">
                          {s.avgResp < 1 ? `${Math.round(s.avgResp * 60)}m` : `${s.avgResp}h`} avg resp.
                        </span>
                      )}
                    </div>
                    {/* mini progress bar */}
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(s.rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Quick</span>
            <div className="grid grid-cols-2 gap-1.5">
              <Link
                href="/admin/cars/new"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[11px] font-bold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
              >
                <Plus size={14} /> Car
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-[11px] font-bold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors"
              >
                <Users size={14} /> Users
              </Link>
            </div>
            <RunWatchAlertsButton />
            <RecacheHomepageButton />
          </div>
        </div>
      </div>

      {/* Management links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { l: "Reports", h: "/api/admin/reports/network-weekly-pdf" },
          { l: "SEO Audit", h: "/admin/seo" },
          { l: "Users", h: "/admin/users" },
          { l: "Settings", h: "/admin/settings" },
        ].map((link) => (
          <Link
            key={link.h}
            href={link.h}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5 text-xs font-medium text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          >
            {link.l}
          </Link>
        ))}
      </div>

    </div>
  );
}
