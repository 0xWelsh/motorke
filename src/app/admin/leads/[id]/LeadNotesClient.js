"use client";

import { useState } from "react";

const STATUS_COLORS = {
  NEW: "bg-emerald-500",
  CONTACTED: "bg-blue-500",
  INTERESTED: "bg-violet-500",
  NEGOTIATING: "bg-amber-500",
  SOLD: "bg-green-500",
  DEAD: "bg-zinc-500",
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
  NEW: "bg-emerald-950/40 text-emerald-300",
  CONTACTED: "bg-blue-950/40 text-blue-300",
  INTERESTED: "bg-violet-950/40 text-violet-300",
  NEGOTIATING: "bg-amber-950/40 text-amber-300",
  SOLD: "bg-green-950/40 text-green-300",
  DEAD: "bg-zinc-800 text-zinc-400",
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
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
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
                  ? `${STATUS_STYLES[s] || "bg-zinc-800 text-zinc-300"} ring-1 ring-white/10`
                  : "bg-zinc-800/50 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
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
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-emerald-500/50 focus:bg-zinc-950"
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
          <p className="text-xs text-zinc-600 text-center py-6">No activity yet</p>
        ) : (
          notes.map((note, i) => (
            <div key={note.id} className="flex gap-3 pb-4 relative">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`h-2.5 w-2.5 rounded-full mt-1.5 ${
                  STATUS_COLORS[note.status] || "bg-zinc-600"
                } ${i === 0 ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-emerald-500/40" : ""}`} />
                {i < notes.length - 1 && (
                  <div className="w-px flex-1 bg-zinc-800 mt-1" />
                )}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    STATUS_STYLES[note.status] || "bg-zinc-800 text-zinc-400"
                  }`}>
                    {STATUS_LABELS[note.status] || note.status}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(note.createdAt).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {note.note && (
                  <p className="mt-1 text-sm text-zinc-300 leading-relaxed">{note.note}</p>
                )}
                {!note.note && (
                  <p className="mt-1 text-xs text-zinc-600 italic">Status changed to {STATUS_LABELS[note.status] || note.status}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
