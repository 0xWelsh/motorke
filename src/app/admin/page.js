export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import AdminTrendsChart from "@/components/admin/AdminTrendsChart";
import RunWatchAlertsButton from "@/components/admin/RunWatchAlertsButton";
import { 
  Car, Building2, MessageSquare, Users, ChevronRight,
  Plus, Activity, Bolt, AlertCircle, ShieldAlert, BadgeCheck
} from "lucide-react";

export const metadata = { title: "Admin Dashboard — Welsh Motors" };

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
    inventoryValueAgg, pendingDealers, carsToday,
    premiumSubs, freeSubs,
    rawCarsForChart, rawLeadsForChart
  ] = await Promise.all([
    db.car.count({ where: { available: true } }),
    db.dealer.count(),
    db.lead.count(),
    db.user.count({ where: { role: "BUYER" } }),
    db.car.count({ where: { createdAt: { gte: startDate } } }),
    db.lead.count({ where: { createdAt: { gte: startDate } } }),
    db.car.aggregate({ _sum: { price: true }, where: { available: true } }),
    db.dealer.findMany({ where: { verified: false }, take: 4, select: { id: true, name: true, createdAt: true } }),
    db.car.count({ where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }), // cars added today
    db.subscription.count({ where: { plan: "PRO", status: "ACTIVE" } }),
    db.subscription.count({ where: { plan: "FREE", status: "ACTIVE" } }),
    db.car.findMany({ where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } }, select: { createdAt: true } }),
    db.lead.findMany({ where: { createdAt: { gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } }, select: { createdAt: true } })
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000 max-w-[1400px]">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 sm:mb-8 gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-none bg-[#ff5a2f] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Administration</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
             Platform Command Center
          </h1>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Real-time marketplace analytics and pending operation alerts.</p>
        </div>
        
        {/* Date Range Toggle */}
        <div className="flex items-center justify-between lg:justify-end w-full lg:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <RunWatchAlertsButton />
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-none shadow-inner">
            {[
              { v: "7", label: "7 DAYS" },
              { v: "30", label: "30 DAYS" },
              { v: "all", label: "ALL TIME" }
            ].map(opt => (
              <Link 
                key={opt.v} href={`?range=${opt.v}`} 
                className={`px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-none transition-all ${
                  range === opt.v ? "bg-white text-[#ff5a2f]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
              >
                {opt.label}
              </Link>
            ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
        {[
          { label: "Total Cars",   val: totalCars,    sub: `+${carsInRange} listings in ${rangeLabel}`, icon: <Car size={20} /> },
          { label: "Total Leads",  val: totalLeads,   sub: `+${leadsInRange} leads in ${rangeLabel}`, icon: <MessageSquare size={20} />, color: "emerald" },
          { label: "Total Value",  val: formatCompact(totalValue), sub: "Listed Active Inventory Value", icon: <Bolt size={20} /> },
          { label: "Active Users", val: totalUsers,   sub: `Current Marketplace Shoppers`, icon: <Users size={20} /> }
        ].map((m, i) => (
          <div key={i} className="bg-white dark:bg-[#111111] p-5 sm:p-6 rounded-none transition-all relative overflow-hidden group shadow-sm hover:shadow-md">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`w-10 h-10 flex items-center justify-center rounded-none bg-[#f7f6f3] ${m.color ? "text-[#ff5a2f] group-hover:bg-[#ff5a2f] group-hover:text-white" : "text-slate-400 group-hover:bg-slate-900 group-hover:text-white"} transition-colors`}>
                {m.icon}
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1 relative z-10">{m.val}</h3>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 relative z-10 mb-1">{m.label}</p>
            <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider relative z-10 bg-[#f7f6f3] dark:bg-slate-800 inline-flex px-2 py-0.5 rounded-none mt-2">{m.sub}</p>
            
            {m.color && <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#ff5a2f]/10 rounded-none blur-2xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />}
          </div>
        ))}
      </div>

      {/* ── CHARTS & ALERTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
      
         {/* Main Chart (Takes up 2/3 width) */}
         <div className="lg:col-span-2 flex flex-col items-stretch">
            <AdminTrendsChart data={chartData} rangeLabel={rangeLabel} />
         </div>

         {/* Needs Action Inbox and Health (Takes 1/3) */}
         <div className="flex flex-col gap-4 sm:gap-6">
            
            {/* Inbox Panel */}
            <div className="bg-red-50 p-5 sm:p-6 rounded-none shadow-none">
               <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-none h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-widest text-red-600">Needs Action</span>
               </div>

               <div className="space-y-3">
                 {pendingDealers.length === 0 ? (
                   <div className="text-sm font-semibold text-red-700 bg-red-100/50 p-4 rounded-none flex items-center justify-between gap-2 border border-red-100">
                     <span className="flex items-center gap-2"><BadgeCheck size={16} /> Inbox Zero! All clear.</span>
                   </div>
                 ) : (
                   pendingDealers.map(d => (
                     <Link key={d.id} href={`/admin/dealers/${d.id}`} className="bg-white hover:bg-white/80 p-4 rounded-none flex items-center justify-between group transition-colors shadow-sm">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-red-700 transition-colors uppercase tracking-tight">{d.name}</p>
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
            <div className="bg-[#ff5a2f]/10 p-5 sm:p-6 rounded-none shadow-none">
               <div className="flex items-center gap-2 mb-4 sm:mb-6 text-[#ff5a2f]">
                  <Activity size={16} strokeWidth={3} />
                  <span className="text-xs font-black uppercase tracking-widest text-[#e54a1f]">Billing Health</span>
               </div>
               <div className="bg-white rounded-none p-5 sm:p-6 flex flex-col items-center text-center justify-center shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Estimated MRR</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">{formatCompact(mrr)}</p>
                  
                  <div className="w-full flex items-center gap-2 pt-5 border-t border-slate-100/60">
                    <div className="flex-1 bg-[#ff5a2f]/10 py-3 rounded-none flex flex-col items-center justify-center">
                       <span className="text-[11px] font-black uppercase tracking-widest text-[#ff5a2f] mb-1">Premium</span>
                       <span className="text-xl font-black text-[#e54a1f]">{premiumSubs}</span>
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
