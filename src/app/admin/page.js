// src/app/admin/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
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

export const metadata = { title: "Admin Dashboard — Motorske" };

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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Administration</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
             Platform <span className="text-emerald-500">Dashboard</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Platform-wide inventory and performance analytics.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <Link href="/admin/cars/new" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md group">
             <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" /> Add Car
           </Link>
           <Link href="/admin/dealers/new" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
             <Building2 size={16} /> Add Dealer
           </Link>
        </div>
      </div>

      {/* ── KPI SECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
        {[
          { label: "Inventory Value", value: formatCompact(totalValue), sub: "Total dealer stock", icon: <BarChart3 size={20} />, trend: "+12.4%" },
          { label: "Active Listings", value: totalCars.toLocaleString(), sub: `${carsThisWeek} new this week`, icon: <Car size={20} />, trend: `+${Math.round((carsThisWeek/totalCars)*100) || 0}%` },
          { label: "Leads Captured", value: totalLeads.toLocaleString(), sub: "Total inquiries", icon: <Zap size={20} />, trend: "+28.1%" },
          { label: "Verified Buyers", value: totalUsers.toLocaleString(), sub: "Registered accounts", icon: <Users size={20} />, trend: "+5.2%" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 text-slate-50 dark:text-slate-800/50 group-hover:text-emerald-50 dark:group-hover:text-emerald-950/30 transition-colors pointer-events-none">
                <stat.icon.type {...stat.icon.props} size={80} strokeWidth={1} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-slate-100 dark:border-slate-700 shadow-sm">
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                    <TrendingUp size={12} />
                    {stat.trend}
                  </div>
                </div>
                
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight leading-none">{stat.value}</p>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{stat.sub}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="mb-16">
         <AnalyticsDashboard realtimeLeads={totalLeads} />
      </div>

      {/* ── INTELLIGENCE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
         {/* Conversion Matrix */}
         <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm group">
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <span className="text-sm font-bold text-slate-900 dark:text-white">Lead Sources</span>
               <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                  <Activity size={14} />
               </div>
            </div>
            
            <div className="space-y-6 relative z-10">
               <div className="relative w-full h-10 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden border border-slate-100 dark:border-slate-700">
                  <div className="absolute inset-0 flex items-center px-4 justify-between z-10">
                     <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">WhatsApp Shares</span>
                     <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.round((whatsappLeads/totalLeads)*100) || 0}%</span>
                  </div>
                  <div className="h-full bg-emerald-500/20 border-r border-emerald-500 transition-all duration-1000 ease-out" style={{ width: `${(whatsappLeads/totalLeads)*100}%` }} />
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                     <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                        <Smartphone size={16} />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">WhatsApp</span>
                     </div>
                     <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{whatsappLeads}</p>
                     <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Direct inquiries</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                     <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                        <Globe size={16} />
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Website</span>
                     </div>
                     <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{webLeads}</p>
                     <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1">Form submissions</p>
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between relative z-10">
               <div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{totalLeads}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Total Inquiries Generated</p>
               </div>
               <Link href="/admin/leads" className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 text-slate-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all">
                  <ArrowUpRight size={16} />
               </Link>
            </div>
         </div>

         {/* Partner Performance Table */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
               <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Dealership Engagement</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Lead volume by dealership.</p>
               </div>
               <Link href="/admin/dealers" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 transition-colors">
                  View All
               </Link>
            </div>
            
            <div className="space-y-6 relative z-10">
               {leadsByDealer.map(({ dealerId, _count }, i) => {
                  const name  = dealerMap[dealerId] || "Unknown Node";
                  const pct   = Math.round((_count.id / (leadsByDealer[0]?._count?.id || 1)) * 100);
                  return (
                    <div key={dealerId} className="group/item">
                       <div className="flex items-center gap-4 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${
                            i === 0 ? "bg-emerald-500 text-white border-emerald-500" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700"
                          }`}>
                             {i + 1}
                          </div>
                          <div className="flex-1 flex justify-between items-center">
                             <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered Partner</p>
                             </div>
                             <div className="text-right">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{_count.id}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leads</p>
                             </div>
                          </div>
                       </div>
                       <div className="pl-12">
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${i === 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'} group-hover/item:bg-emerald-500`} style={{ width: `${pct}%` }} />
                          </div>
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* ── TRENDING UNITS ── */}
        <section className="xl:col-span-7">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Car size={20} />
               </div>
               <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Most Viewed Cars</h2>
            </div>
            <Link href="/admin/cars" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">View All Cars</Link>
          </div>
          
          <div className="grid gap-4">
            {topCars.map((car) => (
              <div key={car.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all duration-300 group overflow-hidden shadow-sm">
                <div className="w-24 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                  {car.images[0] ? (
                    <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-600"><Car size={20} /></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 truncate">{car.dealer?.name}</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white truncate tracking-tight mb-1">{car.year} {car.make} {car.model}</p>
                  <div className="flex items-center gap-3">
                     <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{car.variant || "Standard"}</span>
                     <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                        <Eye size={12} />
                        <span className="text-[10px] font-medium">{car.views.toLocaleString()} views</span>
                     </div>
                  </div>
                </div>
                
                <div className="text-right pl-4">
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-none mb-1">{formatPrice(car.price)}</p>
                  <Link href={`/admin/cars/${car.id}`} className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Edit Details</Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RECENT SENSORS ── */}
        <section className="xl:col-span-5">
          <div className="flex items-center justify-between mb-8 px-2">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <Clock size={20} />
               </div>
               <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Recent Inquiries</h2>
            </div>
            <Link href="/admin/leads" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">View All Leads</Link>
          </div>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            {recentLeads.map((lead) => (
              <Link key={lead.id} href="/admin/leads" className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 transition-colors group block">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg flex items-center justify-center font-bold group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                      {lead.name[0]}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight mb-0.5">{lead.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        Looking for: {lead.car.make} {lead.car.model}
                      </p>
                   </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-1`}>
                    {lead.channel === "whatsapp" ? <Smartphone size={10} /> : <Globe size={10} />}
                    {lead.channel === "whatsapp" ? "WhatsApp" : "Website"}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </Link>
            ))}
            
            <div className="pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  System Status: Online
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
