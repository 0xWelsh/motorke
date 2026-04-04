// src/app/portal/analytics/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  MousePointer2, 
  Printer, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from "lucide-react";

export const metadata = { title: "Analytics — Motorke Dealer Portal" };export default async function AnalyticsPage() {
  const user = await requireDealer();

  // Fetch data for the last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [cars, views, leads] = await Promise.all([
    db.car.findMany({
      where:   { dealerId: user.dealerId },
      select:  { id: true, make: true, model: true, views: true, whatsappClicks: true, printCount: true, price: true },
    }),
    db.carView.findMany({
      where: { 
        car: { dealerId: user.dealerId },
        viewedAt: { gte: fourteenDaysAgo }
      },
      orderBy: { viewedAt: "asc" }
    }),
    db.lead.findMany({
      where: { 
        dealerId: user.dealerId,
        createdAt: { gte: fourteenDaysAgo }
      }
    })
  ]);

  // Aggregate daily data
  const dailyData = {};
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyData[dateStr] = { views: 0, leads: 0 };
  }

  views.forEach(v => {
    const dateStr = v.viewedAt.toISOString().split("T")[0];
    if (dailyData[dateStr]) dailyData[dateStr].views++;
  });

  leads.forEach(l => {
    const dateStr = l.createdAt.toISOString().split("T")[0];
    if (dailyData[dateStr]) dailyData[dateStr].leads++;
  });

  const chartData = Object.entries(dailyData)
    .sort((a,b) => a[0].localeCompare(b[0]))
    .map(([date, val]) => ({ date, ...val }));

  // Summary Metrics
  const totalViews  = cars.reduce((acc, c) => acc + c.views, 0);
  const totalClicks = cars.reduce((acc, c) => acc + c.whatsappClicks, 0);
  const totalPrints = cars.reduce((acc, c) => acc + c.printCount, 0);
  const totalLeads  = leads.length;
  const convRate    = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : 0;

  // Top Car
  const topCar = [...cars].sort((a,b) => b.views - a.views)[0];

  return (
    <div className="animate-in fade-in duration-1000 max-w-7xl">
      <div className="mb-12">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--brand)] mb-2.5 block">Market Intelligence</span>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Performance Insights</h1>
        <p className="text-slate-500 font-bold mt-2">Aggregated dealership analytics for the rolling 14-day window.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { label: "Market Visibility", value: totalViews, icon: Users, color: "text-blue-500", bg: "bg-blue-50", trend: "+12%", up: true },
          { label: "WhatsApp Leads", value: totalClicks, icon: MousePointer2, color: "text-emerald-500", bg: "bg-emerald-50", trend: "+5%", up: true },
          { label: "Enquiry Velocity", value: `${convRate}%`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50", trend: "-2%", up: false },
          { label: "Digital Print-outs", value: totalPrints, icon: Printer, color: "text-slate-400", bg: "bg-slate-50", trend: "+18%", up: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 ${kpi.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full ${kpi.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {kpi.trend}
              </div>
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tighter mb-1">{kpi.value.toLocaleString()}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        {/* Trend Chart */}
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 size={24} className="text-[var(--brand)]" /> Engagement Trends
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[var(--brand)]" /> Page Views
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Direct Enquiries
              </div>
            </div>
          </div>
          
          <div className="h-[280px] w-full relative">
            <svg viewBox="0 0 1400 300" className="w-full h-full" preserveAspectRatio="none">
              {chartData.map((d, i) => {
                const x = (i / 13) * 1400;
                const viewY = 300 - (d.views / (Math.max(...chartData.map(v => v.views)) || 1)) * 250;
                const leadY = 300 - (d.leads / (Math.max(...chartData.map(v => v.leads)) || 1)) * 250;
                
                return (
                  <g key={i}>
                    <line x1={x} y1="0" x2={x} y2="300" stroke="#f8fafc" strokeWidth="2" />
                    {i > 0 && (
                      <>
                        <line 
                          x1={((i-1)/13)*1400} 
                          y1={300 - (chartData[i-1].views / (Math.max(...chartData.map(v => v.views)) || 1)) * 250} 
                          x2={x} 
                          y2={viewY} 
                          stroke="var(--brand)" 
                          strokeWidth="5" 
                          strokeLinecap="round"
                        />
                        <line 
                          x1={((i-1)/13)*1400} 
                          y1={300 - (chartData[i-1].leads / (Math.max(...chartData.map(v => v.leads)) || 1)) * 250} 
                          x2={x} 
                          y2={leadY} 
                          stroke="#3b82f6" 
                          strokeWidth="3" 
                          strokeLinecap="round"
                          strokeDasharray="8 4"
                        />
                      </>
                    )}
                    <circle cx={x} cy={viewY} r="7" fill="var(--brand)" stroke="white" strokeWidth="3" className="shadow-lg" />
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between mt-8 border-t border-slate-50 pt-6 px-2">
               {chartData.filter((_, i) => i % 3 === 0).map(d => (
                 <span key={d.date} className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                   {new Date(d.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })}
                 </span>
               ))}
            </div>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-10 border border-white/10">
              <Award size={28} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 mb-3 block">Showroom MVP</span>
            {topCar ? (
              <>
                <h3 className="text-3xl font-black mb-1 leading-tight tracking-tight uppercase">{topCar.make}</h3>
                <h4 className="text-xl font-bold text-white/50 mb-10">{topCar.model}</h4>
                
                <div className="space-y-6 mt-auto">
                  {[
                    { l: "Unique Views", v: topCar.views },
                    { l: "Global Efficacy", v: `${((topCar.whatsappClicks / (topCar.views || 1)) * 100).toFixed(1)}%` },
                    { l: "Asset Value", v: formatPrice(topCar.price) }
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-4">
                       <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest font-mono">{s.l}</span>
                       <span className="text-base font-black text-white">{s.v}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/10 rounded-[2rem] p-8">
                 <p className="text-white/20 text-xs font-black uppercase tracking-widest text-center">Crunching Data Models...</p>
              </div>
            )}
          </div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-emerald-500 rounded-full blur-[120px] opacity-20 group-hover:scale-125 transition-transform duration-1000" />
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Showroom Breakdown</h2>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Inventory Units</span>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle Spec</th>
                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Impressions</th>
                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Interest</th>
                <th className="px-6 py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Efficacy Velocity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {cars.map(car => (
                 <tr key={car.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-6">
                      <p className="text-sm font-black text-slate-900 tracking-tight mb-1 group-hover:text-[var(--brand)] transition-colors">{car.make} {car.model}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatPrice(car.price)}</p>
                    </td>
                    <td className="px-6 py-6 text-center text-sm font-black text-slate-900">{car.views.toLocaleString()}</td>
                    <td className="px-6 py-6 text-center text-sm font-black text-slate-900">{leads.filter(l => l.carId === car.id).length} Enquiries</td>
                    <td className="px-6 py-6 text-right">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                        (car.whatsappClicks / (car.views || 1)) > 0.05 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {((car.whatsappClicks / (car.views || 1)) * 100).toFixed(1)}% Conversion
                      </span>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
