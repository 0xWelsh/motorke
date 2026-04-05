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
  ArrowRight,
  Zap,
  BarChart3,
  Clock
} from "lucide-react";

export const metadata = { title: "Nexus Control — Motorske Analytics" };

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
             <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-emerald-500/60">Universal Intelligence Hub</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight leading-none">
            Market <span className="text-emerald-500">Nexus</span>
          </h1>
          <p className="text-white/30 mt-4 text-sm font-medium tracking-wide">Synthesized platform metrics and real-time operational data.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <Link href="/admin/cars/new" className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[12px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-500 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)]">
             <Plus size={16} /> Deploy Listing
           </Link>
           <Link href="/admin/dealers/new" className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl text-[12px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all">
             <Building2 size={16} /> New Partner
           </Link>
        </div>
      </div>

      {/* ── KEY PERFORMANCE INDICATORS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
        {[
          { label: "Assets Under Mgmt", value: formatCompact(totalValue), sub: "Total Inventory Value", icon: <BarChart3 size={20} />, trend: "+12.4%" },
          { label: "Live Listings", value: totalCars.toLocaleString(), sub: `${carsThisWeek} new this week`, icon: <Car size={20} />, trend: `+${Math.round((carsThisWeek/totalCars)*100)}%` },
          { label: "Lead Pipeline", value: totalLeads.toLocaleString(), sub: `${leadsThisMonth} monthly volume`, icon: <Zap size={20} />, trend: "+28.1%" },
          { label: "Network Capacity", value: totalUsers.toLocaleString(), sub: "Verified active buyers", icon: <Users size={20} />, trend: "+5.2%" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-[#0a0c10] border border-white/5 p-8 rounded-[2rem] shadow-2xl hover:border-emerald-500/20 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 text-white/[0.02] group-hover:text-emerald-500/[0.05] transition-colors pointer-events-none">
                <stat.icon.type {...stat.icon.props} size={80} strokeWidth={1} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-white/5 text-white/40 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600/10 group-hover:text-emerald-500 transition-all duration-500 border border-white/5">
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                    <TrendingUp size={12} />
                    {stat.trend}
                  </div>
                </div>
                
                <p className="text-4xl font-black text-white mb-2 tracking-tighter">{stat.value}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mb-1">{stat.label}</p>
                <p className="text-[10px] font-medium text-white/20">{stat.sub}</p>
             </div>
          </div>
        ))}
      </div>

      {/* ── INTELLIGENCE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
         {/* Conversion Matrix */}
         <div className="lg:col-span-4 bg-[#0a0c10] border border-white/5 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl transition-all hover:border-emerald-500/10 group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/5 blur-[120px] -mr-40 -mt-40 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-12">
               <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500">Pipeline Alpha</span>
               <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/20">
                  <Activity size={14} />
               </div>
            </div>
            
            <div className="space-y-8 relative z-10">
               {/* Custom Wave Progress Bar */}
               <div className="relative w-full h-12 rounded-2xl bg-white/[0.02] overflow-hidden border border-white/5">
                  <div className="absolute inset-0 flex items-center px-4 justify-between z-10">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">WhatsApp Response</span>
                     <span className="text-sm font-black">{Math.round((whatsappLeads/totalLeads)*100)}%</span>
                  </div>
                  <div className="h-full bg-emerald-600/20 border-r border-emerald-500/30 transition-all duration-1000 ease-out shadow-[0_0_30px_rgba(16,185,129,0.3)]" style={{ width: `${(whatsappLeads/totalLeads)*100}%` }} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all">
                     <div className="flex items-center gap-3 mb-3 text-emerald-500">
                        <Smartphone size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Direct API</span>
                     </div>
                     <p className="text-3xl font-black">{whatsappLeads}</p>
                     <p className="text-[10px] font-medium text-white/20 mt-1 uppercase tracking-tighter">Instant Enquiries</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                     <div className="flex items-center gap-3 mb-3 text-white/30">
                        <Globe size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Web Core</span>
                     </div>
                     <p className="text-3xl font-black">{webLeads}</p>
                     <p className="text-[10px] font-medium text-white/20 mt-1 uppercase tracking-tighter">Form Submissions</p>
                  </div>
               </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
               <div>
                  <p className="text-3xl font-black leading-none">{totalLeads}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 mt-3">Total Synthesized Leads</p>
               </div>
               <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:border-emerald-500/30 transition-all group-hover:scale-110">
                  <ArrowUpRight size={18} className="text-white/20 group-hover:text-emerald-500" />
               </div>
            </div>
         </div>

         {/* Performance Table */}
         <div className="lg:col-span-8 bg-[#0a0c10] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12 relative z-10">
               <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Partner Performance</h3>
                  <p className="text-sm font-medium text-white/20 mt-2">Yield distribution across authorized dealership hubs.</p>
               </div>
               <Link href="/admin/dealers" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40 hover:bg-emerald-600 hover:text-white transition-all">
                  Full Analytics <ArrowRight size={14} />
               </Link>
            </div>
            
            <div className="space-y-8 relative z-10">
               {leadsByDealer.map(({ dealerId, _count }, i) => {
                  const name  = dealerMap[dealerId] || "Unknown Node";
                  const pct   = Math.round((_count.id / leadsByDealer[0]._count.id) * 100);
                  return (
                    <div key={dealerId} className="group/item cursor-default">
                       <div className="flex items-center gap-6 mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[12px] font-black border ${
                            i === 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-white/5 text-white/30 border-white/5"
                          }`}>
                             0{i + 1}
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                             <div>
                                <p className="text-sm font-bold text-white uppercase tracking-tight group-hover/item:text-emerald-400 transition-colors">{name}</p>
                                <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest mt-1">Authorized Licensee</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-white">{_count.id}</p>
                                <p className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">Captured Units</p>
                             </div>
                          </div>
                       </div>
                       <div className="pl-16">
                          <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden border border-white/5">
                             <div className={`h-full transition-all duration-1000 ${i === 0 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-white/10'} group-hover/item:bg-emerald-400`} style={{ width: `${pct}%` }} />
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* ── TRENDING UNITS ── */}
        <section className="xl:col-span-7">
          <div className="flex items-center justify-between mb-10 px-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <Zap size={18} />
               </div>
               <h2 className="text-2xl font-black text-white tracking-tight">Trending Assets</h2>
            </div>
            <Link href="/admin/cars" className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 hover:text-emerald-500 transition-colors">Audit Fleet</Link>
          </div>
          
          <div className="grid gap-4">
            {topCars.map((car) => (
              <div key={car.id} className="flex items-center gap-6 p-5 bg-[#0a0c10] border border-white/5 rounded-3xl hover:border-emerald-500/20 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-24 h-16 rounded-2xl bg-white/5 border border-white/5 overflow-hidden shrink-0 relative z-10 shadow-2xl">
                  {car.images[0] ? (
                    <img src={car.images[0].url} alt="" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white/10 bg-black/50"><Car size={20} /></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-[0.25em] mb-1">{car.dealer?.name}</p>
                  <p className="text-base font-black text-white truncate tracking-tight">{car.year} {car.make} {car.model}</p>
                  <div className="flex items-center gap-3 mt-2">
                     <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{car.variant || "Base Spec"}</span>
                     <div className="w-1 h-1 rounded-full bg-white/10" />
                     <div className="flex items-center gap-1.5 text-emerald-500">
                        <Eye size={12} />
                        <span className="text-[11px] font-black tracking-tighter">{car.views.toLocaleString()}</span>
                     </div>
                  </div>
                </div>
                
                <div className="text-right relative z-10">
                  <p className="text-lg font-black text-white leading-none mb-2 tracking-tighter">{formatPrice(car.price)}</p>
                  <Link href={`/admin/cars/${car.id}`} className="text-[10px] font-bold text-white/20 uppercase tracking-widest hover:text-white transition-colors">Configure</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECENT ACTIVITY / SENSORS ── */}
        <section className="xl:col-span-5">
          <div className="flex items-center justify-between mb-10 px-4">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Clock size={18} />
               </div>
               <h2 className="text-2xl font-black text-white tracking-tight">Active Stream</h2>
            </div>
            <Link href="/admin/leads" className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/20 hover:text-blue-500 transition-colors">Sensor Audit</Link>
          </div>
          
          <div className="bg-[#0a0c10]/50 border border-white/5 rounded-[2.5rem] p-6 space-y-4">
            {recentLeads.map((lead) => (
              <Link key={lead.id} href="/admin/leads" className="flex items-center justify-between p-5 bg-black border border-white/5 rounded-2xl hover:border-blue-500/30 hover:-translate-x-1 transition-all group block">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-white/5 border border-white/5 text-white/20 rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      {lead.name[0]}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">{lead.name}</p>
                      <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest mt-1 truncate max-w-[150px]">
                        Target: {lead.car.make} {lead.car.model}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 border ${
                    lead.channel === "whatsapp" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-white/40 border-white/10"
                  }`}>
                    {lead.channel === "whatsapp" ? <Smartphone size={10} /> : <Globe size={10} />}
                    {lead.channel}
                  </div>
                  <p className="text-[10px] font-bold text-white/10 uppercase tracking-tighter block mt-1">
                    {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
            
            {/* Real-time Event Placeholder */}
            <div className="pt-6 mt-4 border-t border-white/5">
               <div className="flex items-center gap-4 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                  Monitoring System Integrity...
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
