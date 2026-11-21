"use client";
import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AnalyticsDashboard({ realtimeLeads = 0, recentDays = 30 }) {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Generate synthetic realistic 30-day data
    // in a real app, this would be computed by an API grouped by date
    const generated = [];
    let baseViews = 450;
    let baseLeads = Math.max(1, Math.floor(realtimeLeads / recentDays));
    
    for (let i = recentDays; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      // randomize slightly
      const bounce = Math.random() * 0.4 - 0.2; // -20% to +20%
      const dayViews = Math.floor(baseViews * (1 + bounce));
      const dayLeads = Math.max(0, Math.floor(baseLeads * (1 + (bounce * 2))));
      
      // general upward trend
      baseViews *= 1.02;
      
      generated.push({
        name: d.toLocaleDateString("en-KE", { day: 'numeric', month: 'short' }),
        Impressions: dayViews,
        Signals: dayLeads * 3 // Multiply to make it visible on the same axis scale, or use composed chart
      });
    }
    setData(generated);
  }, [realtimeLeads, recentDays]);

  return (
    <div className="w-full bg-[#1c1c1c] border border-white/[0.06] rounded-xl p-8 shadow-sm hover:shadow-2xl transition-all duration-500 hover:border-[var(--accent)]/20">
      <div className="mb-8">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-surface shadow-[0_0_8px_rgba(255,255,255,0.15)] animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted">Return On Investment (ROI)</span>
         </div>
         <h2 className="text-3xl font-black text-text tracking-tighter">Yield & Impressions Trend</h2>
         <p className="text-sm font-medium text-muted mt-1 tracking-wide">30-day trailing tracking of platform engagement.</p>
      </div>
      
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e4e4e7" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#e4e4e7" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 700 }} dy={15} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 700 }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 700 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '1.5rem', border: '1px solid #27272a', background: '#262626', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.4)' }}
              itemStyle={{ fontSize: '13px', fontWeight: 800 }}
              labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#a1a1aa', marginBottom: '8px' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 800, paddingTop: '20px', textTransform: 'uppercase', tracking: '0.1em' }} />
            <Area yAxisId="left" type="monotone" name="Global Impressions" dataKey="Impressions" stroke="#e4e4e7" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
            <Area yAxisId="right" type="monotone" name="Captured Signals" dataKey="Signals" stroke="#4ade80" strokeWidth={4} fillOpacity={1} fill="url(#colorLeads)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
