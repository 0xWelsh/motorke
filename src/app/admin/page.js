export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import AdminTrendsChart from "@/components/admin/AdminTrendsChart";
import AdminOverviewPieChart from "@/components/admin/AdminOverviewPieChart";
import RunWatchAlertsButton from "@/components/admin/RunWatchAlertsButton";
import { getGoSearchShadowMetrics } from "@/lib/go-search";
import { 
  Car, Building2, MessageSquare, Users, ChevronRight,
  Plus, Activity, Bolt, AlertCircle, ShieldAlert, BadgeCheck, ServerCog,
  FileDown,
} from "lucide-react";
import AdminActionFeed from "@/components/admin/AdminActionFeed";
import AdminSparkline from "@/components/admin/AdminSparkline";

export const metadata = { title: "Admin Dashboard | Welsh Motorhub" };

export default async function AdminDashboard({ searchParams }) {
  await requireAdmin();

  const resolvedParams = await searchParams;
  const range = resolvedParams?.range || "30"; // "7", "30", "all"
  const now = new Date();
  
  let startDate = new Date(0); // All time
  let rangeLabel = "All Time";
  if (range === "7") {
    startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    rangeLabel = "Last 7 Days";
  } else if (range === "30") {
    startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
    rangeLabel = "Last 30 Days";
  }

  const [
    totalCars, totalDealers, totalLeads, totalUsers,
    carsInRange, leadsInRange, 
    inventoryValueAgg, pendingDealers, pendingDealersCount, carsToday, leadsToday,
    premiumSubs, freeSubs,
    rawCarsForChart, rawLeadsForChart,
    listingsThisWeek, listingsPrevWeek, leadsThisWeek, leadsPrevWeek, activeListings, staleListings, respondedThisWeek,
    trackingEvents7d, trackingEvents30d, trackingTopEvents
  ] = await Promise.all([
    db.car.count({ where: { available: true } }),
    db.dealer.count(),
    db.lead.count(),
    db.user.count({ where: { role: "BUYER" } }),
    db.car.count({ where: { createdAt: { gte: startDate } } }),
    db.lead.count({ where: { createdAt: { gte: startDate } } }),
    db.car.aggregate({ _sum: { price: true }, where: { available: true } }),
    db.dealer.findMany({ where: { verified: false }, take: 6, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true } }),
    db.dealer.count({ where: { verified: false } }),
    db.car.count({ where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
    db.lead.count({ where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }),
    db.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    db.subscription.count({ where: { plan: "FREE", status: "ACTIVE" } }),
    db.car.findMany({ where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } }, select: { createdAt: true } }),
    db.lead.findMany({ where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } }, select: { createdAt: true } }),
    db.car.count({ where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
    db.car.count({ where: { createdAt: { gte: new Date(now - 14 * 24 * 60 * 60 * 1000), lt: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
    db.lead.count({ where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
    db.lead.count({ where: { createdAt: { gte: new Date(now - 14 * 24 * 60 * 60 * 1000), lt: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
    db.car.count({ where: { available: true } }),
    db.car.count({ where: { available: true, updatedAt: { lt: new Date(now - 30 * 24 * 60 * 60 * 1000) } } }),
    db.lead.count({ where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }, status: { not: "NEW" } } }),
    db.marketingEvent.count({ where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } }),
    db.marketingEvent.count({ where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } } }),
    db.marketingEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    }),
  ]);

  const ago = (ts) => {
    if (!ts) return "never";
    const deltaMs = now.getTime() - ts;
    if (deltaMs < 60_000) return "just now";
    const mins = Math.floor(deltaMs / 60_000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatCompact = (num) => {
    if (!num) return "0";
    if (num >= 1e9) return `KSh ${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `KSh ${(num / 1e6).toFixed(1)}M`;
    return formatPrice(num);
  };
  const totalValue = inventoryValueAgg?._sum?.price || 0;

  // Chart & Sparkline Aggregation
  const chartMap = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString('en-US', { day: "numeric", month: "short" });
    chartMap[dateStr] = { date: dateStr, cars: 0, leads: 0 };
  }
  rawCarsForChart.forEach(c => {
    const key = c.createdAt.toLocaleDateString('en-US', { day: "numeric", month: "short" });
    if (chartMap[key]) chartMap[key].cars += 1;
  });
  rawLeadsForChart.forEach(l => {
    const key = l.createdAt.toLocaleDateString('en-US', { day: "numeric", month: "short" });
    if (chartMap[key]) chartMap[key].leads += 1;
  });
  const chartData = Object.values(chartMap);
  const carsTrend = chartData.map(d => d.cars);
  const leadsTrend = chartData.map(d => d.leads);

  // Actions for the Action Center
  const actions = [
    ...pendingDealers.map(d => ({
      id: `dealer-${d.id}`,
      type: 'approval',
      title: 'New Dealer Approval',
      subtitle: `${d.name} has registered and is waiting for account verification.`,
      href: `/admin/dealers/${d.id}`,
      timeAgo: ago(d.createdAt),
      priority: 'high'
    })),
    ...(staleListings > 0 ? [{
      id: 'stale-listings',
      type: 'stale',
      title: 'Stale Inventory Audit',
      subtitle: `${staleListings} listings have not been updated in over 30 days.`,
      href: '/admin/cars?filter=stale',
      timeAgo: 'Weekly',
      priority: 'medium'
    }] : []),
    ...(leadsInRange > 100 ? [{
      id: 'lead-growth',
      type: 'lead',
      title: 'High Performance Alert',
      subtitle: `The platform generated ${leadsInRange} leads in ${rangeLabel.toLowerCase()}.`,
      href: '/admin/leads',
      timeAgo: 'Performance',
      priority: 'low'
    }] : []),
  ];

  const goSearchShadow = getGoSearchShadowMetrics();
  const mrr = premiumSubs * 45000;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* ── HEADER & RANGE ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
             Control Center
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-zinc-400">
            Real-time platform signals and operational tasks.
          </p>
        </div>
        
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-zinc-900/50">
          {[
            { v: "7", label: "7D" },
            { v: "30", label: "30D" },
            { v: "all", label: "All Time" }
          ].map(opt => (
            <Link 
              key={opt.v} href={`?range=${opt.v}`} 
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                range === opt.v
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-emerald-600 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── MAIN CONTENT: ACTION CENTER & TRENDS ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Action Center Feed */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500 flex items-center gap-2">
                <ShieldAlert size={14} className="text-emerald-500" />
                Action Queue
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                {actions.length} {actions.length === 1 ? 'task' : 'tasks'} remaining
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50">
              <AdminActionFeed actions={actions} />
            </div>
          </section>

          {/* Core Analytics Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Listings</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">{totalCars.toLocaleString()}</h4>
                  <span className="text-xs font-bold text-emerald-600">+{carsInRange}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 opacity-40 group-hover:opacity-100 transition-opacity">
                <AdminSparkline data={carsTrend} width={400} height={60} color="#10b981" fill />
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buyer Leads</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-slate-900 dark:text-white">{totalLeads.toLocaleString()}</h4>
                  <span className="text-xs font-bold text-blue-600">+{leadsInRange}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 opacity-40 group-hover:opacity-100 transition-opacity">
                <AdminSparkline data={leadsTrend} width={400} height={60} color="#3b82f6" fill />
              </div>
            </div>
          </section>

          {/* Secondary Trends Chart */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <AdminTrendsChart data={chartData} rangeLabel={rangeLabel} />
          </section>
        </div>

        {/* ── SIDEBAR: PERFORMANCE & QUICK LINKS ── */}
        <div className="space-y-8">
          
          {/* Revenue & Growth Snapshot */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Market Health</h3>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Estimated MRR</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCompact(mrr)}</p>
                <div className="mt-2 flex items-center gap-1">
                  <div className="h-1 flex-1 rounded-full bg-emerald-500" style={{ width: `${(premiumSubs / (premiumSubs + freeSubs || 1)) * 100}%` }} />
                  <div className="h-1 flex-[3] rounded-full bg-slate-100 dark:bg-zinc-800" />
                </div>
                <p className="mt-2 text-[10px] font-bold text-slate-400">
                  {premiumSubs} Premium · {freeSubs} Free
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Inventory Value</p>
                  <Bolt size={14} className="text-amber-500" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatCompact(totalValue)}</p>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-zinc-900">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">Search Accuracy</p>
                  <ServerCog size={14} className={goSearchShadow.flags.shadowEnabled ? "text-emerald-500" : "text-slate-300"} />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {(100 - goSearchShadow.rates.mismatchRate).toFixed(1)}%
                </p>
              </div>
            </div>
          </section>

          {/* Quick Management Links */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Management</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: "Marketplace Reports", href: "/api/admin/reports/network-weekly-pdf", Icon: FileDown },
                { label: "Technical SEO Audit", href: "/admin/seo", Icon: Activity },
                { label: "User Management", href: "/admin/users", Icon: Users },
                { label: "System Maintenance", href: "/admin/settings", Icon: Bolt },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-emerald-500/30 hover:bg-white dark:border-zinc-900 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
                >
                  <div className="flex items-center gap-3">
                    <link.Icon size={18} className="text-slate-400 group-hover:text-emerald-500" />
                    <span className="text-sm font-bold text-slate-700 dark:text-zinc-200">{link.label}</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-300" />
                </Link>
              ))}
            </div>
          </section>

          {/* Admin Tools */}
          <div className="flex flex-wrap gap-2">
            <RunWatchAlertsButton />
          </div>
        </div>
      </div>
    </div>
  );
}
