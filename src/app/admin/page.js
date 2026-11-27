export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import AdminTrendsChart from "@/components/admin/AdminTrendsChart";
import AdminActionFeed from "@/components/admin/AdminActionFeed";
import RunWatchAlertsButton from "@/components/admin/RunWatchAlertsButton";
import RecacheHomepageButton from "@/components/admin/RecacheHomepageButton";
import { SALESMAN_KEYS, FALLBACK_NUMBER } from "@/lib/salesman-whatsapp";
import {
  Car,
  Users,
  Plus,
  UserCheck,
  TrendingUp,
  Eye,
  MessageSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  SearchCheck,
  Settings,
  Activity,
} from "lucide-react";

export const metadata = { title: { absolute: "Admin Dashboard | BIDGARI" } };

const STAT_CONFIG = {
  listings: { Icon: Car, tile: "bg-blue-500/15 text-blue-400" },
  views: { Icon: Eye, tile: "bg-amber-500/15 text-amber-600" },
  leads: { Icon: MessageSquare, tile: "bg-emerald-500/15 text-emerald-600" },
  leadsToday: { Icon: UserCheck, tile: "bg-violet-500/15 text-violet-400" },
  addedToday: { Icon: Plus, tile: "bg-sky-500/15 text-sky-600" },
  stale: { Icon: Clock, tile: "bg-rose-500/15 text-rose-600" },
};

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
    salesmanSettings,
  ] = await Promise.all([
    db.car.count({ where: { available: true } }),
    db.lead.count(),
    db.user.count(),
    db.car.count({ where: { createdAt: { gte: startDate } } }),
    db.lead.count({ where: { createdAt: { gte: startDate } } }),
    db.car.aggregate({ _sum: { price: true }, where: { available: true } }),
    db.car.count({ where: { createdAt: { gte: todayStart } } }),
    db.lead.count({ where: { createdAt: { gte: todayStart } } }),
    db.marketingEvent.count({ where: { name: "view_car", createdAt: { gte: todayStart } } }),
    db.car.findMany({
      where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
      take: 1000,
    }),
    db.lead.findMany({
      where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
      take: 1000,
    }),
    db.marketingEvent.findMany({
      where: { name: "view_car", createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } },
      select: { createdAt: true },
      take: 20000,
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
    db.setting.findMany({
      where: { key: { in: SALESMAN_KEYS } },
      select: { key: true, value: true },
    }),
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

  // Chart — timezone-safe bucketing using YYYY-MM-DD keys
  function toDayKey(date) {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  function toLabel(dayKey) {
    const [, m, d] = dayKey.split("-");
    const month = new Date(Date.UTC(2024, Number(m) - 1)).toLocaleString("en-US", { month: "short" });
    return `${month} ${Number(d)}`;
  }

  const chartDays = 30;
  const chartMap = {};
  for (let i = 0; i < chartDays; i++) {
    const d = new Date(now.getTime() - (chartDays - 1 - i) * 24 * 60 * 60 * 1000);
    const k = toDayKey(d);
    chartMap[k] = { date: toLabel(k), cars: 0, leads: 0, views: 0, _key: k };
  }
  rawCarsForChart.forEach((c) => {
    const k = toDayKey(c.createdAt);
    if (chartMap[k]) chartMap[k].cars += 1;
  });
  rawLeadsForChart.forEach((l) => {
    const k = toDayKey(l.createdAt);
    if (chartMap[k]) chartMap[k].leads += 1;
  });
  rawViewsForChart.forEach((v) => {
    const k = toDayKey(v.createdAt);
    if (chartMap[k]) chartMap[k].views += 1;
  });
  const chartData = Object.values(chartMap).map(({ _key, ...rest }) => rest);

  const configuredSalesmanNumbers = salesmanSettings.filter((s) => s.value?.trim()).length;
  const activeWhatsappNumber =
    salesmanSettings.find((s) => s.value?.trim())?.value || FALLBACK_NUMBER;

  const actions = [
    ...(configuredSalesmanNumbers === 0
      ? [{
          id: "salesman-routing",
          type: "whatsapp",
          title: "All WhatsApp CTAs route to one number",
          subtitle: `No salesman numbers set — every tap deep-links to +${activeWhatsappNumber}. Add team numbers in Settings.`,
          href: "/admin/settings",
          timeAgo: "now",
          priority: "high",
        }]
      : configuredSalesmanNumbers < SALESMAN_KEYS.length
        ? [{
            id: "salesman-routing-partial",
            type: "whatsapp",
            title: "Some salesman numbers missing",
            subtitle: `${SALESMAN_KEYS.length - configuredSalesmanNumbers} of ${SALESMAN_KEYS.length} unset — CTA load isn't spread across the team.`,
            href: "/admin/settings",
            timeAgo: "now",
            priority: "low",
          }]
        : []),
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

  const stats = [
    { key: "listings", label: "Live Listings", value: totalCars },
    { key: "views", label: "Views Today", value: viewsToday },
    { key: "leads", label: "Total Leads", value: totalLeads },
    { key: "leadsToday", label: "Leads Today", value: leadsToday, trend: lG },
    { key: "addedToday", label: "Added Today", value: carsToday, trend: cG },
    { key: "stale", label: "Stale", value: staleListings },
  ];

  const legend = [
    { key: "cars", label: "Listings", dot: "bg-blue-400" },
    { key: "leads", label: "Leads", dot: "bg-emerald-400" },
    { key: "views", label: "Listing Views", dot: "bg-amber-400" },
  ];

  const managementLinks = [
    { label: "Reports", href: "/api/admin/reports/network-weekly-pdf", Icon: FileText },
    { label: "SEO Audit", href: "/admin/seo", Icon: SearchCheck },
    { label: "Users", href: "/admin/users", Icon: Users },
    { label: "Settings", href: "/admin/settings", Icon: Settings },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text">Dashboard</h1>
          <p className="mt-0.5 text-xs text-dim">Business overview at a glance.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-overlay p-1">
          {[
            { v: "7", l: "7d" },
            { v: "30", l: "30d" },
            { v: "all", l: "All" },
          ].map((o) => (
            <Link
              key={o.v}
              href={`?range=${o.v}`}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                range === o.v
                  ? "bg-emerald-600 text-white shadow-[0_2px_10px_rgba(16,185,129,0.35)]"
                  : "text-dim hover:text-text"
              }`}
            >
              {o.l}
            </Link>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => {
          const cfg = STAT_CONFIG[s.key];
          const Icon = cfg.Icon;
          return (
            <div
              key={s.key}
              className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-border"
            >
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                  {s.label}
                </p>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.tile}`}>
                  <Icon size={15} />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-text tabular-nums">
                  {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
                </span>
                {s.trend != null && (
                  <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                    s.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    {s.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(s.trend)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

        {/* Left - 3/4 */}
        <div className="space-y-4 lg:col-span-3">

          {/* Chart */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Activity size={14} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                  All Metrics &middot; 30d
                </span>
              </div>
              <div className="flex items-center gap-3">
                {legend.map((l) => (
                  <span key={l.key} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                    <span className={`h-2 w-2 rounded-full ${l.dot}`} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
            <AdminTrendsChart data={chartData} />
          </div>

          {/* Activity */}
          <div className="rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                Recent Activity
              </span>
              <Link href="/admin/cars" className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                View inventory
              </Link>
            </div>
            {activity.length > 0 ? (
              <div className="divide-y divide-border">
                {activity.map((e) => (
                  <Link
                    key={e.id}
                    href={e.href}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-overlay"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      e.type === "car" ? "bg-blue-500/10 text-blue-400" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {e.type === "car" ? <Car size={14} /> : <MessageSquare size={14} />}
                    </div>
                    <span className="flex-1 truncate text-sm font-medium text-text">{e.label}</span>
                    <span className="text-[11px] font-semibold text-dim tabular-nums">{ago(e.time)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-dim">No recent activity</p>
            )}
          </div>
        </div>

        {/* Right - 1/4 */}
        <div className="space-y-4">

          {/* Attention Queue */}
          <div className="rounded-2xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                Queue
              </span>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-bold text-emerald-600">
                {actions.length}
              </span>
            </div>
            <AdminActionFeed actions={actions} />
          </div>

          {/* Inventory value */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Inventory Value</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-text tabular-nums">{fmt(totalValue)}</p>
            <div className="mt-4 space-y-2.5 border-t border-border pt-4">
              {[
                { l: "Live Listings", v: totalCars, Icon: Car, cls: "bg-blue-500/10 text-blue-400" },
                { l: "Users", v: totalUsers, Icon: Users, cls: "bg-violet-500/10 text-violet-400" },
                { l: "Leads", v: totalLeads, Icon: MessageSquare, cls: "bg-emerald-50 text-emerald-600" },
              ].map((s) => (
                <div key={s.l} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs text-dim">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md ${s.cls}`}>
                      <s.Icon size={12} />
                    </span>
                    {s.l}
                  </span>
                  <span className="text-xs font-bold text-text tabular-nums">{s.v.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Salesman Performance */}
          {salesmanPerformance.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <TrendingUp size={14} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">
                  Salesman Performance
                </span>
              </div>
              <div className="space-y-4">
                {salesmanPerformance.map((s) => (
                  <div key={s.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text">{s.name}</span>
                      <span className="text-xs font-bold text-text tabular-nums">{s.total} leads</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="text-emerald-600 tabular-nums">{s.sold} sold</span>
                      <span className={`tabular-nums ${s.rate >= 30 ? "text-emerald-600" : s.rate >= 10 ? "text-amber-600" : "text-dim"}`}>
                        {s.rate}% conv.
                      </span>
                      {s.avgResp !== null && (
                        <span className="text-dim tabular-nums">
                          {s.avgResp < 1 ? `${Math.round(s.avgResp * 60)}m` : `${s.avgResp}h`} avg resp.
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-overlay">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all"
                        style={{ width: `${Math.min(s.rate, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-dim">Quick</span>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/admin/cars/new"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-[var(--bg)]/60 px-3 py-2.5 text-xs font-bold text-secondary transition-colors hover:border-emerald-500/40 hover:text-emerald-600"
              >
                <Plus size={14} /> Car
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-[var(--bg)]/60 px-3 py-2.5 text-xs font-bold text-secondary transition-colors hover:border-emerald-500/40 hover:text-emerald-600"
              >
                <Users size={14} /> Users
              </Link>
            </div>
            <div className="mt-2 space-y-2">
              <RunWatchAlertsButton />
              <RecacheHomepageButton />
            </div>
          </div>
        </div>
      </div>

      {/* Management links */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {managementLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3 text-xs font-semibold text-muted transition-colors hover:border-border hover:text-text"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-overlay text-muted">
              <link.Icon size={14} />
            </span>
            {link.label}
          </Link>
        ))}
      </div>

    </div>
  );
}
