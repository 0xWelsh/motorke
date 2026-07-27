"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, Loader2, RefreshCw } from "lucide-react";
import { FUEL_LABELS } from "@/lib/constants";

function bodyLabel(value) {
  if (!value) return null;
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BuyerRequestBoard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [county, setCounty] = useState("");
  const [offerLoadingId, setOfferLoadingId] = useState(null);
  const [quota, setQuota] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = county ? `?county=${encodeURIComponent(county)}` : "";
      const res = await fetch(`/api/buyer-requests${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not load requests.");
        setRequests([]);
        return;
      }
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } catch {
      setError("Network error loading requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [county]);

  useEffect(() => {
    fetch("/api/buyer-requests/offer-quota")
      .then((res) => res.json())
      .then((data) => setQuota(data))
      .catch(() => setQuota(null));
  }, []);

  async function sendOffer(requestId) {
    setOfferLoadingId(requestId);
    try {
      const res = await fetch(`/api/buyer-requests/${requestId}/offer-click`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = data.loginUrl || "/login?callbackUrl=/requests";
        return;
      }
      if (res.status === 403 && data.code === "DAILY_LIMIT") {
        const goUpgrade = window.confirm(
          `${data.error}\n\nOpen Plans & billing now?`
        );
        if (goUpgrade) {
          window.location.href = data.upgradeUrl || "/";
        }
        return;
      }
      if (!res.ok || !data?.whatsappHref) {
        alert(data?.error || "Could not open WhatsApp. Try again or contact support.");
        return;
      }
      window.open(data.whatsappHref, "_blank", "noopener,noreferrer");
      if (!data.alreadySent) {
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? { ...r, offerClicks: (r.offerClicks || 0) + 1 } : r))
        );
        setQuota((prev) => {
          if (!prev || prev.unlimited || prev.freeRemaining == null) return prev;
          return { ...prev, usedToday: (prev.usedToday || 0) + 1, freeRemaining: 0 };
        });
      }
    } finally {
      setOfferLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-sm text-zinc-400">
            Live buyer demand. <strong className="text-white">Dealer sign-in required.</strong>{" "}
            Tap Send offer to message BIDGARI with the request ID — we route offers to the buyer.
          </p>
          {quota?.loggedIn && quota.isDealer ? (
            quota.unlimited ? (
              <p className="text-xs font-semibold text-sky-300">
                Unlimited buyer request offers on your plan.
              </p>
            ) : quota.freeRemaining != null && quota.freeRemaining > 0 ? (
              <p className="text-xs font-semibold text-zinc-300">
                {quota.freeRemaining} free offer{quota.freeRemaining === 1 ? "" : "s"} left today (Nairobi time).
              </p>
            ) : (
              <p className="text-xs font-semibold text-amber-200">
                Daily free offer used.{" "}
                <span className="underline font-bold">
                  Upgrade for unlimited
                </span>
              </p>
            )
          ) : !quota?.loggedIn ? (
            <p className="text-xs text-zinc-400">
              <Link href="/login?callbackUrl=/requests" className="font-bold text-sky-300 hover:underline">
                Sign in as a dealer
              </Link>{" "}
              to send offers (1 free per day).
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="border border-white/[0.08] bg-[#1c1c1c] px-3 py-2 text-xs font-bold uppercase tracking-wide text-white rounded-xl outline-none"
          >
            <option value="">All counties</option>
            {[
              "Nairobi",
              "Mombasa",
              "Nakuru",
              "Kisumu",
              "Uasin Gishu",
              "Kiambu",
              "Machakos",
              "Meru",
            ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center w-10 h-10 border border-white/[0.08] bg-[#1c1c1c] text-zinc-300 rounded-xl"
            aria-label="Refresh requests"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading requests…
        </div>
      ) : error ? (
        <p className="text-sm font-semibold text-red-400">{error}</p>
      ) : requests.length === 0 ? (
        <div
          className="border border-dashed border-white/[0.08] bg-white/[0.03] p-10 text-center text-sm text-zinc-400 rounded-xl"
        >
          No open requests right now. Check back soon or{" "}
          <a href="/request-car" className="text-sky-300 font-bold hover:underline">
            post your own
          </a>
          .
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <li
              key={req.id}
              className="border border-white/[0.08] bg-[#1e1e1e] p-4 sm:p-5 flex flex-col rounded-xl"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-300">
                    {req.publicCode}
                  </p>
                  <h3 className="text-lg font-black text-white leading-tight">
                    {req.title}
                  </h3>
                  {req.variant ? (
                    <p className="text-xs text-zinc-400">{req.variant}</p>
                  ) : null}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wide text-zinc-400 shrink-0">
                  {req.timelineLabel}
                </span>
              </div>

              <p className="text-sm font-bold text-zinc-300 mb-2">{req.budgetLabel}</p>

              <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
                <span className="px-2 py-0.5 bg-white/[0.06] rounded-lg">{req.county}</span>
                {req.bodyType ? (
                  <span className="px-2 py-0.5 bg-white/[0.06] rounded-lg">{bodyLabel(req.bodyType)}</span>
                ) : null}
                {req.fuelType ? (
                  <span className="px-2 py-0.5 bg-white/[0.06] rounded-lg">
                    {FUEL_LABELS[req.fuelType] || req.fuelType}
                  </span>
                ) : null}
                {req.transmission ? (
                  <span className="px-2 py-0.5 bg-white/[0.06] rounded-lg">{bodyLabel(req.transmission)}</span>
                ) : null}
              </div>

              {req.notesPreview ? (
                <p className="text-xs text-zinc-400 leading-relaxed mb-3 line-clamp-2">
                  {req.notesPreview}
                </p>
              ) : null}

              <button
                type="button"
                disabled={offerLoadingId === req.id}
                onClick={() => sendOffer(req.id)}
                className="mt-auto inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-60 text-white py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors rounded-xl"
              >
                {offerLoadingId === req.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                Send offer on WhatsApp
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
