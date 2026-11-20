"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { humanizeError, humanizeApiError } from "@/lib/humanize-error";

export default function BuyerRequestAdminRowActions({ requestId, publicCode, status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "CLOSED") {
    return <span className="text-[10px] font-bold uppercase text-slate-500">Removed</span>;
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
        setError(humanizeApiError(data, "Could not remove request."));
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
        className="inline-flex items-center gap-1.5 rounded-md border border-rose-800/50 bg-rose-950/30 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-300 hover:bg-rose-950/60 disabled:opacity-60 transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        Remove
      </button>
      {error ? <p className="text-[10px] text-rose-500 max-w-[120px] text-right">{error}</p> : null}
    </div>
  );
}
