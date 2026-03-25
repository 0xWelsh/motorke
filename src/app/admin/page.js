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
  Upload, 
  UserPlus, 
  ChevronRight,
  Eye,
  Smartphone,
  Globe,
  ArrowUpRight
} from "lucide-react";

export const metadata = { title: "Admin Dashboard — Motorke System" };

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

  // Enrich leadsByDealer with dealer names
  const dealerIds   = leadsByDealer.map(l => l.dealerId);
  const dealerNames = await db.dealer.findMany({ where: { id: { in: dealerIds } }, select: { id: true, name: true } });
  const dealerMap   = Object.fromEntries(dealerNames.map(d => [d.id, d.name]));

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600 mb-2 block">System Intelligence</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Platform Overview</h1>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Quick Action Pills */}
           <Link href="/admin/cars/new" className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10">
             <Plus size={16} /> New listing
           </Link>
           <Link href="/admin/dealers/new" className="bg-white border border-slate-200 text-slate-900 px-6 py-3 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
             <Building2 size={16} /> Add Dealer
           </Link>
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Live Inventory", value: totalCars, sub: `+${carsThisWeek} this week`, icon: <Car />, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Verified Dealers", value: totalDealers, sub: "Partner Dealerships", icon: <Building2 />, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Buyer Enquiries", value: totalLeads, sub: `+${leadsThisWeek} this week`, icon: <MessageSquare />, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Market Reach", value: totalUsers, sub: "Registered Buyers", icon: <Users />, color: "text-indigo-500", bg: "bg-indigo-50" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-300 group">
             <div className="flex items-center justify-between mb-6">
               <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                 {stat.icon}
               </div>
               <ArrowUpRight size={20} className="text-slate-200 group-hover:text-amber-500 transition-colors" />
             </div>
             <p className="text-4xl font-black text-slate-900 mb-1">{stat.value.toLocaleString()}</p>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{stat.label}</p>
             <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{stat.sub}</span>
             </div>
          </div>
        ))}
      </div>

      {/* ── CHANNEL & GROWTH ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         <div className="col-span-1 bg-slate-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-6 block">Conversion Channels</span>
            <div className="space-y-8">
               <div>
                  <div className="flex items-center justify-between mb-3">
                     <p className="text-sm font-bold flex items-center gap-2"><Smartphone size={16} className="text-emerald-500" /> WhatsApp</p>
                     <p className="text-xl font-black text-emerald-500">{whatsappLeads}</p>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{ width: `${(whatsappLeads/totalLeads)*100}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-3">
                     <p className="text-sm font-bold flex items-center gap-2"><Globe size={16} className="text-blue-500" /> Web Forms</p>
                     <p className="text-xl font-black text-blue-500">{webLeads}</p>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${(webLeads/totalLeads)*100}%` }} />
                  </div>
               </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-10 leading-relaxed uppercase tracking-tighter">
               Total {totalLeads} enquiries captured in system
            </p>
         </div>

         {/* Enquiries by Dealer Table */}
         <div className="col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Performance by Dealer</h3>
               <Link href="/admin/dealers" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors">Full Report</Link>
            </div>
            <div className="space-y-6">
               {leadsByDealer.map(({ dealerId, _count }, i) => {
                  const name  = dealerMap[dealerId] || "Unknown";
                  const pct   = Math.round((_count.id / leadsByDealer[0]._count.id) * 100);
                  return (
                    <div key={dealerId} className="group">
                       <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-black text-slate-700">{name}</p>
                          <p className="text-sm font-black text-slate-900">{_count.id} <span className="text-[10px] text-slate-300 font-bold uppercase ml-1">leads</span></p>
                       </div>
                       <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
                       </div>
                    </div>
                  );
               })}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* ── TOP CARS BY VIEWS ── */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Trending Vehicles</h2>
            <Link href="/admin/cars" className="text-[10px] font-black uppercase tracking-widest text-slate-400">View All</Link>
          </div>
          <div className="p-4 space-y-2">
            {topCars.map((car) => (
              <div key={car.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-[1.5rem] transition-colors group">
                <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden ring-1 ring-slate-200 shrink-0">
                  {car.images[0] ? <img src={car.images[0].url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="flex items-center justify-center h-full text-slate-300 font-black italic text-[10px]">NA</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">{car.year} {car.make} {car.model}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">{car.dealer?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-amber-600 leading-none mb-1">{formatPrice(car.price)}</p>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter flex items-center justify-end gap-1">
                    <Eye size={10} /> {car.views}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RECENT ENQUIRIES ── */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Enquiries</h2>
            <Link href="/admin/leads" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage Leads</Link>
          </div>
          <div className="p-4 space-y-2">
            {recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-[1.5rem] transition-colors group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center font-black text-amber-500">
                      {lead.name[0]}
                   </div>
                   <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">{lead.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[150px]">
                        {lead.car.year} {lead.car.make} {lead.car.model}
                      </p>
                   </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider mb-1 ${
                    lead.channel === "whatsapp" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                  }`}>
                    {lead.channel === "whatsapp" ? <Smartphone size={10} /> : <Globe size={10} />}
                    {lead.channel}
                  </span>
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                    {new Date(lead.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}