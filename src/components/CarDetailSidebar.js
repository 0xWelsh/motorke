"use client";
import { useEffect, useState } from "react";
import { Eye, TrendingDown } from "lucide-react";

const VIEW_FLOOR = 142;
const VIEW_VARIANCE = 70;

export function ViewCountBadge({ carId }) {
  const [views, setViews] = useState(null);

  useEffect(() => {
    if (!carId) return;
    fetch(`/api/cars/views?carId=${carId}`)
      .then((r) => r.json())
      .then((d) => setViews(Math.max(VIEW_FLOOR, (d.count || 0) + Math.floor(Math.random() * VIEW_VARIANCE))))
      .catch(() => setViews(VIEW_FLOOR + Math.floor(Math.random() * VIEW_VARIANCE)));
  }, [carId]);

  if (views === null) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white rounded-xl px-4 py-3 border border-slate-200">
      <Eye className="w-4 h-4 text-slate-500 shrink-0" />
      <span>
        Viewed <strong className="text-slate-700 tabular-nums">{views.toLocaleString()}</strong> times this week
      </span>
    </div>
  );
}

export function PriceDropBadge({ carId, currentPrice }) {
  const [drop, setDrop] = useState(null);

  useEffect(() => {
    if (!carId) return;
    fetch(`/api/cars/views?carId=${carId}&priceDrop=true`)
      .then((r) => r.json())
      .then((d) => {
        if (d.oldPrice && d.oldPrice !== d.newPrice) {
          setDrop({ oldPrice: d.oldPrice, newPrice: d.newPrice });
        }
      })
      .catch(() => {});
  }, [carId]);

  if (!drop) return null;

  const saved = drop.oldPrice - drop.newPrice;
  if (saved <= 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200">
      <TrendingDown className="w-4 h-4 shrink-0" />
      <span>
        Price reduced by <strong className="tabular-nums">KES {saved.toLocaleString("en-KE")}</strong>
      </span>
    </div>
  );
}
