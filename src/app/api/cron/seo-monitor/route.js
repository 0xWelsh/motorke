export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { runSeoMonitorPipeline } from "@/lib/seo-monitor";
import { isCronAuthorised } from "@/lib/cron-auth";

/**
 * Cron: enqueue + process SEO monitor jobs (crawl, GSC, audit, LISTING_SEO queue).
 * Vercel Cron, or GET /api/cron/seo-monitor?secret=CRON_SECRET
 */
export async function GET(request) {
  if (!isCronAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await runSeoMonitorPipeline();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/seo-monitor]", err);
    return NextResponse.json({ error: err?.message || "Monitor failed" }, { status: 500 });
  }
}
