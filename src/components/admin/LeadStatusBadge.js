"use client";
import { useState } from "react";

const STATUS_STYLES = {
  NEW: { badge: "border-emerald-500/25 bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  CONTACTED: { badge: "border-blue-500/25 bg-blue-500/10 text-blue-300", dot: "bg-blue-400" },
  INTERESTED: { badge: "border-violet-500/25 bg-violet-500/10 text-violet-300", dot: "bg-violet-400" },
  NEGOTIATING: { badge: "border-amber-500/25 bg-amber-50 text-amber-300", dot: "bg-amber-400" },
  SOLD: { badge: "border-green-500/25 bg-green-500/10 text-green-300", dot: "bg-green-400" },
  DEAD: { badge: "border-slate-200 bg-slate-100/60 text-slate-500", dot: "bg-slate-400" },
};

const STATUS_OPTIONS = ["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "SOLD", "DEAD"];

export function LeadStatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.NEW;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "NEW" ? "animate-pulse " : ""}${s.dot}`} />
      {status}
    </span>
  );
}

export function LeadStatusSelect({ leadId, currentStatus, onUpdate }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    const newStatus = e.target.value;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        if (onUpdate) onUpdate(newStatus);
      }
    } catch (err) {
      console.error("Failed to update lead status", err);
    } finally {
      setSaving(false);
    }
  }

  const s = STATUS_STYLES[status] || STATUS_STYLES.NEW;

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className={`cursor-pointer rounded-lg border-0 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider outline-none ring-1 ring-inset transition ${s.badge} ${saving ? "opacity-60" : "hover:ring-2"}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt} className="normal-case tracking-normal">
          {opt}
        </option>
      ))}
    </select>
  );
}
