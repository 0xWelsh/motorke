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
import PdfBlobDownloadButton from "@/components/PdfBlobDownloadButton";

export const metadata = { title: "Admin Dashboard — Welsh Motorhub" };

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
    db.dealer.findMany({ where: { verified: false }, take: 4, select: { id: true, name: true, createdAt: true } }),
    db.dealer.count({ where: { verified: false } }),
    db.car.count({ where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }), // cars added today
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

  const formatCompact = (num) => {
    if (!num) return "0";
    if (num >= 1e9) return `KSh ${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `KSh ${(num / 1e6).toFixed(1)}M`;
    return formatPrice(num);
  };
  const totalValue = inventoryValueAgg?._sum?.price || 0;

  // Chart Aggregation (Last 30 days hardcoded for chart context)
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

  // MRR Mock based on Premium subs
  const setting = await db.setting.findFirst({ where: { key: "platform_fee" } });
  const platformFee = Number(setting?.value || 45000);
  const mrr = premiumSubs * platformFee;
  const goSearchShadow = getGoSearchShadowMetrics();
  const leadsPerActiveListing = activeListings > 0 ? (leadsThisWeek / activeListings).toFixed(3) : "0.000";
  const responseRate = leadsThisWeek > 0 ? ((respondedThisWeek / leadsThisWeek) * 100).toFixed(1) : "0.0";
  const staleRatio = activeListings > 0 ? ((staleListings / activeListings) * 100).toFixed(1) : "0.0";
  const listingDelta = listingsPrevWeek > 0 ? (((listingsThisWeek - listingsPrevWeek) / listingsPrevWeek) * 100).toFixed(1) : "100.0";
  const leadDelta = leadsPrevWeek > 0 ? (((leadsThisWeek - leadsPrevWeek) / leadsPrevWeek) * 100).toFixed(1) : "100.0";

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

  const pieData = [
    { name: "Active listings", value: activeListings, color: "#2F855A" },
    { name: "Stale listings", value: staleListings, color: "#dc2626" },
    { name: "Pending approvals", value: pendingDealersCount, color: "#ef4444" },
    { name: "Leads (7d)", value: leadsThisWeek, color: "#2563eb" },
  ];

  const subscriptionPie = [
    { name: "Premium", value: premiumSubs, color: "#2F855A" },
    { name: "Free", value: freeSubs, color: "#94a3b8" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">System administration</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
             Platform overview
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Marketplace analytics and items that need your attention.</p>
        </div>
        
        {/* Date Range Toggle */}
        <div className="flex items-center justify-start lg:justify-end w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <RunWatchAlertsButton />
            <div className="flex w-full items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 p-1 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900">
            {[
              { v: "7", label: "7 days" },
              { v: "30", label: "30 days" },
              { v: "all", label: "All time" }
            ].map(opt => (
              <Link 
                key={opt.v} href={`?range=${opt.v}`} 
                className={`rounded-md px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                  range === opt.v
                    ? "bg-white text-emerald-700 shadow-sm dark:bg-emerald-600/25 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-500/40"
                    : "text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </Link>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">
        {[
          { href: "/admin/cars/new", label: "Add Car", Icon: Car },
          { href: "/admin/dealers/new", label: "Add Dealer", Icon: Building2 },
          { href: "/admin/approvals", label: "Approvals", Icon: ShieldAlert },
          { href: "/admin/users", label: "Users", Icon: Users },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex h-11 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-emerald-500/40 hover:text-emerald-700 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-200 dark:hover:text-emerald-400"
          >
            <span className="truncate">{label}</span>
            <Icon size={15} />
          </Link>
        ))}
      </div>

      {/* ── TODAY SNAPSHOT ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-8 sm:mb-10">
        {[
          { label: "Cars added today", value: carsToday, valueClass: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200/80 dark:border-emerald-900/50" },
          { label: "Leads today", value: leadsToday, valueClass: "text-blue-600 dark:text-blue-400", border: "border-blue-200/80 dark:border-blue-900/50" },
          {
            label: "Pending approvals",
            value: pendingDealersCount,
            valueClass: pendingDealersCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-500",
            border: pendingDealersCount > 0 ? "border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20" : "border-slate-200 dark:border-zinc-800",
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl border bg-white px-4 py-3 dark:bg-zinc-950 ${item.border}`}>
            <p className="mb-1 text-xs font-medium text-slate-500 dark:text-zinc-400">{item.label}</p>
            <p className={`text-3xl font-black tabular-nums ${item.valueClass}`}>{item.value}</p>
          </div>
        ))}
        <Link
          href="/api/admin/go-search-shadow"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#f8f7f4] dark:bg-[#111111] border border-[#ede7dd] dark:border-zinc-800 px-4 py-3 hover:border-[#2F855A]/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Go Search Shadow</p>
            <ServerCog size={14} className={goSearchShadow.flags.shadowEnabled ? "text-[#2F855A]" : "text-slate-400"} />
          </div>
          <p className={`text-2xl font-black tabular-nums ${goSearchShadow.rates.mismatchRate > 5 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {goSearchShadow.rates.mismatchRate.toFixed(1)}%
          </p>
          <p className="text-[10px] mt-1 uppercase tracking-[0.12em] font-bold text-slate-500">
            mismatch ({goSearchShadow.counters.mismatches}/{goSearchShadow.counters.compared || 0})
          </p>
          <p className="text-[10px] mt-1 uppercase tracking-[0.12em] font-bold text-slate-400">
            p95 {goSearchShadow.latencyMs.p95 ?? "-"}ms - last {ago(goSearchShadow.last.queryAt)}
          </p>
          {goSearchShadow.rollout?.promoteReady ? (
            <p className="text-[10px] mt-1 uppercase tracking-[0.12em] font-black text-emerald-700 dark:text-emerald-400">
              ready for active rollout
            </p>
          ) : null}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-8 sm:mb-10">
        <div className="bg-gradient-to-br from-[#ecfdf5] via-white to-[#f8f7f4] dark:from-[#0f172a] dark:via-[#111111] dark:to-[#0a0a0a] border border-[#2F855A]/35 dark:border-[#38A169]/40 px-4 py-3 hover:border-[#2F855A]/70 transition-colors shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F855A]/15 text-[#2F855A] flex items-center justify-center shrink-0 border border-[#2F855A]/25">
              <FileDown size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2F855A]">Network weekly PDF</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug">
                Full marketplace digest — dealers, traffic, hot listings.
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Same rolling 7-day window as dealer proof packs · admin only.
              </p>
              <div className="mt-3">
                <PdfBlobDownloadButton
                  fetchUrl="/api/admin/reports/network-weekly-pdf"
                  fileStem="welsh-motorhub-network-weekly"
                  idleLabel="Download network PDF"
                  buttonClassName="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2F855A] text-white text-[10px] font-black uppercase tracking-[0.12em] hover:bg-[#276749] transition-colors disabled:opacity-60 w-full sm:w-auto"
                />
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/api/admin/weekly-metrics"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white dark:bg-[#111111] border border-[#ede7dd] dark:border-zinc-800 px-4 py-3 hover:border-[#2F855A]/50 transition-colors"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Weekly KPI Pulse</p>
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-100">Listings {listingsThisWeek} ({listingDelta}%)</p>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">Leads {leadsThisWeek} ({leadDelta}%)</p>
        </Link>
        <div className="bg-white dark:bg-[#111111] border border-[#ede7dd] dark:border-zinc-800 px-4 py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Funnel Health</p>
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-100">Leads/Active Listing: {leadsPerActiveListing}</p>
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-100">Lead Response Rate: {responseRate}%</p>
          <p className="text-sm font-bold text-red-600 dark:text-red-400">Stale listing ratio: {staleRatio}%</p>
        </div>
        <Link
          href="/api/admin/ops-health"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white dark:bg-[#111111] border border-[#ede7dd] dark:border-zinc-800 px-4 py-3 hover:border-[#2F855A]/50 transition-colors"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Ops Health Feed</p>
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-100">Request telemetry + audit events</p>
          <p className="text-[11px] font-semibold text-slate-500">Use this for backend quality tracking and incident triage.</p>
        </Link>
        <Link
          href="/admin/seo"
          className="bg-white dark:bg-[#111111] border border-[#ede7dd] dark:border-zinc-800 px-4 py-3 hover:border-[#2F855A]/50 transition-colors"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Technical SEO</p>
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-100">Slugs, sitemap, audit</p>
          <p className="text-[11px] font-semibold text-slate-500">Listing health before Search Console deep dives.</p>
        </Link>
        <Link
          href="/admin/content"
          className="bg-white dark:bg-[#111111] border border-[#ede7dd] dark:border-zinc-800 px-4 py-3 hover:border-[#2F855A]/50 transition-colors"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Content engine</p>
          <p className="mt-2 text-sm font-bold text-slate-800 dark:text-zinc-100">Blog, guides, comparisons</p>
          <p className="text-[11px] font-semibold text-slate-500">Phase 2 SEO — trending searches and programmatic pages.</p>
        </Link>
      </div>

      <div className="bg-white dark:bg-[#111111] border border-[#ede7dd] dark:border-zinc-800 px-4 py-4 mb-8 sm:mb-10">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Private Marketing Tracking (Admin Only)</p>
          <Link
            href="/api/admin/tracking/summary"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2F855A] hover:opacity-80"
          >
            Open JSON summary
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-[#f8f7f4] dark:bg-[#0d0d0d] border border-[#ede7dd] dark:border-zinc-800 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Events (7d)</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">{trackingEvents7d}</p>
          </div>
          <div className="bg-[#f8f7f4] dark:bg-[#0d0d0d] border border-[#ede7dd] dark:border-zinc-800 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Events (30d)</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{trackingEvents30d}</p>
          </div>
          <div className="bg-[#f8f7f4] dark:bg-[#0d0d0d] border border-[#ede7dd] dark:border-zinc-800 px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Top Events (7d)</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 break-words leading-relaxed">
              {trackingTopEvents.length
                ? trackingTopEvents.map((row) => `${row.name} (${row._count._all})`).join(" · ")
                : "No tracked events yet"}
            </p>
          </div>
        </div>
      </div>

      {/* ── METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
        {[
          { label: "Total Cars", val: totalCars, sub: `+${carsInRange} listings in ${rangeLabel}`, icon: <Car size={20} />, valClass: "text-slate-900 dark:text-white", accent: "emerald" },
          { label: "Total Leads", val: totalLeads, sub: `+${leadsInRange} leads in ${rangeLabel}`, icon: <MessageSquare size={20} />, valClass: "text-red-600 dark:text-red-400", accent: "red" },
          { label: "Total Value", val: formatCompact(totalValue), sub: "Listed active inventory value", icon: <Bolt size={20} />, valClass: "text-amber-600 dark:text-amber-400", accent: "amber" },
          { label: "Active Users", val: totalUsers, sub: "Marketplace shoppers", icon: <Users size={20} />, valClass: "text-blue-600 dark:text-blue-400", accent: "blue" },
        ].map((m, i) => (
          <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-900">
              <span className={
                m.accent === "red" ? "text-red-600" : m.accent === "amber" ? "text-amber-600" : m.accent === "blue" ? "text-blue-600" : "text-emerald-600"
              }>{m.icon}</span>
            </div>
            <h3 className={`relative z-10 mb-1 text-3xl font-black tabular-nums ${m.valClass}`}>{m.val}</h3>
            <p className="relative z-10 mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
            <p className="relative z-10 mt-2 inline-flex bg-slate-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── CHARTS & ALERTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-8 sm:mb-12">
      
         {/* Main Chart (Takes up 2/3 width) */}
         <div className="lg:col-span-2 flex flex-col items-stretch">
            <AdminTrendsChart data={chartData} rangeLabel={rangeLabel} />
         </div>

         {/* Pie + inbox + billing */}
         <div className="flex flex-col gap-4 sm:gap-6">
            <AdminOverviewPieChart
              data={pieData}
              title="Attention mix"
              subtitle="What needs eyes on the marketplace right now"
            />
            <AdminOverviewPieChart
              data={subscriptionPie}
              title="Subscriptions"
              subtitle="Active plans on the platform"
            />

            {/* Inbox Panel */}
            <div className="bg-red-50 p-5 sm:p-6 rounded-none shadow-none">
               <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-none h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest text-red-600">Needs Action ({pendingDealersCount})</span>
               </div>

               <div className="space-y-3">
                 {pendingDealers.length === 0 ? (
                   <div className="text-sm font-semibold text-red-700 bg-red-100/50 p-4 rounded-none flex items-center justify-between gap-2 border border-red-100">
                     <span className="flex items-center gap-2"><BadgeCheck size={16} /> Inbox Zero! All clear.</span>
                   </div>
                 ) : (
                   pendingDealers.map(d => (
                     <Link key={d.id} href={`/admin/dealers/${d.id}`} className="bg-white hover:bg-white/80 p-4 rounded-none flex items-center justify-between gap-3 group transition-colors shadow-sm">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-700 transition-colors uppercase tracking-tight break-words">{d.name}</p>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-red-100/50 border border-red-100/80 self-start text-red-600 font-bold uppercase tracking-wider text-[8px]">
                             <AlertCircle size={10} /> Pending Approval
                          </div>
                        </div>
                        <ChevronRight className="text-red-300 group-hover:text-red-600 transition-colors" size={16} />
                     </Link>
                   ))
                 )}
               </div>
            </div>

            {/* Billing Health Panel */}
            <div className="bg-[#2F855A]/10 p-5 sm:p-6 rounded-none shadow-none">
               <div className="flex items-center gap-2 mb-4 sm:mb-6 text-[#2F855A]">
                  <Activity size={16} strokeWidth={3} />
                  <span className="text-xs font-black uppercase tracking-widest text-[#276749]">Billing Health</span>
               </div>
               <div className="bg-white rounded-none p-5 sm:p-6 flex flex-col items-center text-center justify-center shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Estimated MRR</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">{formatCompact(mrr)}</p>
                  
                  <div className="w-full flex items-center gap-2 pt-5 border-t border-slate-100/60">
                    <div className="flex-1 bg-[#2F855A]/10 py-3 rounded-none flex flex-col items-center justify-center">
                       <span className="text-[11px] font-black uppercase tracking-widest text-[#2F855A] mb-1">Premium</span>
                       <span className="text-xl font-black text-[#276749]">{premiumSubs}</span>
                    </div>
                    <div className="flex-1 bg-[#f7f6f3] py-3 rounded-none flex flex-col items-center justify-center">
                       <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Free</span>
                       <span className="text-xl font-black text-slate-600">{freeSubs}</span>
                    </div>
                  </div>
               </div>
            </div>
            
         </div>
      </div>
    </div>
  );
}
