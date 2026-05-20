import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

export default function DutyImportEligibilityBanner({ eligibility, compact = false }) {
  if (!eligibility) return null;

  const { status, message, oldestImportableYear } = eligibility;

  if (status === "eligible") {
    if (compact) return null;
    return (
      <div
        className="flex gap-3 p-4 border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/30"
        style={{ borderRadius: "var(--radius)" }}
        role="status"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Eligible to import (8-year rule)</p>
          <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    );
  }

  if (status === "borderline") {
    return (
      <div
        className="flex gap-3 p-4 border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30"
        style={{ borderRadius: "var(--radius)" }}
        role="status"
      >
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-xs font-bold text-amber-900 dark:text-amber-200">At the 8-year import limit</p>
          <p className="text-[11px] text-amber-900/90 dark:text-amber-200/90 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 p-4 border-2 border-red-600 dark:border-red-500 bg-red-50 dark:bg-red-950/40"
      style={{ borderRadius: "var(--radius)" }}
      role="alert"
    >
      <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="text-xs font-bold text-red-900 dark:text-red-200">Not registrable in Kenya (over 8 years)</p>
        <p className="text-[11px] text-red-900/90 dark:text-red-200/90 mt-1 leading-relaxed">{message}</p>
        <p className="text-[11px] font-semibold text-red-800 dark:text-red-300 mt-2">
          For {new Date().getFullYear()}, target model year {oldestImportableYear} or newer. Tax estimate below is
          illustrative only. NTSA will not register this age.
        </p>
      </div>
    </div>
  );
}
