export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Car,
  MessageSquare,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import GrowthCharts from "@/components/admin/GrowthCharts";

export const metadata = { title: "Growth | Welsh Motorhub Admin" };

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function bucketByWeek(items, dateKey, weeks) {
  const buckets = weeks.map((w) => ({ ...w, count: 0 }));
  const weekMap = new Map(buckets.map((b) => [b.start.getTime(), b]));
  for (const item of items) {
    const start = getWeekStart(item[dateKey]).getTime();
    const b = weekMap.get(start);
    if (b) b.count++;
  }
  return buckets;
}

export default async function AdminGrowthPage() {
  await requireAdmin();

  const now = new Date();
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - (i * 7 + 6));
    weeks.push({ label: start.toLocaleDateString("en-KE", { month: "short", day: "numeric" }), start: getWeekStart(start) });
  }

  const twelveWeeksAgo = weeks[0].start;

  const [
    totalCars,
    activeCars,
    totalLeads,
    totalUsers,
    soldCars,
    recentCars,
    recentLeads,
    recentViews,
    recentUsers,
    recentSaves,
    leadStatusBreakdown,
    leadChannelBreakdown,
    topMakes,
  ] = await Promise.all([
    db.car.count(),
    db.car.count({ where: { available: true } }),
    db.lead.count(),
    db.user.count(),
    db.car.count({ where: { NOT: { soldAt: null } } }),
    db.car.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true } }),
    db.lead.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true, status: true, channel: true } }),
    db.carView.findMany({ where: { viewedAt: { gte: twelveWeeksAgo } }, select: { viewedAt: true } }),
    db.user.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true } }),
    db.savedCar.findMany({ where: { createdAt: { gte: twelveWeeksAgo } }, select: { createdAt: true } }),
    db.lead.groupBy({ by: ["status"], _count: true }),
    db.lead.groupBy({ by: ["channel"], _count: true }),
    db.lead.groupBy({
      by: ["carId"],
      _count: true,
      orderBy: { _count: { carId: "desc" } },
      take: 10,
    }).then(async (groups) => {
      const cars = await db.car.findMany({
        where: { id: { in: groups.map((g) => g.carId) } },
        select: { id: true, make: true },
      });
      const carMap = new Map(cars.map((c) => [c.id, c.make]));
      return groups.map((g) => ({
        make: carMap.get(g.carId) || "Unknown",
        count: g._count,
      }));
    }),
  ]);

  const carBuckets = bucketByWeek(recentCars, "createdAt", weeks);
  const leadBuckets = bucketByWeek(recentLeads, "createdAt", weeks);
  const viewBuckets = bucketByWeek(recentViews, "viewedAt", weeks);
  const userBuckets = bucketByWeek(recentUsers, "createdAt", weeks);
  const saveBuckets = bucketByWeek(recentSaves, "createdAt", weeks);

  const weeklyChart = weeks.map((w, i) => ({
    date: w.label,
    cars: carBuckets[i].count,
    leads: leadBuckets[i].count,
    views: viewBuckets[i].count,
  }));

  const userChart = weeks.map((w, i) => ({
    date: w.label,
    signups: userBuckets[i].count,
    saves: saveBuckets[i].count,
  }));

  const statusPipeline = ["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "SOLD", "DEAD"]
    .map((s) => ({
      status: s,
      count: leadStatusBreakdown.find((r) => r.status === s)?._count || 0,
    }));

  const channelBreakdown = leadChannelBreakdown.map((r) => ({
    channel: r.channel,
    count: r._count,
  }));

  const recentActivity = await db.$transaction(async (tx) => {
    const recentLeadsList = await tx.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, status: true, createdAt: true },
    });
    const recentCarsList = await tx.car.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, make: true, model: true, year: true, available: true, createdAt: true },
    });
    const recentUsersList = await tx.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, role: true, createdAt: true },
    });
    const events = [
      ...recentLeadsList.map((l) => ({ type: "lead", label: `${l.name} — ${l.status}`, time: l.createdAt, id: l.id, href: "/admin/leads" })),
      ...recentCarsList.map((c) => ({ type: "car", label: `${c.year} ${c.make} ${c.model}${c.available ? "" : " (sold)"}`, time: c.createdAt, id: c.id, href: `/admin/cars/${c.id}/edit` })),
      ...recentUsersList.map((u) => ({ type: "user", label: `${u.name} (${u.role})`, time: u.createdAt, id: u.id, href: `/admin/users/${u.id}/edit` })),
    ];
    events.sort((a, b) => b.time.getTime() - a.time.getTime());
    return events.slice(0, 20);
  });

  const conversionRate = totalLeads > 0
    ? Math.round((soldCars / totalLeads) * 100)
    : 0;

  const KPIs = [
    { label: "Total Listings", value: totalCars, icon: Car, href: "/admin/cars" },
    { label: "Active", value: activeCars, icon: TrendingUp, accent: true, href: "/admin/cars?status=AVAILABLE" },
    { label: "Leads", value: totalLeads, icon: MessageSquare, href: "/admin/leads" },
    { label: "Users", value: totalUsers, icon: Users, href: "/admin/users" },
    { label: "Sold", value: soldCars, icon: ArrowUpRight, accent: true, href: "/admin/cars?status=SOLD" },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">Growth</h1>
        <p className="mt-1 text-[11px] text-zinc-500">Company-wide trends and performance metrics.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {KPIs.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{kpi.label}</span>
              <kpi.icon size={14} className={kpi.accent ? "text-emerald-500" : "text-zinc-400"} />
            </div>
            <p className="text-xl font-black text-white">{kpi.value}</p>
          </Link>
        ))}
      </div>

      {/* Main Chart */}
      <GrowthCharts weeklyChart={weeklyChart} userChart={userChart} statusPipeline={statusPipeline} channelBreakdown={channelBreakdown} />

      {/* Bottom row: top makes + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top makes by leads */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Top Makes by Leads</h3>
          <div className="space-y-1">
            {topMakes.slice(0, 5).map((m, i) => {
              const maxCount = Math.max(...topMakes.slice(0, 5).map((t) => t.count));
              const pct = maxCount > 0 ? (m.count / maxCount) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 text-[11px] font-bold text-zinc-500">{i + 1}.</span>
                  <span className="flex-1 text-xs font-semibold text-white truncate">{m.make}</span>
                  <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{m.count}</span>
                  <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {topMakes.length === 0 && (
              <p className="text-xs text-zinc-600 py-4 text-center">No lead data yet.</p>
            )}
          </div>
        </div>

        {/* Conversion rate + channel summary */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Conversion & Channels</h3>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-black text-white">{conversionRate}%</span>
            <span className="text-[11px] text-zinc-500">lead-to-sale</span>
          </div>
          <div className="space-y-1.5">
            {channelBreakdown.map((c) => {
              const maxChannel = Math.max(...channelBreakdown.map((x) => x.count));
              const pct = maxChannel > 0 ? (c.count / maxChannel) * 100 : 0;
              return (
                <div key={c.channel} className="flex items-center gap-2">
                  <span className="w-16 text-[10px] font-bold uppercase text-zinc-500 truncate">{c.channel}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500/60" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{c.count}</span>
                </div>
              );
            })}
            {channelBreakdown.length === 0 && (
              <p className="text-xs text-zinc-600 py-4 text-center">No channel data yet.</p>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Recent Activity</h3>
          <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
            {recentActivity.map((evt) => {
              const timeAgo = Math.floor((Date.now() - evt.time.getTime()) / 1000 / 60);
              const ago = timeAgo < 1 ? "now" : timeAgo < 60 ? `${timeAgo}m` : `${Math.floor(timeAgo / 60)}h`;
              const dotColor = evt.type === "lead" ? "bg-emerald-500" : evt.type === "car" ? "bg-blue-500" : "bg-zinc-500";
              return (
                <Link
                  key={`${evt.type}-${evt.id}`}
                  href={evt.href}
                  className="flex items-center gap-2 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors group"
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                  <span className="flex-1 truncate">{evt.label}</span>
                  <span className="shrink-0 text-[10px] font-semibold text-zinc-600">{ago}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
