import { ShieldCheck, RefreshCw, FileCheck2 } from "lucide-react";

export default function DutyTrustBar({ lastUpdated = null }) {
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-KE", { month: "long", year: "numeric" })
    : "2025/26 KRA schedule";

  return (
    <section
      className="border border-border bg-surface-hover px-4 py-4 sm:px-6 sm:py-5"
      style={{ borderRadius: "var(--radius)" }}
      aria-label="Trust and methodology"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-xs font-bold text-text">KRA-style structure</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              IDF, excise bands, VAT, and railway levy using current import methodology.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <RefreshCw className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-xs font-bold text-text">Rates last reviewed</p>
            <p className="text-[11px] text-muted mt-1">{updatedLabel}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <FileCheck2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden />
          <div>
            <p className="text-xs font-bold text-text">For buyers &amp; dealers</p>
            <p className="text-[11px] text-muted mt-1 leading-relaxed">
              Illustrative CRSP references, not a binding KRA assessment. Always confirm before payment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
