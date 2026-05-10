"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

/**
 * Downloads a PDF via fetch + Blob — reliable on mobile; avoids `<a download>` navigating
 * to the API URL (often shown as “site unavailable” or mis-saved as .txt).
 */
export default function PdfBlobDownloadButton({
  fetchUrl,
  fileStem = "report",
  idleLabel = "Download PDF",
  loadingLabel = "Preparing PDF…",
  buttonClassName,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(fetchUrl, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/pdf" },
      });

      const ct = res.headers.get("content-type") || "";

      if (!res.ok) {
        let msg = `Could not download (${res.status})`;
        try {
          const j = await res.json();
          if (j?.error) msg = String(j.error);
        } catch {
          try {
            const t = await res.text();
            if (t && t.length < 400) msg = t.trim().slice(0, 400);
          } catch {
            /* ignore */
          }
        }
        setError(msg);
        return;
      }

      if (!ct.includes("application/pdf")) {
        const snippet = await res.text().catch(() => "");
        setError(
          snippet?.slice(0, 280)?.trim() ||
            "Server returned something other than a PDF. Try again or contact support."
        );
        return;
      }

      const blob = await res.blob();
      const fallbackName = `${fileStem}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const cd = res.headers.get("content-disposition") || "";
      const m = /filename\*=UTF-8''([^;\s]+)|filename="([^"]+)"/i.exec(cd);
      const name =
        (m?.[1] && decodeURIComponent(m[1])) || m?.[2]?.trim() || fallbackName;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name.endsWith(".pdf") ? name : `${name}.pdf`;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.message || "Network error — check connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy}
        onClick={handleDownload}
        className={
          buttonClassName ||
          "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.14em] hover:opacity-90 transition-opacity disabled:opacity-60"
        }
      >
        {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <FileDown size={14} aria-hidden />}
        {busy ? loadingLabel : idleLabel}
      </button>
      {error ? (
        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 leading-snug" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
