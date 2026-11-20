"use client";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteLeadButton({ leadId, leadName, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete lead from ${leadName}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      if (onDeleted) onDeleted(leadId);
      else window.location.reload();
    } catch {
      alert("Failed to delete lead. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-[var(--bg)]/60 px-2.5 py-1.5 text-[11px] font-bold text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-50"
      title="Delete lead"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
      Delete
    </button>
  );
}
