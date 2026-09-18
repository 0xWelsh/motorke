// src/components/detail/CarMarketRange.js
// Price-card market benchmark. Streams in after the shell so the price
// shows immediately.
import { getPriceBenchmark } from "@/lib/car-detail-data";
import { formatPrice } from "@/lib/utils";

export default async function CarMarketRange({ car }) {
  const benchmark = await getPriceBenchmark(car.make, car.model, car.year, car.id);
  if (!benchmark) return null;

  const carPrice = Number(car.price) || 0;
  const marketLabel =
    carPrice < benchmark.low
      ? { text: "Below market range", cls: "text-emerald-600", icon: "↓" }
      : carPrice > benchmark.high
        ? { text: "Above market range", cls: "text-amber-600", icon: "↑" }
        : { text: "Within market range", cls: "text-slate-500", icon: "–" };
  const pricePosition = benchmark
    ? Math.min(100, Math.max(0, ((carPrice - benchmark.low) / (benchmark.high - benchmark.low)) * 100))
    : 50;

  return (
    <div className="mt-4 border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Market Range</p>
      <p className="mt-1 text-[13px] font-bold text-slate-700 tabular-nums">
        KES {Number(benchmark.low).toLocaleString("en-KE")} – KES {Number(benchmark.high).toLocaleString("en-KE")}
      </p>

      <div className="mt-2.5 relative">
        <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-300 via-slate-200 to-amber-300" />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md ring-1 ring-black/10"
          style={{
            left: `${pricePosition}%`,
            backgroundColor: carPrice < benchmark.low ? "#10b981" : carPrice > benchmark.high ? "#f59e0b" : "#64748b",
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-slate-400 tabular-nums">Low</span>
          <span className="text-[9px] text-slate-400 tabular-nums">Avg {formatPrice(benchmark.avg)}</span>
          <span className="text-[9px] text-slate-400 tabular-nums">High</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${marketLabel.cls} ${
          carPrice < benchmark.low ? "bg-emerald-50" : carPrice > benchmark.high ? "bg-amber-50" : "bg-slate-50"
        }`}>
          {marketLabel.icon} {marketLabel.text}
        </span>
      </div>
      <p className="text-[10px] text-slate-400 mt-1">Based on {benchmark.count} similar {car.model} listing{benchmark.count !== 1 ? "s" : ""}</p>
    </div>
  );
}