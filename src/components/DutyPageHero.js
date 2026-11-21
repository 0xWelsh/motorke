"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, AlertTriangle, XCircle } from "lucide-react";
import TrackedLink from "@/components/TrackedLink";
import { assessImportEligibility, getImportYearWindow } from "@/lib/duty-import-eligibility";

const currentYear = new Date().getFullYear();

export default function DutyPageHero({ compact = false, children = null }) {
  const [checkYear, setCheckYear] = useState("");
  const [verdict, setVerdict] = useState(null);

  const handleYearChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCheckYear(value);
    if (value.length === 4) {
      const y = parseInt(value, 10);
      if (y >= 1980 && y <= currentYear + 1) {
        setVerdict(assessImportEligibility(y));
        return;
      }
    }
    setVerdict(null);
  };

  if (compact) {
    return null;
  }

  const { oldestImportableYear } = getImportYearWindow();

  return (
    <section className="relative mb-0 overflow-hidden border-b border-border bg-accent-wash">
      <div className="home-shell pt-2 pb-4 sm:pb-6 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <nav className="text-xs text-muted mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-text font-medium">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-text">Duty calculator</span>
          </nav>

          <div className="max-w-2xl lg:max-w-[55%]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent mb-2">
              Kenya import decision engine
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black text-text mb-3 leading-[1.05] tracking-tight">
              Vehicle{" "}
              <span className="text-accent">duty calculator</span>
            </h1>
            <p className="text-sm sm:text-base text-muted leading-relaxed mb-4">
              Instant KRA-style tax breakdown for popular imports, then browse matching stock we sell directly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-5 max-w-md">
              <TrackedLink
                href="/cars"
                eventName="duty_hero_inventory_click"
                className="btn btn-primary"
                style={{ borderRadius: "var(--radius)" }}
              >
                Browse cars
              </TrackedLink>
              <Link
                href="#duty-calculator"
                className="btn btn-primary"
              >
                Calculate <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted mb-5">
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                Instant estimate
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                KRA-style taxes
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                8-year import eligibility check
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden />
                Verified dealer stock
              </li>
            </ul>

            <div className="max-w-xl">
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 p-4 border border-border bg-glass/80 rounded-xl">
                <div className="flex-1">
                  <label
                    htmlFor="eligibility-year"
                    className="block text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-1.5"
                  >
                    Is your model importable? Enter model year
                  </label>
                  <input
                    id="eligibility-year"
                    type="text"
                    inputMode="numeric"
                    value={checkYear}
                    onChange={handleYearChange}
                    placeholder={`e.g. ${currentYear - 4} (need ${oldestImportableYear} or newer)`}
                    className="w-full h-11 px-4 text-sm font-medium bg-surface-hover border border-border text-text focus:border-[var(--accent)] outline-none rounded-xl"
                  />
                </div>
                <Link
                  href="#duty-calculator"
                  className="h-11 inline-flex items-center justify-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-4 text-[10px] font-bold uppercase tracking-widest transition-colors rounded-xl"
                >
                  Calculate taxes <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
                </Link>
              </div>

              {verdict && (
                <div
                  className={`mt-2 flex gap-2 items-start p-3 border text-xs rounded-xl ${
                    verdict.status === "ineligible"
                      ? "bg-red-50 border-red-200 text-red-800"
                      : verdict.status === "borderline"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                  role={verdict.status === "ineligible" ? "alert" : "status"}
                >
                  {verdict.status === "ineligible" ? (
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  ) : verdict.status === "borderline" ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                  )}
                  <p>{verdict.message}</p>
                </div>
              )}
            </div>
          </div>

          {children ? <div className="max-w-3xl mt-4 relative z-10">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
