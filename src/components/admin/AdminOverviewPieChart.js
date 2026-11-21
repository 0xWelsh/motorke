"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const DEFAULT_COLORS = ["#2F855A", "#dc2626", "#f59e0b", "#2563eb", "#8b5cf6"];

export default function AdminOverviewPieChart({ data, title = "Marketplace mix", subtitle }) {
  const slices = (data || []).filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  if (!slices.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 border-border bg-[var(--bg)]">
        <h3 className="text-lg font-bold text-text text-text">{title}</h3>
        <p className="mt-8 text-center text-sm text-muted">No data to chart yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-sm border-border bg-[var(--bg)] sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold tracking-tight text-text text-text">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-muted text-muted">{subtitle}</p> : null}
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={2}
              stroke="transparent"
            >
              {slices.map((entry, i) => (
                <Cell key={entry.name} fill={entry.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${value} (${total ? Math.round((value / total) * 100) : 0}%)`,
                name,
              ]}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                background: "var(--tooltip-bg, #fff)",
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", fontWeight: 600, paddingTop: "8px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-center text-xs font-medium text-muted text-dim">
        Total: <span className="font-bold text-text text-text">{total.toLocaleString("en-KE")}</span>
      </p>
    </div>
  );
}
