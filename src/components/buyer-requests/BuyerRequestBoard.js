"use client";

import { useEffect, useState } from "react";
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

  async function sendOffer(requestId) {
    setOfferLoadingId(requestId);
    try {
      const res = await fetch(`/api/buyer-requests/${requestId}/offer-click`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.whatsappHref) {
        alert(data?.error || "Could not open WhatsApp. Try again or contact support.");
        return;
      }
      window.open(data.whatsappHref, "_blank", "noopener,noreferrer");
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, offerClicks: (r.offerClicks || 0) + 1 } : r))
      );
    } finally {
      setOfferLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
          Live buyer demand. Tap <strong className="text-slate-800 dark:text-white">Send offer</strong> to
          message Welsh Motorhub with this request ID. We route verified offers to the buyer on WhatsApp.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="border border-sky-200/90 dark:border-sky-900/70 bg-white dark:bg-[#111827] px-3 py-2 text-xs font-bold uppercase tracking-wide"
            style={{ borderRadius: "var(--radius)" }}
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
            className="inline-flex items-center justify-center w-10 h-10 border border-sky-200/90 dark:border-sky-900/70 bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300"
            style={{ borderRadius: "var(--radius)" }}
            aria-label="Refresh requests"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading requests…
        </div>
      ) : error ? (
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">{error}</p>
      ) : requests.length === 0 ? (
        <div
          className="border border-dashed border-slate-200 dark:border-zinc-800 p-10 text-center text-sm text-slate-500"
          style={{ borderRadius: "var(--radius)" }}
        >
          No open requests right now. Check back soon or{" "}
          <a href="/request-car" className="text-[#2563eb] dark:text-sky-300 font-bold hover:underline">
            post your own
          </a>
          .
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <li
              key={req.id}
              className="border border-sky-200/90 dark:border-sky-900/70 bg-white dark:bg-[#111827] p-4 sm:p-5 flex flex-col"
              style={{ borderRadius: "var(--radius)" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#2563eb] dark:text-sky-300">
                    {req.publicCode}
                  </p>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {req.title}
                  </h3>
                  {req.variant ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{req.variant}</p>
                  ) : null}
                </div>
                <span className="text-[9px] font-black uppercase tracking-wide text-slate-400 shrink-0">
                  {req.timelineLabel}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{req.budgetLabel}</p>

              <div className="flex flex-wrap gap-1.5 mb-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-900">{req.county}</span>
                {req.bodyType ? (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-900">{bodyLabel(req.bodyType)}</span>
                ) : null}
                {req.fuelType ? (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-900">
                    {FUEL_LABELS[req.fuelType] || req.fuelType}
                  </span>
                ) : null}
                {req.transmission ? (
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-900">{bodyLabel(req.transmission)}</span>
                ) : null}
              </div>

              {req.notesPreview ? (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2">
                  {req.notesPreview}
                </p>
              ) : null}

              <button
                type="button"
                disabled={offerLoadingId === req.id}
                onClick={() => sendOffer(req.id)}
                className="mt-auto inline-flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-60 text-white py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors"
                style={{ borderRadius: "var(--radius)" }}
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
