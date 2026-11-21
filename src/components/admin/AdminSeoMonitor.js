import Link from "next/link";
import { BarChart3, Gauge, Globe, ListTodo, Radar } from "lucide-react";
import AdminGscTrendChart from "@/components/admin/AdminGscTrendChart";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function pct(n) {
  return `${(Number(n) * 100).toFixed(1)}%`;
}

function jobStatusClass(status) {
  if (status === "DONE") return "bg-emerald-100 text-emerald-800 bg-emerald-950 text-emerald-700";
  if (status === "FAILED") return "bg-red-100 text-red-800 bg-red-950 text-red-300";
  if (status === "RUNNING") return "bg-blue-100 text-blue-800 bg-blue-950 text-blue-300";
  return "bg-surface-overlay text-muted bg-surface-overlay text-ghost";
}

export default function AdminSeoMonitor({ monitor }) {
  const {
    crawlRun,
    crawlFailures,
    gscSync,
    gscQueries,
    gscPages,
    gscDaily,
    pageSpeedRuns,
    recentJobs,
    auditRun,
    config,
  } = monitor;

  return (
    <div className="space-y-8 mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Phase 3</p>
          <h2 className="text-lg font-bold text-text text-text">Search monitoring</h2>
        </div>
        <Link
          href="/api/admin/seo/monitor"
          target="_blank"
          className="text-[10px] font-bold uppercase tracking-widest text-accent hover:opacity-80"
        >
          Monitor JSON →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-border border-border px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Job queue</p>
          <p className="mt-1 font-semibold text-text text-text">{config.jobQueue || "postgres"}</p>
        </div>
        <div className="rounded-xl border border-border border-border px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">PageSpeed</p>
          <p className="mt-1 font-semibold text-text text-text">
            {config.pageSpeedEnabled ? "API key set" : "No PSI key"}
          </p>
        </div>
        <div className="rounded-xl border border-border border-border px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Alerts</p>
          <p className="mt-1 font-semibold text-text text-text">
            {config.alertsEnabled ? "Email" : "Off"}
            {config.slackEnabled ? " + Slack" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-border border-border px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted">GSC</p>
          <p className="mt-1 font-semibold text-text text-text">{config.gscEnabled ? "On" : "Off"}</p>
        </div>
      </div>

      <section className="rounded-xl border border-border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-subtle border-border bg-surface-hover bg-surface flex items-center gap-2">
          <Radar className="w-4 h-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Crawl smoke test</h3>
          {crawlRun ? (
            <span
              className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                crawlRun.ok
                  ? "bg-emerald-100 text-emerald-800 bg-emerald-950 text-emerald-700"
                  : "bg-red-100 text-red-800 bg-red-950 text-red-300"
              }`}
            >
              {crawlRun.ok ? "OK" : "Issues"}
            </span>
          ) : null}
        </div>
        {!crawlRun ? (
          <p className="px-4 py-4 text-sm text-muted">
            No crawl runs yet. Hit{" "}
            <code className="text-xs bg-surface-overlay bg-surface-overlay px-1">/api/cron/seo-crawl?secret=…</code> or{" "}
            <code className="text-xs bg-surface-overlay bg-surface-overlay px-1">seo-monitor</code>.
          </p>
        ) : (
          <>
            <p className="px-4 py-2 text-[11px] text-muted border-b border-subtle border-border">
              {fmtDate(crawlRun.createdAt)} · {crawlRun.entries?.length || 0} URLs
              {crawlRun.meta?.workerSkipped ? " · local fallback" : " · Go worker"}
            </p>
            <ul className="divide-y divide-border divide-border max-h-64 overflow-y-auto">
              {(crawlRun.entries || []).map((e) => (
                <li key={e.id} className="px-4 py-2 text-xs flex gap-3">
                  <span
                    className={`font-mono tabular-nums shrink-0 ${
                      e.status >= 400 || e.status === 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {e.status || "—"}
                  </span>
                  <span className="text-secondary text-ghost truncate">{e.url}</span>
                  {e.error ? <span className="text-red-500 truncate">{e.error}</span> : null}
                </li>
              ))}
            </ul>
            {crawlFailures.length > 0 && (
              <p className="px-4 py-2 text-xs text-amber-700 text-amber-300 bg-amber-50 bg-amber-950/30">
                {crawlFailures.length} URL(s) need attention.
              </p>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-subtle border-border bg-surface-hover bg-surface flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Search Console (28d)</h3>
        </div>
        {!gscSync ? (
          <p className="px-4 py-4 text-sm text-muted">
            {config.gscEnabled
              ? "No sync yet — run /api/cron/seo-gsc or npm run seo:sync-gsc"
              : "Set GSC_SYNC_ENABLED=true and GSC_SITE_URL + service account JSON."}
          </p>
        ) : (
          <>
            <p className="px-4 py-2 text-[11px] text-muted border-b border-subtle border-border">
              Synced {fmtDate(gscSync.syncedAt)} · {gscSync.siteUrl}
            </p>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border divide-border">
              <div>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted">Top queries</p>
                <ul className="divide-y divide-border divide-border max-h-72 overflow-y-auto">
                  {gscQueries.map((row) => (
                    <li key={row.id} className="px-4 py-2 text-xs flex justify-between gap-2">
                      <span className="text-text truncate">{row.key}</span>
                      <span className="text-muted shrink-0 tabular-nums">
                        {row.clicks} clk · pos {row.position.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted">Top pages</p>
                <ul className="divide-y divide-border divide-border max-h-72 overflow-y-auto">
                  {gscPages.map((row) => (
                    <li key={row.id} className="px-4 py-2 text-xs">
                      <p className="text-text truncate">{row.key}</p>
                      <p className="text-muted tabular-nums mt-0.5">
                        {row.impressions} imp · {pct(row.ctr)} CTR · pos {row.position.toFixed(1)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-subtle border-border bg-surface-hover bg-surface flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Search trend (daily)</h3>
        </div>
        <AdminGscTrendChart series={gscDaily} />
      </section>

      <section className="rounded-xl border border-border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-subtle border-border bg-surface-hover bg-surface flex items-center gap-2">
          <Gauge className="w-4 h-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">PageSpeed Insights</h3>
        </div>
        {!pageSpeedRuns?.length ? (
          <p className="px-4 py-4 text-sm text-muted">
            {config.pageSpeedEnabled
              ? "No runs yet — queued via seo-monitor cron."
              : "Set GOOGLE_PAGESPEED_API_KEY (Google Cloud Console)."}
          </p>
        ) : (
          <ul className="divide-y divide-border divide-border">
            {pageSpeedRuns.map((r) => (
              <li key={r.id} className="px-4 py-2 text-xs flex flex-wrap justify-between gap-2">
                <span className="text-text truncate max-w-[60%]">{r.url}</span>
                <span className="text-muted tabular-nums shrink-0">
                  {r.strategy} · perf {r.performance ?? "—"}
                  {r.lcpMs != null ? ` · LCP ${Math.round(r.lcpMs)}ms` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-subtle border-border bg-surface-hover bg-surface flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-muted" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted">Job queue</h3>
        </div>
        {!recentJobs?.length ? (
          <p className="px-4 py-4 text-sm text-muted">No jobs yet.</p>
        ) : (
          <ul className="divide-y divide-border divide-border max-h-48 overflow-y-auto">
            {recentJobs.map((j) => (
              <li key={j.id} className="px-4 py-2 text-xs flex items-center justify-between gap-2">
                <span className="font-mono text-secondary text-ghost">{j.type}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${jobStatusClass(j.status)}`}>
                  {j.status}
                </span>
                <span className="text-muted tabular-nums shrink-0">{fmtDate(j.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-muted flex items-center gap-2">
        <Globe className="w-3.5 h-3.5" />
        Cron enqueues + processes jobs:{" "}
        <code className="bg-surface-overlay bg-surface-overlay px-1">/api/cron/seo-monitor?secret=CRON_SECRET</code>
      </p>
    </div>
  );
}
