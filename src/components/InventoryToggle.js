"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { daysRemainingOnSite } from "@/lib/car-sold-status";

export default function InventoryToggle({ carId, available: initialAvailable, soldAt: initialSoldAt = null }) {
  const router = useRouter();
  const [available, setAvailable] = useState(initialAvailable);
  const [soldAt, setSoldAt] = useState(initialSoldAt);
  const [loading, setLoading] = useState(false);

  const daysLeft = !available ? daysRemainingOnSite({ available, soldAt }) : null;

  async function toggle() {
    setLoading(true);
    const nextAvailable = !available;
    const res = await fetch(`/api/portal/cars/${carId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: nextAvailable }),
    });
    if (res.ok) {
      setAvailable(nextAvailable);
      setSoldAt(nextAvailable ? null : new Date().toISOString());
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        onClick={toggle}
        disabled={loading}
        className={`flex-1 p-2.5 rounded-2xl font-semibold text-xs transition-all ${
          loading
            ? "bg-white/[0.03] text-zinc-400 cursor-wait"
            : available
              ? "bg-white/[0.03] hover:bg-white/[0.06] text-white"
              : "bg-amber-600 hover:bg-amber-700 text-white"
        }`}
      >
        {loading ? "…" : available ? "Mark sold" : "Mark live"}
      </button>
      {!available && soldAt && daysLeft != null ? (
        <p className="text-[9px] font-semibold text-zinc-400 leading-snug text-center">
          {daysLeft > 0
            ? `Public page for ${daysLeft} more day${daysLeft === 1 ? "" : "s"}, then hidden`
            : "Removing from public site soon"}
        </p>
      ) : null}
    </div>
  );
}
