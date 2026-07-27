import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function DutyImportEligibilityBanner({ eligibility, compact = false }) {
  if (!eligibility) return null;

  const { status, message, oldestImportableYear } = eligibility;

  if (status === "eligible") {
    if (compact) return null;
    return (
      <div
        className="flex gap-3 p-4 border border-[var(--accent)]/20 bg-[var(--accent)]/5 rounded-xl"
        role="status"
      >
        <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-xs font-bold text-[var(--accent)]">Eligible to import (8-year rule)</p>
          <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    );
  }

  if (status === "borderline") {
    return (
      <div
        className="flex gap-3 p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl"
        role="status"
      >
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-xs font-bold text-amber-300">At the 8-year import limit</p>
          <p className="text-[11px] text-amber-200/80 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 p-4 border-2 border-red-500/30 bg-red-500/5 rounded-xl"
      role="alert"
    >
      <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="text-xs font-bold text-red-300">Not registrable in Kenya (over 8 years)</p>
        <p className="text-[11px] text-red-200/80 mt-1 leading-relaxed">{message}</p>
        <p className="text-[11px] font-semibold text-red-300/80 mt-2">
          For {new Date().getFullYear()}, target model year {oldestImportableYear} or newer. Tax estimate below is
          illustrative only. NTSA will not register this age.
        </p>
      </div>
    </div>
  );
}
