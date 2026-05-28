"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";

export default function BuyerRequestAdminRowActions({ requestId, publicCode, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "CLOSED") {
    return <span className="text-[10px] font-bold uppercase text-slate-400">Removed</span>;
  }

  async function removeRequest() {
    const ok = window.confirm(
      `Remove ${publicCode} from the public board? The buyer record stays in admin for your notes.`
    );
    if (!ok) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/buyer-requests/${requestId}/delete`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Could not remove request.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={removeRequest}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 disabled:opacity-60 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        Remove
      </button>
      {error ? <p className="text-[10px] text-red-600 max-w-[120px] text-right">{error}</p> : null}
    </div>
  );
}
