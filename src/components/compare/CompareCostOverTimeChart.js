// src/components/compare/CompareCostOverTimeChart.js
"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { formatKesCompact } from "./compare-utils";

const CAR_COLORS = ["#38A169", "#3182CE", "#D69E2E"];
const YEARS = [1, 2, 3, 4, 5];

export default function CompareCostOverTimeChart({ fullComparedCars, initialCarsById, getInsights }) {
  if (fullComparedCars.length === 0) return null;

  const lineData = YEARS.map((year) => {
    const point = { year: `${year}yr` };
    fullComparedCars.forEach((car) => {
      const annualTco = getInsights(car)?.tco?.annualTotal || 0;
      const purchasePrice = car.price || 0;
      const cumulative = purchasePrice + annualTco * year;
      point[car.id] = Math.round(cumulative / 1000);
    });
    return point;
  });

  return (
    <div className="order-5 lg:order-5 scroll-mt-24 bg-white border border-slate-200 p-5 sm:p-6 lg:p-8"
      style={{ borderRadius: "var(--radius)" }}>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-slate-900">5-Year Cost Projection</h3>
        <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest rounded-xl">
          Purchase + TCO
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={lineData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fontWeight: 600, fill: "#718096" }} />
          <YAxis tick={{ fontSize: 10, fill: "#718096" }}
            tickFormatter={(v) => `${formatKesCompact(v * 1000)}`}
          />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(value) => [`KES ${formatKesCompact((value || 0) * 1000)}`, ""]}
            labelFormatter={(label) => `Year ${label.replace("yr", "")}`}
          />
          <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 700 }} />
          {fullComparedCars.map((car, idx) => (
            <Line
              key={car.id}
              type="monotone"
              dataKey={car.id}
              name={`${car.make} ${car.model}`}
              stroke={CAR_COLORS[idx] || "#718096"}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
