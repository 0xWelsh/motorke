"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const darkTooltip = {
  contentStyle: {
    borderRadius: "8px",
    border: "1px solid #27272a",
    background: "#262626",
    padding: "8px 12px",
    fontSize: "12px",
  },
  itemStyle: { fontWeight: 700, padding: "2px 0" },
  labelStyle: { fontWeight: 600, color: "#a1a1aa", marginBottom: "4px", fontSize: "11px" },
};

const LEGEND_STYLE = { fontSize: "10px", fontWeight: 700, color: "#71717a", paddingTop: "8px" };

export default function GrowthCharts({ weeklyChart, userChart, statusPipeline, channelBreakdown }) {
  return (
    <div className="space-y-4">

      {/* Main chart: Listings + Leads + Views */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Listings, Leads & Views — Weekly</h3>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyChart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }}
              />
              <Tooltip {...darkTooltip} />
              <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={6} />
              <Area yAxisId="left" type="monotone" dataKey="cars" name="Listings" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gc)" />
              <Area yAxisId="left" type="monotone" dataKey="leads" name="Leads" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gl)" />
              <Area yAxisId="right" type="monotone" dataKey="views" name="Views" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Lead pipeline + User signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Lead pipeline */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Lead Pipeline</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusPipeline} layout="vertical" margin={{ left: -12, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }} />
                <YAxis type="category" dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#a1a1aa", fontWeight: 700 }} width={100} />
                <Tooltip {...darkTooltip} />
                <Bar dataKey="count" name="Leads" radius={[0, 3, 3, 0]} barSize={14}>
                  {statusPipeline.map((entry, i) => {
                    const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#71717a"];
                    return <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User signups */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">User Signups & Saves — Weekly</h3>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userChart} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }}
                  dy={6}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }}
                />
                <Tooltip {...darkTooltip} />
                <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={6} />
                <Area type="monotone" dataKey="signups" name="Signups" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#gu)" />
                <Area type="monotone" dataKey="saves" name="Saves" stroke="#f472b6" strokeWidth={2} fillOpacity={1} fill="url(#gs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
