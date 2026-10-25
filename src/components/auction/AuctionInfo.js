"use client";

import { Calendar, Gauge, Fuel, Cog, MapPin, Users } from "lucide-react";

const iconMap = {
  year: Calendar,
  mileage: Gauge,
  fuel: Fuel,
  transmission: Cog,
  location: MapPin,
  seller: Users,
};

export default function AuctionInfo({ items = [] }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text)]">Vehicle Details</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-[var(--border)] md:divide-y-0">
        {items.map((item, idx) => {
          const Icon = iconMap[item.icon] || Calendar;
          return (
            <div key={idx} className="px-5 py-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--surface-overlay)] flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{item.label}</p>
                <p className="mt-1 font-semibold text-[var(--text)]">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
