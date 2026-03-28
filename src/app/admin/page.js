// src/app/admin/page.js
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
  ]);

  const dealerIds   = leadsByDealer.map(l => l.dealerId);
  const dealerNames = await db.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, name: true } });
  const dealerMap   = Object.fromEntries(dealerNames.map(d => [d.id, d.name]));

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
          { label: "Inventory", value: totalCars, sub: `+${carsThisWeek} new`, icon: <Car size={20} /> },
          { label: "Dealerships", value: totalDealers, sub: "Verified Partners", icon: <Building2 size={20} /> },
          { label: "Captured Leads", value: totalLeads, sub: `+${leadsThisWeek} weekly`, icon: <MessageSquare size={20} /> },
          { label: "Active Buyers", value: totalUsers, sub: "Market Reach", icon: <Users size={20} /> },
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface border border-white/5 p-10 rounded-[2.5rem] shadow-sm hover:bg-white/5 hover:border-white/10 transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 text-white/5 group-hover:text-orange-500/10 transition-colors">
                <Activity size={40} strokeWidth={3} />
             </div>
             <div className="relative z-10">
                <div className="w-12 h-12 bg-white/5 text-pureWhite/40 rounded-2xl flex items-center justify-center group-hover:bg-orange-600 group-hover:text-pureWhite transition-all duration-500 mb-8 border border-white/5">
                  {stat.icon}
                </div>
                <p className="text-4xl font-black text-white mb-2">{stat.value.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-6">{stat.label}</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-white/30">
                   <TrendingUp size={12} className="text-orange-600" />
                   <span>{stat.sub}</span>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* ── INTELLIGENCE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
         {/* Conversion Card */}
         <div className="bg-surface border border-white/5 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 blur-[100px] -mr-32 -mt-32" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600 mb-10 block">Conversion Matrix</span>
            
            <div className="space-y-10 relative z-10">
               <div>
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><Smartphone size={14} className="text-orange-600" /> WhatsApp Direct</p>
                     <p className="text-xl font-black">{whatsappLeads}</p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(whatsappLeads/totalLeads)*100}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-4">
                     <p className="text-[11px] font-black uppercase tracking-widest flex items-center gap-3"><Globe size={14} className="text-white/50" /> System Forms</p>
                     <p className="text-xl font-black">{webLeads}</p>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-white/30 transition-all duration-1000" style={{ width: `${(webLeads/totalLeads)*100}%` }} />
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
         <div className="lg:col-span-2 bg-surface border border-white/5 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
               <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Dealer Performance</h3>
                  <p className="text-xs font-medium text-white/40 mt-1">Lead volume distribution across verified hubs.</p>
               </div>
               <Link href="/admin/dealers" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all">
                  <ArrowRight size={16} />
               </Link>
            </div>
            
            <div className="space-y-8 relative z-10">
               {leadsByDealer.map(({ dealerId, _count }, i) => {
                  const name  = dealerMap[dealerId] || "Unknown Dealer";
                  const pct   = Math.round((_count.id / leadsByDealer[0]._count.id) * 100);
                  return (
                    <div key={dealerId} className="group">
                       <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-orange-500 transition-colors">{name}</p>
                          <p className="text-xs font-black text-white">{_count.id} <span className="text-[10px] text-white/30 uppercase tracking-tighter ml-1">leads</span></p>
                       </div>
                       <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-white/20 group-hover:bg-orange-600 transition-all duration-1000" style={{ width: `${pct}%` }} />
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
                  <div className="flex items-center justify-end gap-1.5 text-orange-500">
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
              <div key={lead.id} className="flex items-center justify-between p-5 bg-surface border border-white/5 rounded-[2rem] hover:bg-white/5 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50 transition-all group">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-white/10 border border-white/10 text-pureWhite rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-orange-600 transition-colors duration-500">
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
                    lead.channel === "whatsapp" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-white/70 border-white/10"
                  }`}>
                    {lead.channel === "whatsapp" ? <Smartphone size={10} /> : <Globe size={10} />}
                    {lead.channel}
                  </div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-tighter block">
                    {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
