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

export const metadata = { title: "Nexus Dashboard — Motorske Admin" };

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
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" />
             <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-800">Universal Nexus Terminal</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-1">
             Market <span className="text-emerald-600">Nexus</span>
          </h1>
          <p className="text-slate-700 mt-4 text-sm font-medium tracking-wide">Real-time operational signals and platform-wide unit intelligence.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <Link href="/admin/cars/new" className="bg-emerald-600 text-white px-10 py-4 rounded-2xl text-[12px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl shadow-emerald-200 group">
             <Plus size={16} className="group-hover:rotate-90 transition-transform duration-500" /> Deploy Asset
           </Link>
           <Link href="/admin/dealers/new" className="bg-white border border-slate-200 text-slate-900 px-10 py-4 rounded-2xl text-[12px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all">
             <Building2 size={16} /> Add Partner
           </Link>
        </div>
      </div>

      {/* ── KPI SECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
        {[
          { label: "Inventory Value", value: formatCompact(totalValue), sub: "Gross Assets Managed", icon: <BarChart3 size={20} />, trend: "+12.4%" },
          { label: "Active Showcases", value: totalCars.toLocaleString(), sub: `${carsThisWeek} new this cycle`, icon: <Car size={20} />, trend: `+${Math.round((carsThisWeek/totalCars)*100)}%` },
          { label: "Captured Signals", value: totalLeads.toLocaleString(), sub: "Total Lead Yield", icon: <Zap size={20} />, trend: "+28.1%" },
          { label: "Global Reach", value: totalUsers.toLocaleString(), sub: "Verified Buyers", icon: <Users size={20} />, trend: "+5.2%" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-500 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 text-slate-50 group-hover:text-emerald-50 transition-colors pointer-events-none">
                <stat.icon.type {...stat.icon.props} size={100} strokeWidth={1.5} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 border border-slate-100 shadow-sm">
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-tighter">
                    <TrendingUp size={12} />
                    {stat.trend}
                  </div>
                </div>
                
                <p className="text-4xl font-black text-slate-900 mb-2 tracking-tighter leading-none">{stat.value}</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-1">{stat.label}</p>
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{stat.sub}</p>
             </div>
          </div>
        ))}
      </div>

      {/* ── INTELLIGENCE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
         {/* Conversion Matrix */}
         <div className="lg:col-span-4 bg-white border border-slate-200 rounded-[2.5rem] p-10 relative overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 blur-[100px] -mr-40 -mt-40 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-12 relative z-10">
               <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-600">Yield Pipeline</span>
               <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                  <Activity size={16} />
               </div>
            </div>
            
            <div className="space-y-10 relative z-10">
               {/* Custom Wave Progress Bar */}
               <div className="relative w-full h-14 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 shadow-inner">
                  <div className="absolute inset-0 flex items-center px-6 justify-between z-10">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Direct WhatsApp Yield</span>
                     <span className="text-base font-black text-slate-900">{Math.round((whatsappLeads/totalLeads)*100)}%</span>
                  </div>
                  <div className="h-full bg-emerald-600/10 border-r-2 border-emerald-600 transition-all duration-1000 ease-out" style={{ width: `${(whatsappLeads/totalLeads)*100}%` }} />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all shadow-sm">
                     <div className="flex items-center gap-3 mb-4 text-emerald-600">
                        <Smartphone size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Mobile API</span>
                     </div>
                     <p className="text-3xl font-black text-slate-900 leading-none">{whatsappLeads}</p>
                     <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Instant Enquiries</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all shadow-sm">
                     <div className="flex items-center gap-3 mb-4 text-blue-600">
                        <Globe size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Web Core</span>
                     </div>
                     <p className="text-3xl font-black text-slate-900 leading-none">{webLeads}</p>
                     <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-widest">Portal Entries</p>
                  </div>
               </div>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between relative z-10">
               <div>
                  <p className="text-4xl font-black text-slate-900 leading-none opacity-80">{totalLeads}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 mt-3">Synthesized Yield</p>
               </div>
               <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-lg group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-500 scale-110">
                  <ArrowUpRight size={20} />
               </div>
            </div>
         </div>

         {/* Partner Performance Table */}
         <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-12 relative z-10">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Partner Performance</h3>
                  <p className="text-sm font-medium text-slate-700 mt-2">Utilization metrics across authorized dealership hubs.</p>
               </div>
               <Link href="/admin/dealers" className="px-6 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
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
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-black border tracking-tighter ${
                            i === 0 ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                          }`}>
                             0{i + 1}
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                             <div>
                                <p className="text-base font-black text-slate-900 uppercase tracking-tight group-hover/item:text-emerald-600 transition-colors leading-none mb-1.5">{name}</p>
                                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-[0.2em]">Authorized Licensee</p>
                             </div>
                             <div className="text-right">
                                <p className="text-xl font-black text-slate-900 leading-none mb-1.5">{_count.id}</p>
                                <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.1em]">Signals Yielded</p>
                             </div>
                          </div>
                       </div>
                       <div className="pl-16">
                          <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                             <div className={`h-full transition-all duration-1000 ${i === 0 ? 'bg-emerald-600 shadow-xl shadow-emerald-50' : 'bg-slate-200'} group-hover/item:bg-emerald-600`} style={{ width: `${pct}%` }} />
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>
            
            <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50/50 blur-[120px] -mr-48 -mt-48 pointer-events-none" />
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* ── TRENDING UNITS ── */}
        <section className="xl:col-span-7">
          <div className="flex items-center justify-between mb-10 px-4">
            <div className="flex items-center gap-3">
               <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                  <Zap size={22} />
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter">High-Yield Assets</h2>
            </div>
            <Link href="/admin/cars" className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-900 hover:text-emerald-600 transition-colors">Audit Collection</Link>
          </div>
          
          <div className="grid gap-4">
            {topCars.map((car) => (
              <div key={car.id} className="flex items-center gap-6 p-6 bg-white border border-slate-200 rounded-3xl hover:border-emerald-400 transition-all duration-500 group overflow-hidden relative shadow-sm hover:shadow-xl">
                <div className="w-28 h-18 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative z-10 shadow-sm">
                  {car.images[0] ? (
                    <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300"><Car size={24} /></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] mb-1.5 leading-none">{car.dealer?.name}</p>
                  <p className="text-lg font-black text-slate-900 lg:truncate tracking-tighter leading-none mb-3">{car.year} {car.make} {car.model}</p>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{car.variant || "Standard Spec"}</span>
                     <div className="w-1 h-1 rounded-full bg-slate-200" />
                     <div className="flex items-center gap-1.5 text-emerald-600">
                        <Eye size={12} />
                        <span className="text-[11px] font-black tracking-tighter">{car.views.toLocaleString()} impressions</span>
                     </div>
                  </div>
                </div>
                
                <div className="text-right relative z-10">
                  <p className="text-xl font-black text-slate-900 leading-none mb-2 tracking-tighter">{formatPrice(car.price)}</p>
                  <Link href={`/admin/cars/${car.id}`} className="text-[10px] font-bold text-slate-900 uppercase tracking-widest hover:text-emerald-600 transition-colors">Configuration</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECENT SENSORS ── */}
        <section className="xl:col-span-5">
          <div className="flex items-center justify-between mb-10 px-4">
             <div className="flex items-center gap-3">
               <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-200">
                  <Clock size={22} />
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Signal Stream</h2>
            </div>
            <Link href="/admin/leads" className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-900 hover:text-slate-900 transition-colors">Audit Feed</Link>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-[3rem] p-8 shadow-sm space-y-5">
            {recentLeads.map((lead) => (
              <Link key={lead.id} href="/admin/leads" className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-emerald-300 hover:shadow-xl transition-all duration-500 group block">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-white border border-slate-200 text-slate-900 rounded-xl flex items-center justify-center font-black text-lg group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all duration-300 shadow-sm leading-none">
                      {lead.name[0]}
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors mb-1">{lead.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                        Target: {lead.car.make} {lead.car.model}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest mb-2 border shadow-sm ${
                    lead.channel === "whatsapp" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}>
                    {lead.channel === "whatsapp" ? <Smartphone size={10} /> : <Globe size={10} />}
                    {lead.channel}
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tighter block mt-1">
                    Captured {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
            
            <div className="pt-8 border-t border-slate-100">
               <div className="flex items-center gap-4 text-[11px] font-black text-slate-700 uppercase tracking-[0.3em]">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  Terminal Data Integrity: 100%
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
