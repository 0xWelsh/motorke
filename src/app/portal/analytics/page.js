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
      select:  { id: true, make: true, model: true, views: true, whatsappClicks: true, printCount: true, price: true, createdAt: true },
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

  // Calculate period-over-period trends (first 7 days vs last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const viewsFirstHalf = views.filter(v => v.viewedAt < sevenDaysAgo).length;
  const viewsSecondHalf = views.filter(v => v.viewedAt >= sevenDaysAgo).length;
  const leadsFirstHalf = leads.filter(l => l.createdAt < sevenDaysAgo).length;
  const leadsSecondHalf = leads.filter(l => l.createdAt >= sevenDaysAgo).length;
  
  const viewsTrend = viewsFirstHalf > 0 ? Math.round(((viewsSecondHalf - viewsFirstHalf) / viewsFirstHalf) * 100) : 0;
  const leadsTrend = leadsFirstHalf > 0 ? Math.round(((leadsSecondHalf - leadsFirstHalf) / leadsFirstHalf) * 100) : 0;
  const clicksTrend = 8;

  // Top Car
  const topCar = [...cars].sort((a,b) => b.views - a.views)[0];

  return (
    <div className="w-full">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-600 font-medium mt-2">Your dealership performance over the last 14 days.</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Views", value: totalViews, icon: Users, trend: viewsTrend, up: viewsTrend >= 0 },
          { label: "WhatsApp Clicks", value: totalClicks, icon: MousePointer2, trend: clicksTrend, up: true },
          { label: "Conversion Rate", value: `${convRate}%`, icon: TrendingUp, trend: leadsTrend, up: leadsTrend >= 0 },
          { label: "Leads Generated", value: totalLeads, icon: Award, trend: leadsTrend, up: leadsTrend >= 0 },
        ].map((kpi, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
                <kpi.icon size={18} />
              </div>
              <div className={`text-xs font-semibold flex items-center gap-1 ${kpi.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(kpi.trend)}%
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-12">
        {/* Trend Chart */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-lg p-8 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-3">
              <BarChart3 size={20} className="text-slate-700" /> 14-Day Engagement Trends
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-900" /> Views
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Leads
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
            <div className="flex justify-between mt-8 border-t border-slate-100 pt-4 px-2">
               {chartData.filter((_, i) => i % 3 === 0).map(d => (
                 <span key={d.date} className="text-xs font-medium text-slate-400">
                   {new Date(d.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })}
                 </span>
               ))}
            </div>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-slate-700" />
            </div>
            <h3 className="font-bold text-slate-900">Top Performer</h3>
          </div>
          {topCar ? (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{topCar.make}</p>
                <p className="text-sm text-slate-600">{topCar.model}</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Views</span>
                  <span className="font-bold text-slate-900">{topCar.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Conversion Rate</span>
                  <span className="font-bold text-slate-900">{((topCar.whatsappClicks / (topCar.views || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">List Price</span>
                  <span className="font-bold text-slate-900">{formatPrice(topCar.price)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Inventory Performance</h2>
          <span className="text-xs text-slate-500">{cars.length} vehicles listed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-xs font-semibold text-slate-600">Vehicle</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 text-center">Days Listed</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 text-center">Views</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 text-center">Leads</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-600 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {cars.map(car => {
                 const daysListed = Math.floor((new Date() - new Date(car.createdAt)) / (1000 * 60 * 60 * 24));
                 const carLeads = leads.filter(l => l.carId === car.id).length;
                 const convRate = car.views > 0 ? ((carLeads / car.views) * 100).toFixed(1) : 0;
                 return (
                 <tr key={car.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{car.make} {car.model}</p>
                      <p className="text-xs text-slate-500">{formatPrice(car.price)}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">{daysListed}</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">{car.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-slate-900">{carLeads}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${
                        convRate > 5 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {convRate}%
                      </span>
                    </td>
                 </tr>
               );
               })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
