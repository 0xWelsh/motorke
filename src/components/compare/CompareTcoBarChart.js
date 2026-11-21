// src/components/compare/CompareTcoBarChart.js
"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatKesCompact } from "./compare-utils";

export default function CompareTcoBarChart({ fullComparedCars, initialCarsById, getInsights }) {
  if (fullComparedCars.length === 0) return null;

  const barData = fullComparedCars.map((car) => {
    const tco = getInsights(car)?.tco || {};
    return {
      name: `${car.make} ${car.model}`.length > 20
        ? `${car.make} ${car.model}`.slice(0, 18) + "…"
        : `${car.make} ${car.model}`,
      Fuel: Math.round((tco.annualFuelCost || 0) / 1000),
      Insurance: Math.round((tco.annualInsurance || 0) / 1000),
      Maintenance: Math.round((tco.annualMaintenance || 0) / 1000),
      total: Math.round((tco.annualTotal || 0) / 1000),
    };
  });

  const maxVal = Math.max(...barData.map((d) => d.total), 1);

  return (
    <div className="order-4 lg:order-4 scroll-mt-24 bg-surface border border-border p-5 sm:p-6 lg:p-8"
      style={{ borderRadius: "var(--radius)" }}>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-text">Annual Cost Breakdown</h3>
        <span className="px-2 py-0.5 bg-surface-hover text-[9px] font-bold text-muted uppercase tracking-widest rounded-xl">
          KES '000
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={barData} barSize={48} barGap={8}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: "#718096" }} />
          <YAxis tick={{ fontSize: 10, fill: "#718096" }}
            tickFormatter={(v) => `${v}K`}
            domain={[0, Math.ceil(maxVal * 1.15 / 100) * 100]}
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(value) => [`KES ${(value || 0).toLocaleString("en-KE")}`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 700 }} />
          <Bar dataKey="Fuel" stackId="a" fill="#D69E2E" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Insurance" stackId="a" fill="#3182CE" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Maintenance" stackId="a" fill="#38A169" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {barData.map((d) => (
          <div key={d.name} className="text-center p-2 bg-surface-hover rounded-xl">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted truncate">{d.name}</p>
            <p className="text-sm font-black text-text">KES {formatKesCompact(d.total * 1000)}</p>
            <p className="text-[8px] text-muted">total/yr</p>
          </div>
        ))}
      </div>
    </div>
  );
}
