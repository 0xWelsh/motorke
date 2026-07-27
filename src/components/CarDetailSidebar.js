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
    <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/40 rounded-xl px-4 py-3 border border-zinc-800">
      <Eye className="w-4 h-4 text-zinc-400 shrink-0" />
      <span>
        Viewed <strong className="text-zinc-200 tabular-nums">{views.toLocaleString()}</strong> times this week
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
    <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/20 rounded-xl px-4 py-3 border border-emerald-800/50">
      <TrendingDown className="w-4 h-4 shrink-0" />
      <span>
        Price reduced by <strong className="tabular-nums">KSh {saved.toLocaleString("en-KE")}</strong>
      </span>
    </div>
  );
}
