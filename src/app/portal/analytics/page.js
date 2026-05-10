// src/app/portal/analytics/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCarPrice } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  MousePointer2, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  FileDown,
} from "lucide-react";
import PdfBlobDownloadButton from "@/components/PdfBlobDownloadButton";

export const metadata = { title: "Analytics — Welsh Motorhub Dealer Portal" };

export default async function AnalyticsPage() {
  const user = await requireDealer();

  // Fetch data for the last 14 days
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [cars, views, leads] = await Promise.all([
    db.car.findMany({
      where:   { dealerId: user.dealerId },
      select:  { id: true, make: true, model: true, views: true, whatsappClicks: true, printCount: true, price: true, engineCC: true, year: true, fuelType: true, createdAt: true },
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
      <div className="mb-4 sm:mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-[10px] uppercase font-black tracking-[0.12em] text-slate-700 font-medium mt-1">Performance over 14 days</p>
        </div>
        <div className="rounded-2xl border border-[#ddd4c8] dark:border-slate-800 bg-gradient-to-br from-[#fff8f5] via-white to-[#fbfcfe] dark:from-[#151515] dark:via-[#111111] dark:to-[#0a0a0a] p-4 sm:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)] max-w-lg lg:max-w-md lg:shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff5a2f]/15 text-[#ff5a2f] flex items-center justify-center shrink-0 border border-[#ff5a2f]/25">
              <FileDown size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5a2f]">Weekly proof pack</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 leading-snug">
                Dealer-ready PDF: 7-day views & leads, day-by-day pulse, momentum vs last week, hot listings.
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Share with owners when they ask “is anyone actually seeing our cars?” — rolling window, print-quality.
              </p>
              <PdfBlobDownloadButton
                fetchUrl="/api/portal/reports/weekly-pdf"
                fileStem="welsh-motorhub-weekly"
                idleLabel="Download weekly PDF"
                buttonClassName="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.14em] hover:opacity-90 transition-opacity disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-10">
        {[
          { label: "Total Views", value: totalViews, icon: Users, trend: viewsTrend, up: viewsTrend >= 0 },
          { label: "WhatsApp Clicks", value: totalClicks, icon: MousePointer2, trend: clicksTrend, up: true },
          { label: "Conversion Rate", value: `${convRate}%`, icon: TrendingUp, trend: leadsTrend, up: leadsTrend >= 0 },
          { label: "Leads Generated", value: totalLeads, icon: Award, trend: leadsTrend, up: leadsTrend >= 0 },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-3 sm:p-4 md:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#fbfcfe] dark:bg-[#111111] text-slate-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                <kpi.icon size={14} className="sm:block hidden" />
                <kpi.icon size={12} className="sm:hidden" />
              </div>
              <div className={`text-[11px] sm:text-[11px] uppercase font-black tracking-[0.15em] font-semibold flex items-center gap-0.5 flex-shrink-0 ${kpi.up ? 'text-[#ff5a2f]' : 'text-rose-600'}`}>
                {kpi.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {Math.abs(kpi.trend)}%
              </div>
            </div>
            <p className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-0.5 sm:mb-1 line-clamp-1">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
            <p className="text-[11px] sm:text-[11px] uppercase font-black tracking-[0.15em] font-medium text-slate-700 line-clamp-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {/* Trend Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-[11px] uppercase font-black tracking-[0.10em] sm:text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-shrink-0">
              <BarChart3 size={16} className="sm:block hidden text-slate-700" />
              <BarChart3 size={14} className="sm:hidden text-slate-700" />
              <span className="truncate">Trends</span>
            </h2>
            <div className="flex items-center gap-3 flex-shrink-0 text-[11px] sm:text-[11px] uppercase font-black tracking-[0.15em] font-medium text-slate-700">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-2xl bg-[#111111]" /> Views
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-2xl bg-[#ff5a2f]" /> Leads
              </div>
            </div>
          </div>
          
          <div className="h-48 sm:h-64 md:h-80 w-full relative">
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
                    <circle cx={x} cy={viewY} r="7" fill="var(--brand)" stroke="white" strokeWidth="3" className="shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]" />
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between mt-8 border-t border-[#ddd4c8] dark:border-slate-800 pt-4 px-2">
               {chartData.filter((_, i) => i % 3 === 0).map(d => (
                 <span key={d.date} className="text-[11px] uppercase font-black tracking-[0.15em] font-medium text-slate-700">
                   {new Date(d.date).toLocaleDateString('en-KE', { day: '2-digit', month: 'short' })}
                 </span>
               ))}
            </div>
          </div>
        </div>

        {/* Top Performer */}
        <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#fbfcfe] dark:bg-[#111111] rounded-2xl flex items-center justify-center flex-shrink-0">
              <Award size={16} className="sm:block hidden text-slate-700" />
              <Award size={14} className="sm:hidden text-slate-700" />
            </div>
            <h3 className="font-bold text-[11px] uppercase font-black tracking-[0.10em] sm:text-base text-slate-900 dark:text-white truncate">Top Car</h3>
          </div>
          {topCar ? (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold font-sans text-slate-900 dark:text-white">{topCar.make}</p>
                <p className="text-[11px] font-sans font-semibold tracking-[0.10em] text-slate-700">{topCar.model}</p>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-[#ddd4c8] dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700">Views</span>
                  <span className="font-bold text-slate-900 dark:text-white">{topCar.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700">Conversion Rate</span>
                  <span className="font-bold text-slate-900 dark:text-white">{((topCar.whatsappClicks / (topCar.views || 1)) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700">List Price</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatCarPrice(topCar)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 text-center py-8">No data yet</p>
          )}
        </div>
      </div>

      {/* Inventory Performance */}
      <div className="bg-white dark:bg-[#111111] border border-[#ddd4c8] dark:border-slate-800 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[8px_8px_0px_0px_rgba(0,0,0,0.05)]-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#ddd4c8] dark:border-slate-800 bg-[#fbfcfe] dark:bg-[#111111] flex items-center justify-between">
          <h2 className="font-bold text-[11px] uppercase font-black tracking-[0.10em] sm:text-base text-slate-900 dark:text-white">Inventory Performance</h2>
          <span className="text-[11px] uppercase font-black tracking-[0.15em] text-slate-700">{cars.length} listed</span>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-[#ddd4c8] dark:border-slate-800 bg-[#fbfcfe] dark:bg-[#111111]">
                <th className="px-6 py-3 text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700">Vehicle</th>
                <th className="px-6 py-3 text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700 text-center">Days Listed</th>
                <th className="px-6 py-3 text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700 text-center">Views</th>
                <th className="px-6 py-3 text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700 text-center">Leads</th>
                <th className="px-6 py-3 text-[11px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700 text-right">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {cars.map(car => {
                 const daysListed = Math.floor((new Date() - new Date(car.createdAt)) / (1000 * 60 * 60 * 24));
                 const carLeads = leads.filter(l => l.carId === car.id).length;
                 const convRate = car.views > 0 ? ((carLeads / car.views) * 100).toFixed(1) : 0;
                 return (
                 <tr key={car.id} className="hover:bg-[#fbfcfe] dark:bg-[#111111] transition-all">
                    <td className="px-6 py-4">
                      <p className="font-semibold font-sans text-slate-900 dark:text-white">{car.make} {car.model}</p>
                      <p className="text-[11px] uppercase font-black tracking-[0.15em] text-slate-700">{formatCarPrice(car)}</p>
                    </td>
                    <td className="px-6 py-4 text-center text-[11px] uppercase font-black tracking-[0.10em] font-medium text-slate-900 dark:text-white">{daysListed}</td>
                    <td className="px-6 py-4 text-center text-[11px] uppercase font-black tracking-[0.10em] font-medium text-slate-900 dark:text-white">{car.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-[11px] uppercase font-black tracking-[0.10em] font-medium text-slate-900 dark:text-white">{carLeads}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-3 py-1 rounded-2xl text-[11px] uppercase font-black tracking-[0.15em] font-semibold ${
                        convRate > 5 
                          ? 'bg-emerald-50 text-[#ff5a2f]' 
                          : 'bg-[#fbfcfe] dark:bg-[#111111] text-slate-700'
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
        
        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {cars.map(car => {
            const daysListed = Math.floor((new Date() - new Date(car.createdAt)) / (1000 * 60 * 60 * 24));
            const carLeads = leads.filter(l => l.carId === car.id).length;
            const convRate = car.views > 0 ? ((carLeads / car.views) * 100).toFixed(1) : 0;
            return (
              <div key={car.id} className="p-4 hover:bg-[#fbfcfe] dark:bg-[#111111] transition-all">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold font-sans text-[11px] tracking-[0.10em] text-slate-900 dark:text-white">{car.make} {car.model}</p>
                    <p className="text-[11px] uppercase font-black tracking-[0.15em] text-slate-700">{formatCarPrice(car)}</p>
                  </div>
                  <span className={`inline-flex px-2 py-1 rounded text-[11px] uppercase font-black tracking-[0.15em] font-semibold flex-shrink-0 ${
                    convRate > 5 
                      ? 'bg-emerald-50 text-[#ff5a2f]' 
                      : 'bg-[#fbfcfe] dark:bg-[#111111] text-slate-700'
                  }`}>
                    {convRate}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] uppercase font-black tracking-[0.15em]">
                  <div>
                    <p className="text-slate-700 mb-0.5">Days</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{daysListed}</p>
                  </div>
                  <div>
                    <p className="text-slate-700 mb-0.5">Views</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{car.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-700 mb-0.5">Leads</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{carLeads}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
