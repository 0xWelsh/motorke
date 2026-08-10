// src/components/compare/ComparePriceValueChart.js
"use client";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ZAxis,
} from "recharts";
import { formatPrice } from "@/lib/utils";

const CAR_COLORS = ["#38A169", "#3182CE", "#D69E2E"];

export default function ComparePriceValueChart({ fullComparedCars, initialCarsById, scoreMaps }) {
  if (fullComparedCars.length < 2) return null;

  const scatterData = fullComparedCars.map((car, idx) => ({
    name: `${car.year} ${car.make} ${car.model}`,
    price: Math.round((car.price || 0) / 1000000),
    score: Math.round((scoreMaps.overallMap.get(car.id) || 0) * 100),
    color: CAR_COLORS[idx] || "#718096",
    priceRaw: car.price || 0,
  }));

  return (
    <div className="order-6 lg:order-6 scroll-mt-24 bg-white border border-slate-200 p-5 sm:p-6 lg:p-8"
      style={{ borderRadius: "var(--radius)" }}>
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-bold text-slate-900">Price vs Value</h3>
        <span className="px-2 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest rounded-xl">
          Score / M KES
        </span>
      </div>
      {scatterData.length >= 2 && (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="price" type="number" domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tick={{ fontSize: 10, fill: "#718096" }}
              tickFormatter={(v) => `KES ${v}M`}
              label={{ value: "Price (KES millions)", position: "bottom", offset: -5, style: { fontSize: 9, fill: "#718096", fontWeight: 600 } }}
            />
            <YAxis
              dataKey="score" type="number" domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#718096" }}
              tickFormatter={(v) => `${v}`}
              label={{ value: "Composite Score", angle: -90, position: "left", offset: 0, style: { fontSize: 9, fill: "#718096", fontWeight: 600 } }}
            />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              formatter={(value, name) => {
                if (name === "price") return [`KES ${(value || 0).toLocaleString("en-KE")}M`, "Price"];
                if (name === "score") return [`${value}/100`, "Score"];
                return [value, name];
              }}
              labelFormatter={(label) => scatterData[0]?.name || ""}
            />
            {fullComparedCars.map((car, idx) => (
              <Scatter
                key={car.id}
                name={`${car.make} ${car.model}`}
                data={[scatterData[idx]]}
                fill={CAR_COLORS[idx] || "#718096"}
                stroke="#fff"
                strokeWidth={1.5}
                shape="circle"
              />
            ))}
            <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 700 }} />
          </ScatterChart>
        </ResponsiveContainer>
      )}
      <div className="mt-4 grid grid-cols-{fullComparedCars.length} gap-3">
        {scatterData.map((d, idx) => (
          <div key={d.name} className="text-center p-2 bg-slate-50 rounded-xl">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 truncate">{d.name}</p>
            <p className="text-sm font-black text-slate-900">{d.score}/100</p>
            <p className="text-[8px] text-slate-500">at {formatPrice(d.priceRaw)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
