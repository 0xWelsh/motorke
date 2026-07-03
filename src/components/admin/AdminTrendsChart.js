"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminTrendsChart({ data }) {
  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="l" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
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
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #27272a",
              background: "#18181b",
              padding: "8px 12px",
              fontSize: "12px",
            }}
            itemStyle={{ fontWeight: 700, padding: "2px 0" }}
            labelStyle={{ fontWeight: 600, color: "#a1a1aa", marginBottom: "4px", fontSize: "11px" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "10px", fontWeight: 700, color: "#71717a", paddingTop: "8px" }}
            iconType="circle"
            iconSize={6}
          />
          <Area
            type="monotone"
            dataKey="cars"
            name="Listings"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#c)"
          />
          <Area
            type="monotone"
            dataKey="leads"
            name="Leads"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#l)"
          />
          <Area
            type="monotone"
            dataKey="views"
            name="Views"
            stroke="#f59e0b"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#v)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
