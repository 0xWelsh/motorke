// src/app/admin/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { 
  Car, 
  Building2, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Plus, 
  ChevronRight,
  Eye,
  Smartphone,
  Globe,
  ArrowUpRight,
  Activity,
  ArrowRight
} from "lucide-react";

export const metadata = { title: "Overview — Motorke Standard Admin" };

export default async function AdminDashboard() {
  await requireAdmin();

  const now   = new Date();
  const week  = new Date(now - 7  * 24 * 60 * 60 * 1000);
  const month = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalCars, totalDealers, totalLeads, totalUsers,
    carsThisWeek, leadsThisWeek, leadsThisMonth,
    recentLeads, topCars, recentCars,
    leadsByDealer, whatsappLeads, webLeads,
    inventoryValueAgg
  ] = await Promise.all([
    db.car.count({ where: { available: true } }),
    db.dealer.count(),
    db.lead.count(),
    db.user.count({ where: { role: "BUYER" } }),
    db.car.count({ where: { createdAt: { gte: week } } }),
    db.lead.count({ where: { createdAt: { gte: week } } }),
    db.lead.count({ where: { createdAt: { gte: month } } }),
    db.lead.findMany({
      take: 6, orderBy: { createdAt: "desc" },
      include: { car: { select: { make: true, model: true, year: true } }, dealer: { select: { name: true } } },
    }),
    db.car.findMany({
      where: { available: true }, take: 5,
      orderBy: { views: "desc" },
      include: { images: { where: { isPrimary: true }, take: 1 }, dealer: { select: { name: true } } },
    }),
    db.car.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      include: { dealer: { select: { name: true } } },
    }),
    db.lead.groupBy({ by: ["dealerId"], _count: { id: true }, orderBy: { _count: { id: "desc" } }, take: 5 }),
    db.lead.count({ where: { channel: "whatsapp" } }),
    db.lead.count({ where: { channel: "web" } }),
    db.car.aggregate({ _sum: { price: true }, where: { available: true } })
  ]);

  const dealerIds   = leadsByDealer.map(l => l.dealerId);
  const dealerNames = await db.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, name: true } });
  const dealerMap   = Object.fromEntries(dealerNames.map(d => [d.id, d.name]));
  
  const totalValue = inventoryValueAgg?._sum?.price || 0;
  
  const formatCompact = (num) => {
    if (num >= 1e9) return `KSh ${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `KSh ${(num / 1e6).toFixed(1)}M`;
    return formatPrice(num);
  };

  return (
    <div className="animate-in fade-in duration-1000">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Live Analytics Engine</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">Platform Overview</h1>
        </div>
        
        <div className="flex items-center gap-3">
           <Link href="/admin/cars/new" className="bg-white/10 border border-white/10 text-pureWhite px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 hover:border-orange-500 transition-all shadow-xl">
             <Plus size={14} /> New Listing
           </Link>
           <Link href="/admin/dealers/new" className="bg-transparent border border-white/20 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-white/5 transition-all shadow-sm">
             <Building2 size={14} /> Add Dealer
           </Link>
        </div>
      </div>

      {/* ── CORE STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { label: "Gross Inventory", value: formatCompact(totalValue), sub: "Total Market Value", icon: <Building2 size={20} /> },
          { label: "Active Units", value: totalCars.toLocaleString(), sub: `+${carsThisWeek} new`, icon: <Car size={20} /> },
          { label: "Captured Leads", value: totalLeads.toLocaleString(), sub: `+${leadsThisWeek} weekly`, icon: <MessageSquare size={20} /> },
          { label: "Active Buyers", value: totalUsers.toLocaleString(), sub: "Market Reach", icon: <Users size={20} /> },
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface border border-white/5 p-10 rounded-[2.5rem] shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:border-border transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:text-black/10 transition-colors">
                <Activity size={40} strokeWidth={3} />
             </div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-white/5 text-white/40 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-pureWhite transition-all duration-500 mb-8 border border-white/5">
                  {stat.icon}
                </div>
                <p className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tighter">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">{stat.label}</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-white/30">
                   <TrendingUp size={12} className="text-black" />
                   <span>{stat.sub}</span>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* ── INTELLIGENCE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         {/* Conversion Card */}
         <div className="bg-surface border border-white/5 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all hover:shadow-3xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] -mr-32 -mt-32" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-10 block">Conversion Matrix</span>
            
            <div className="space-y-6 relative z-10">
               {/* Unified Split-Bar Chart */}
               <div className="flex w-full h-3 rounded-full overflow-hidden mb-6 bg-white/5">
                  <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${(whatsappLeads/totalLeads)*100}%` }} title="WhatsApp Leads" />
                  <div className="h-full bg-white/10 transition-all duration-1000 delay-300" style={{ width: `${(webLeads/totalLeads)*100}%` }} title="Web Forms" />
               </div>
               
               <div className="flex items-center justify-between">
                  <div>
                     <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-1 text-white/40"><Smartphone size={14} className="text-black" /> WhatsApp</p>
                     <p className="text-2xl font-black">{whatsappLeads} <span className="text-[10px] font-bold text-white/40 ml-1 uppercase">({Math.round((whatsappLeads/totalLeads)*100)}%)</span></p>
                  </div>
                  <div className="text-right">
                     <p className="text-[11px] font-black uppercase tracking-widest flex items-center justify-end gap-2 mb-1 text-white/40"><Globe size={14} className="text-white/40" /> Forms</p>
                     <p className="text-2xl font-black">{webLeads} <span className="text-[10px] font-bold text-white/40 mr-1 uppercase bg-transparent">({Math.round((webLeads/totalLeads)*100)}%)</span></p>
                  </div>
               </div>
            </div>

            <div className="mt-16 pt-10 border-t border-white/5 flex items-center justify-between">
               <div>
                  <p className="text-2xl font-black leading-none">{totalLeads}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-2">Total Yield</p>
               </div>
               <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:border-white transition-colors">
                  <ArrowUpRight size={16} className="text-white/40" />
               </div>
            </div>
         </div>

         {/* Performance Table */}
         <div className="lg:col-span-2 bg-surface border border-white/5 rounded-[3rem] p-10 shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Dealer Leaderboard</h3>
                  <p className="text-xs font-semibold text-white/40 mt-1">Lead volume tracking for top verified hubs.</p>
               </div>
               <Link href="/admin/dealers" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-orange-600 hover:text-white hover:border-orange-500 transition-all">
                  <ArrowRight size={16} />
               </Link>
            </div>
            
            <div className="space-y-6 relative z-10">
               {leadsByDealer.map(({ dealerId, _count }, i) => {
                  const name  = dealerMap[dealerId] || "Unknown Dealer";
                  const pct   = Math.round((_count.id / leadsByDealer[0]._count.id) * 100);
                  const isTop = i < 3;
                  const rankColor = i === 0 ? "text-black bg-amber-500/10 border-amber-500/20" : 
                                    i === 1 ? "text-white/40 bg-slate-400/10 border-slate-400/20" : 
                                    i === 2 ? "text-black bg-orange-700/10 border-orange-700/20" : 
                                    "text-white/40 bg-slate-100 dark:bg-white/5 border-transparent";
                  return (
                    <div key={dealerId} className="group cursor-default">
                       <div className="flex items-center gap-4 mb-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${rankColor}`}>
                             #{i + 1}
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                             <p className="text-sm font-black text-white uppercase tracking-tight group-hover:text-black transition-colors">{name}</p>
                             <p className="text-sm font-black text-white">{_count.id} <span className="text-[10px] text-white/40 uppercase tracking-tighter ml-1">leads</span></p>
                          </div>
                       </div>
                       <div className="pl-12">
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${isTop ? 'bg-orange-500' : 'bg-white/10'} group-hover:bg-orange-600`} style={{ width: `${pct}%` }} />
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* ── TRENDING UNITS ── */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-black text-white tracking-tight">Trending Inventory</h2>
            <Link href="/admin/cars" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Show All</Link>
          </div>
          <div className="space-y-3">
            {topCars.map((car) => (
              <div key={car.id} className="flex items-center gap-5 p-5 bg-surface border border-white/5 rounded-[2rem] hover:bg-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50 transition-all group">
                <div className="w-20 h-14 rounded-2xl bg-white/5 border border-white/5 overflow-hidden shrink-0">
                  {car.images[0] ? (
                    <img src={car.images[0].url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/30 font-black italic text-[10px]">NA</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate tracking-tight">{car.year} {car.make} {car.model}</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">{car.dealer?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white leading-none mb-2">{formatPrice(car.price)}</p>
                  <div className="flex items-center justify-end gap-1.5 text-black">
                    <Eye size={12} strokeWidth={3} />
                    <span className="text-[11px] font-black">{car.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECENT ACTIVITY ── */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-xl font-black text-white tracking-tight">System Enquiries</h2>
            <Link href="/admin/leads" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Manage Stream</Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <Link key={lead.id} href="/admin/leads" className="flex items-center justify-between p-5 bg-surface border border-white/5 rounded-[2rem] hover:bg-white/5 hover:border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group block">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-white/10 border border-white/10 text-white rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-orange-600 group-hover:text-pureWhite transition-colors duration-500">
                      {lead.name[0]}
                   </div>
                   <div>
                      <p className="text-sm font-black text-white tracking-tight">{lead.name}</p>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1 truncate max-w-[180px]">
                        {lead.car.year} {lead.car.make} {lead.car.model}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 shadow-sm border ${
                    lead.channel === "whatsapp" ? "bg-emerald-500/10 text-black border-emerald-500/20" : "bg-white/5 text-white/70 border-black/5 dark:border-white/10"
                  }`}>
                    {lead.channel === "whatsapp" ? <Smartphone size={10} /> : <Globe size={10} />}
                    {lead.channel}
                  </div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter block">
                    {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
