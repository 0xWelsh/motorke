// src/components/compare/CompareRadarChart.js
"use client";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";

const DIMENSIONS = [
  { key: "performance", label: "Performance", color: "#38A169" },
  { key: "comfort", label: "Comfort", color: "#3182CE" },
  { key: "economy", label: "Economy", color: "#D69E2E" },
  { key: "value", label: "Value", color: "#E53E3E" },
];

const CAR_COLORS = ["#38A169", "#3182CE", "#D69E2E"];

export default function CompareRadarChart({ fullComparedCars, scoreMaps, initialCarsById }) {
  if (fullComparedCars.length === 0) return null;

  const radarData = DIMENSIONS.map((dim) => {
    const point = { dimension: dim.label };
    fullComparedCars.forEach((car) => {
      const map = dim.key === "performance" ? scoreMaps.performanceMap
        : dim.key === "comfort" ? scoreMaps.comfortMap
        : dim.key === "economy" ? scoreMaps.economyMap
        : scoreMaps.valueMap;
      const raw = map.get(car.id) || 0;
      point[car.id] = Math.round(raw * 100);
    });
    return point;
  });

  return (
    <div className="order-3 lg:order-3 scroll-mt-24 bg-white border border-slate-200 p-5 sm:p-6 lg:p-8"
      style={{ borderRadius: "var(--radius)" }}>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-slate-900">Performance Radar</h3>
        <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest rounded-xl">
          Realtime
        </span>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <RadarChart data={radarData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fontWeight: 700, fill: "#718096" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: "#718096" }} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
            formatter={(value) => [`${value}/100`, ""]}
          />
          {fullComparedCars.map((car, idx) => (
            <Radar
              key={car.id}
              name={`${car.make} ${car.model}`}
              dataKey={car.id}
              stroke={CAR_COLORS[idx] || "#718096"}
              fill={CAR_COLORS[idx] || "#718096"}
              fillOpacity={0.08}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: "10px", fontWeight: 700 }}
            formatter={(value) => <span className="text-[10px] font-bold text-slate-500">{value}</span>}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
