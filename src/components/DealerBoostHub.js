"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import DealerBoostApply from "@/components/DealerBoostApply";
import { formatKes } from "@/lib/dealer-pricing";
import { isActiveSpotlight } from "@/lib/spotlight";
import { isActiveHotBadge } from "@/lib/hot-badge";

function formatEnds(until) {
  if (!until) return null;
  const d = new Date(until);
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Boost credits, dealer lift, and per-car apply on /portal/boosts.
 */
export default function DealerBoostHub({
  initialStatus,
  liveCars,
  billingActive,
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [liftLoading, setLiftLoading] = useState(false);
  const [liftError, setLiftError] = useState(null);
  const [selectedCarId, setSelectedCarId] = useState(liveCars[0]?.id ?? "");

  const { balance, limits, activeSpotlights, dealerLiftUntil, addons, recentEvents } =
    status;

  async function applyDealerLift() {
    setLiftLoading(true);
    setLiftError(null);
    try {
      const res = await fetch("/api/portal/boosts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "dealer_lift_14d" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLiftError(data.error || "Could not apply dealer lift");
        return;
      }
      const fresh = await fetch("/api/portal/boosts").then((r) => r.json());
      setStatus(fresh);
      router.refresh();
    } catch {
      setLiftError("Network error");
    } finally {
      setLiftLoading(false);
    }
  }

  const creditRows = [
    { key: "spotlight7d", label: "Spotlight (7d)" },
    { key: "spotlight30d", label: "Spotlight (30d)" },
    { key: "hotBadge7d", label: "Hot badge (7d)" },
    { key: "dealerLift14d", label: "Dealer lift (14d)" },
  ];

  return (
    <div className="space-y-6">
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {creditRows.map(({ key, label }) => (
          <div
            key={key}
            className="border border-white/[0.08] bg-[#1e1e1e] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.04)] rounded-xl"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-zinc-400">
              {label}
            </p>
            <p className="text-2xl font-bold text-white mt-1 tabular-nums">
              {balance[key]}
            </p>
            {!billingActive ? (
              <p className="text-[9px] text-zinc-400 mt-1">Free during early access</p>
            ) : null}
          </div>
        ))}
      </section>

      <section className="border border-white/[0.08] bg-[#1e1e1e] p-4 sm:p-6 rounded-xl">
        <h2 className="text-sm font-bold text-white">Plan limits</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Suggested tier: <strong>{limits.planName}</strong>. Up to{" "}
          <strong>{limits.maxConcurrentSpotlight}</strong> concurrent Spotlights. Active now:{" "}
          <strong>{activeSpotlights}</strong>.
        </p>
        {dealerLiftUntil ? (
          <p className="mt-2 text-[11px] font-semibold text-[var(--accent)]">
            Dealer lift active until {formatEnds(dealerLiftUntil)}
          </p>
        ) : null}
      </section>

      <section className="border border-white/[0.08] bg-[#1e1e1e] p-4 sm:p-6 space-y-4 rounded-xl">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap size={16} className="text-amber-600" /> Dealer lift (whole showroom)
        </h2>
        <p className="text-sm text-zinc-400">
          Lifts browse ranking for all your live stock for 14 days.
        </p>
        <button
          type="button"
          onClick={applyDealerLift}
          disabled={liftLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e1e1e] text-white text-[11px] font-black uppercase tracking-[0.1em] disabled:opacity-50 rounded-xl"
        >
          {liftLoading ? <Loader2 size={14} className="animate-spin" /> : null}
          Apply dealer lift
        </button>
        {liftError ? <p className="text-[11px] text-rose-600">{liftError}</p> : null}
      </section>

      <section className="border border-white/[0.08] bg-[#1e1e1e] p-4 sm:p-6 space-y-4 rounded-xl">
        <h2 className="text-sm font-bold text-white">Boost a vehicle</h2>
        {liveCars.length === 0 ? (
          <p className="text-sm text-zinc-400">No live listings. Mark a car available first.</p>
        ) : (
          <>
            <select
              value={selectedCarId}
              onChange={(e) => setSelectedCarId(e.target.value)}
              className="w-full max-w-md h-10 px-3 border border-white/[0.08] bg-[#1e1e1e] text-sm text-white rounded-xl"
            >
              {liveCars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.year} {c.make} {c.model}
                  {isActiveSpotlight(c) ? " · Spotlight" : ""}
                  {isActiveHotBadge(c) ? " · Hot" : ""}
                </option>
              ))}
            </select>
            {selectedCarId ? (
              <DealerBoostApply
                carId={selectedCarId}
                carLabel={
                  liveCars.find((c) => c.id === selectedCarId)
                    ? `${liveCars.find((c) => c.id === selectedCarId).year} ${liveCars.find((c) => c.id === selectedCarId).make} ${liveCars.find((c) => c.id === selectedCarId).model}`
                    : ""
                }
                spotlightActive={isActiveSpotlight(
                  liveCars.find((c) => c.id === selectedCarId) || {}
                )}
                hotActive={isActiveHotBadge(
                  liveCars.find((c) => c.id === selectedCarId) || {}
                )}
              />
            ) : null}
          </>
        )}
      </section>

      {addons?.length ? (
        <section className="border border-white/[0.08] overflow-hidden rounded-xl">
          <div className="px-4 py-3 bg-[#1a1a1a] border-b border-white/[0.08]">
            <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-zinc-400">
              Add-on prices (when billing is on)
            </h2>
          </div>
          <ul className="divide-y divide-white/[0.08]">
            {addons.map((addon) => (
              <li
                key={addon.id}
                className="px-4 py-3 flex flex-wrap justify-between gap-2 text-sm bg-[#1e1e1e] rounded-xl"
              >
                <span className="font-medium text-white">
                  {addon.name} · {addon.durationLabel}
                </span>
                <span className="text-zinc-400 tabular-nums">{formatKes(addon.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recentEvents?.length ? (
        <section className="border border-white/[0.08] bg-[#1e1e1e] p-4 sm:p-6 rounded-xl">
          <h2 className="text-sm font-bold text-white mb-3">Recent boosts</h2>
          <ul className="space-y-2 text-sm">
            {recentEvents.map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-2 text-zinc-400">
                <span>
                  {e.boostType.replace(/_/g, " ")}
                  {e.car
                    ? ` · ${e.car.year} ${e.car.make} ${e.car.model}`
                    : " · showroom"}
                </span>
                <span className="text-[11px]">until {formatEnds(e.endsAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
