"use client";

import { useState } from "react";

const STATUS_COLORS = {
  NEW: "bg-emerald-500",
  CONTACTED: "bg-blue-500",
  INTERESTED: "bg-violet-500",
  NEGOTIATING: "bg-amber-500",
  SOLD: "bg-green-500",
  DEAD: "bg-slate-400",
};

const STATUS_LABELS = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  NEGOTIATING: "Negotiating",
  SOLD: "Sold",
  DEAD: "Dead",
};

const STATUS_STYLES = {
  NEW: "bg-emerald-950/40 text-emerald-700",
  CONTACTED: "bg-blue-950/40 text-blue-300",
  INTERESTED: "bg-violet-950/40 text-violet-300",
  NEGOTIATING: "bg-amber-950/40 text-amber-300",
  SOLD: "bg-green-950/40 text-green-300",
  DEAD: "bg-slate-100 text-slate-500",
};

export default function LeadNotesClient({ leadId, initialNotes, currentStatus }) {
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState(currentStatus);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText.trim(), status }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.note, ...prev]);
        setNoteText("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        setNotes((prev) => [
          {
            id: `opt-${Date.now()}`,
            status: newStatus,
            note: null,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status change inline */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Status:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "SOLD", "DEAD"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={changingStatus || s === status}
              className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-all ${
                s === status
                  ? `${STATUS_STYLES[s] || "bg-slate-100 text-slate-700"} ring-1 ring-white/10`
                  : "bg-slate-100/50 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              } disabled:opacity-50`}
            >
              {STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Add note form */}
      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          type="text"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add a note..."
          maxLength={500}
          className="flex-1 rounded-lg border border-slate-200 bg-[var(--bg)]/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500/50 focus:bg-[var(--bg)]"
        />
        <button
          type="submit"
          disabled={saving || !noteText.trim()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Add"}
        </button>
      </form>

      {/* Timeline */}
      <div className="space-y-0">
        {notes.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No activity yet</p>
        ) : (
          notes.map((note, i) => (
            <div key={note.id} className="flex gap-3 pb-4 relative">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                  STATUS_COLORS[note.status] || "bg-slate-500"
                } ${i === 0 ? "ring-2 ring-offset-2 ring-offset-white ring-emerald-500/60" : ""}`} />
                {i < notes.length - 1 && (
                  <div className="w-px flex-1 bg-slate-100 mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    STATUS_STYLES[note.status] || "bg-slate-100 text-slate-500"
                  }`}>
                    {STATUS_LABELS[note.status] || note.status}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(note.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {note.note && (
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">{note.note}</p>
                )}
                {!note.note && (
                  <p className="mt-1 text-xs text-slate-500 italic">Status changed to {STATUS_LABELS[note.status] || note.status}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
