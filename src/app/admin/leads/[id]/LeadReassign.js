"use client";

import { useState } from "react";
import { UserCheck, User } from "lucide-react";
import { humanizeError, humanizeApiError } from "@/lib/humanize-error";

export default function LeadReassign({ leadId, currentAssignedTo, adminTeam }) {
  const [selectedId, setSelectedId] = useState(currentAssignedTo?.id || "");
  const [saving, setSaving] = useState(false);
  const [assigned, setAssigned] = useState(currentAssignedTo);
  const [message, setMessage] = useState(null);

  async function handleReassign() {
    const newId = selectedId || null;
    if (newId === (assigned?.id || null)) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: newId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAssigned(data.assignedTo);
        setMessage({ type: "success", text: data.assignedTo ? `Reassigned to ${data.assignedTo.name}` : "Assignment cleared" });
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: humanizeApiError(err, "Failed to reassign") });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <UserCheck size={12} />
        <span>Assigned to</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <User size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-[var(--bg)]/60 py-2 pl-8 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-500/50 appearance-none cursor-pointer"
          >
            <option value="">Unassigned</option>
            {adminTeam.map((admin) => (
              <option key={admin.id} value={admin.id}>{admin.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleReassign}
          disabled={saving || selectedId === (assigned?.id || "")}
          className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 shrink-0"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>
      {assigned && !message && (
        <p className="text-[11px] text-emerald-600 font-semibold">
          Currently: {assigned.name}
        </p>
      )}
      {message && (
        <p className={`text-[11px] font-semibold ${message.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
