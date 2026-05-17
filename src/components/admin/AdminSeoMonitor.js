import Link from "next/link";
import { BarChart3, Globe, Radar } from "lucide-react";

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

export default function AdminSeoMonitor({ monitor }) {
  const { crawlRun, crawlFailures, gscSync, gscQueries, gscPages, auditRun, config } = monitor;

  return (
    <div className="space-y-8 mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Phase 3</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Search monitoring</h2>
        </div>
        <Link
          href="/api/admin/seo/monitor"
          target="_blank"
          className="text-[10px] font-bold uppercase tracking-widest text-[#2F855A] hover:opacity-80"
        >
          Monitor JSON →
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">SEO worker</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">
            {config.workerUrl ? "Configured" : "Not set (local HEAD fallback)"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">GSC sync</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">
            {config.gscEnabled ? "Enabled" : "Disabled"}
          </p>
          {config.gscSiteUrl ? (
            <p className="text-[10px] text-slate-500 mt-1 truncate">{config.gscSiteUrl}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-zinc-800 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last audit saved</p>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmtDate(auditRun?.createdAt)}</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-2">
          <Radar className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Crawl smoke test</h3>
          {crawlRun ? (
            <span
              className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                crawlRun.ok
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
              }`}
            >
              {crawlRun.ok ? "OK" : "Issues"}
            </span>
          ) : null}
        </div>
        {!crawlRun ? (
          <p className="px-4 py-4 text-sm text-slate-500">
            No crawl runs yet. Hit{" "}
            <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1">/api/cron/seo-crawl?secret=…</code> or{" "}
            <code className="text-xs bg-slate-100 dark:bg-zinc-800 px-1">seo-monitor</code>.
          </p>
        ) : (
          <>
            <p className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 dark:border-zinc-800">
              {fmtDate(crawlRun.createdAt)} · {crawlRun.entries?.length || 0} URLs
              {crawlRun.meta?.workerSkipped ? " · local fallback" : " · Go worker"}
            </p>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-64 overflow-y-auto">
              {(crawlRun.entries || []).map((e) => (
                <li key={e.id} className="px-4 py-2 text-xs flex gap-3">
                  <span
                    className={`font-mono tabular-nums shrink-0 ${
                      e.status >= 400 || e.status === 0 ? "text-red-600" : "text-emerald-600"
                    }`}
                  >
                    {e.status || "—"}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 truncate">{e.url}</span>
                  {e.error ? <span className="text-red-500 truncate">{e.error}</span> : null}
                </li>
              ))}
            </ul>
            {crawlFailures.length > 0 && (
              <p className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30">
                {crawlFailures.length} URL(s) need attention.
              </p>
            )}
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Search Console (28d)</h3>
        </div>
        {!gscSync ? (
          <p className="px-4 py-4 text-sm text-slate-500">
            {config.gscEnabled
              ? "No sync yet — run /api/cron/seo-gsc or npm run seo:sync-gsc"
              : "Set GSC_SYNC_ENABLED=true and GSC_SITE_URL + service account JSON."}
          </p>
        ) : (
          <>
            <p className="px-4 py-2 text-[11px] text-slate-500 border-b border-slate-100 dark:border-zinc-800">
              Synced {fmtDate(gscSync.syncedAt)} · {gscSync.siteUrl}
            </p>
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-zinc-800">
              <div>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Top queries</p>
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                  {gscQueries.map((row) => (
                    <li key={row.id} className="px-4 py-2 text-xs flex justify-between gap-2">
                      <span className="text-slate-800 dark:text-slate-200 truncate">{row.key}</span>
                      <span className="text-slate-500 shrink-0 tabular-nums">
                        {row.clicks} clk · pos {row.position.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Top pages</p>
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800 max-h-72 overflow-y-auto">
                  {gscPages.map((row) => (
                    <li key={row.id} className="px-4 py-2 text-xs">
                      <p className="text-slate-800 dark:text-slate-200 truncate">{row.key}</p>
                      <p className="text-slate-500 tabular-nums mt-0.5">
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

      <p className="text-xs text-slate-500 flex items-center gap-2">
        <Globe className="w-3.5 h-3.5" />
        Combined cron:{" "}
        <code className="bg-slate-100 dark:bg-zinc-800 px-1">/api/cron/seo-monitor?secret=CRON_SECRET</code>
      </p>
    </div>
  );
}
