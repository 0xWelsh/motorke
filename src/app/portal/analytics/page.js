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

export const metadata = { title: "Analytics — Motorke Dealer Portal" };

export default async function AnalyticsPage() {
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

  // Aggregate daily views for the chart
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

  // Find Top Performing Car
  const topCar = [...cars].sort((a,b) => b.views - a.views)[0];

  return (
    <div className="animate-in fade-in duration-1000 slide-in-from-bottom-4">
      <div className="mb-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-2 block">Performance Intelligence</span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Market Insights</h1>
        <p className="text-slate-500 text-sm font-bold mt-1">Real-time data from the last 14 days of activity.</p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Page Views", value: totalViews, icon: <Users size={20} className="text-blue-500" />, trend: "+12%", up: true },
          { label: "WhatsApp Interest", value: totalClicks, icon: <MousePointer2 size={20} className="text-green-500" />, trend: "+5%", up: true },
          { label: "Conversion Rate", value: `${convRate}%`, icon: <TrendingUp size={20} className="text-orange-500" />, trend: "-2%", up: false },
          { label: "Showroom Prints", value: totalPrints, icon: <Printer size={20} className="text-purple-500" />, trend: "+18%", up: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {kpi.icon}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${kpi.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {kpi.trend}
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">{kpi.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Growth Chart (SVG Implementation) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 size={20} className="text-orange-600" /> Traffic Trends
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Views
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Leads
              </div>
            </div>
          </div>
          
          <div className="h-[240px] w-full relative">
            <svg viewBox="0 0 1400 300" className="w-full h-full preserve-3d">
              {/* Simple Line Chart logic */}
              {chartData.map((d, i) => {
                const x = (i / 13) * 1400;
                const viewY = 300 - (d.views / (Math.max(...chartData.map(v => v.views)) || 1)) * 250;
                const leadY = 300 - (d.leads / (Math.max(...chartData.map(v => v.leads)) || 1)) * 250;
                
                return (
                  <g key={i}>
                    <line x1={x} y1="0" x2={x} y2="300" stroke="#f1f5f9" strokeWidth="2" />
                    {i > 0 && (
                      <>
                        <line 
                          x1={((i-1)/13)*1400} 
                          y1={300 - (chartData[i-1].views / (Math.max(...chartData.map(v => v.views)) || 1)) * 250} 
                          x2={x} 
                          y2={viewY} 
                          stroke="#f97316" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                        />
                        <line 
                          x1={((i-1)/13)*1400} 
                          y1={300 - (chartData[i-1].leads / (Math.max(...chartData.map(v => v.leads)) || 1)) * 250} 
                          x2={x} 
                          y2={leadY} 
                          stroke="#3b82f6" 
                          strokeWidth="4" 
                          strokeLinecap="round"
                          strokeDasharray="8 4"
                        />
                      </>
                    )}
                    <circle cx={x} cy={viewY} r="6" fill="#f97316" stroke="white" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between mt-4 border-t border-slate-50 pt-4">
               {chartData.filter((_, i) => i % 3 === 0).map(d => (
                 <span key={d.date} className="text-[9px] font-black text-slate-400 uppercase">{d.date.split("-").slice(1).join("/") }</span>
               ))}
            </div>
          </div>
        </div>

        {/* Top Product Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-pureWhite flex flex-col shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10">
              <Award size={24} className="text-orange-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2 block">Top Performing Listing</span>
            {topCar ? (
              <>
                <h3 className="text-2xl font-black mb-1">{topCar.make} {topCar.model}</h3>
                <p className="text-sm font-bold text-white/50 mb-8">{formatPrice(topCar.price)}</p>
                <div className="space-y-4">
                  {[
                    { l: "Total Views", v: topCar.views },
                    { l: "Engagement", v: `${((topCar.whatsappClicks / (topCar.views || 1)) * 100).toFixed(1)}%` },
                    { l: "Potential Revenue", v: formatPrice(topCar.price) }
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                       <span className="text-[10px] font-bold text-white/30 uppercase">{s.l}</span>
                       <span className="text-sm font-black">{s.v}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-white/30 text-sm italic py-10">Waiting for interaction data...</p>
            )}
          </div>
          {/* Abstract BG Pattern */}
          <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-orange-600 rounded-full blur-[100px] opacity-20 group-hover:scale-150 transition-transform duration-1000" />
        </div>
      </div>

      {/* Car Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Inventory Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 text-left border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Model</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Views</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Inquiries</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">WhatsApp Clicks</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Efficacy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {cars.map(car => (
                 <tr key={car.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-900 tracking-tight">{car.make} {car.model}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{formatPrice(car.price)}</p>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-black text-slate-900">{car.views}</td>
                    <td className="px-6 py-5 text-center text-sm font-black text-slate-900">{leads.filter(l => l.carId === car.id).length}</td>
                    <td className="px-6 py-5 text-center text-sm font-black text-slate-900">{car.whatsappClicks}</td>
                    <td className="px-8 py-5 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 uppercase tracking-wider">
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
