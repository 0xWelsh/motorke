"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AdminTrendsChart({ data, rangeLabel = "Last 30 Days" }) {
  // data should be an array of objects: { date: "Mon", leads: 12, cars: 5 }
  return (
    <div className="bg-white dark:bg-[#111111] border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-16 relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Platform Engagement</h3>
          <p className="text-sm font-medium text-slate-500 mt-1">Leads vs Cars Listed ({rangeLabel})</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2F855A]" /> Leads
           </div>
           <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-900" /> Cars
           </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2F855A" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2F855A" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCars" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#64748b", fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 'bold' }}
              labelStyle={{ fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}
            />
            <Area type="monotone" dataKey="cars" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorCars)" />
            <Area type="monotone" dataKey="leads" stroke="#2F855A" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
