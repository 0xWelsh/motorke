"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-KE", { day: "2-digit", month: "short" });
}

export default function AnalyticsBarChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64 text-sm font-semibold text-slate-400">
        No data yet
      </div>
    );
  }

  // Format dates for display
  const chartData = data.map((d) => ({ ...d, dateLabel: formatDate(d.date) }));

  return (
    <div className="h-48 sm:h-64 md:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="dateLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}
            dy={8}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#64748b", fontWeight: 700 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #ddd4c8",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
            itemStyle={{ fontWeight: 700 }}
            labelStyle={{ fontWeight: 700, color: "#64748b", marginBottom: "4px" }}
            labelFormatter={(label, payload) => {
              if (payload?.[0]?.payload?.date) {
                return formatDate(payload[0].payload.date);
              }
              return label;
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em" }}
          />
          <Bar
            dataKey="views"
            name="Views"
            fill="#1e1e1e"
            radius={[2, 2, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="leads"
            name="Leads"
            fill="#ff5a2f"
            radius={[2, 2, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
