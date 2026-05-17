import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { runSeoAudit } from "@/lib/seo-audit";
import { Search, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO — Welsh Motorhub Admin" };

export default async function AdminSeoPage() {
  await requireAdmin();
  const report = await runSeoAudit();

  return (
    <div className="mk-page-shell animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-5xl">
      <AdminPageHeader
        eyebrow="Technical SEO"
        title="SEO health"
        description="Listing slugs, metadata readiness, and sitemap targets. Use Search Console for rankings and impressions (Phase 3)."
        actions={
          <Link
            href="/api/admin/seo/audit"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-slate-900 dark:border-white text-slate-900 dark:text-white hover:opacity-80"
            style={{ borderRadius: "var(--radius)" }}
          >
            JSON <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {[
          { label: "Listings checked", value: report.summary.listingsChecked },
          { label: "Missing slug", value: report.summary.missingPublicSlug },
          { label: "No description", value: report.summary.missingDescription },
          { label: "No images", value: report.summary.missingImages },
          { label: "Issues", value: report.summary.issueCount },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 mb-8 ${
          report.ok
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
            : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
        }`}
      >
        {report.ok ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {report.ok ? "No critical SEO blockers detected" : "Action recommended"}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Sitemap:{" "}
            <a href={report.sitemapUrl} className="underline" target="_blank" rel="noreferrer">
              {report.sitemapUrl}
            </a>
          </p>
        </div>
      </div>

      {report.issues.length > 0 && (
        <section className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">Issues</h2>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {report.issues.map((issue, i) => (
              <li key={`${issue.code}-${i}`} className="px-4 py-3 text-sm">
                <span
                  className={`inline-block text-[9px] font-black uppercase tracking-widest mr-2 px-1.5 py-0.5 rounded ${
                    issue.severity === "error"
                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                      : issue.severity === "warn"
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300"
                  }`}
                >
                  {issue.severity}
                </span>
                <span className="text-slate-800 dark:text-slate-200">{issue.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 rounded-xl border border-slate-200 dark:border-zinc-800 p-5 text-sm text-slate-600 dark:text-slate-400">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Next steps</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Run <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1">npm run db:backfill-slugs</code> if slugs are missing.</li>
          <li>Submit sitemap in Google Search Console.</li>
          <li>
            Optional: set <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1">GOOGLE_INDEXING_ENABLED=true</code> and{" "}
            <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1">GOOGLE_SERVICE_ACCOUNT_JSON</code> for Indexing API on new listings.
          </li>
          <li>Deploy the Go SEO worker (<code className="text-xs">services/seo-worker</code>) for crawl monitoring (Phase 3).</li>
        </ul>
      </section>
    </div>
  );
}
