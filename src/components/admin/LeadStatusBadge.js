"use client";
import { useState } from "react";

const STATUS_STYLES = {
  NEW: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CONTACTED: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  INTERESTED: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  NEGOTIATING: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  SOLD: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  DEAD: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUS_OPTIONS = ["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "SOLD", "DEAD"];

export function LeadStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[status] || STATUS_STYLES.NEW}`}>
      {status === "NEW" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
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

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className={`cursor-pointer rounded-lg border-0 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider outline-none ring-1 ring-inset transition ${STATUS_STYLES[status] || STATUS_STYLES.NEW} ${saving ? "opacity-60" : "hover:ring-2"}`}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt} className="normal-case tracking-normal">
          {opt}
        </option>
      ))}
    </select>
  );
}
