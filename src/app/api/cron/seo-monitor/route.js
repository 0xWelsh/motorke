export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { runSeoMonitorPipeline } from "@/lib/seo-monitor";

/**
 * Cron: GET /api/cron/seo-monitor?secret=CRON_SECRET
 * Persists audit, crawl smoke test, and GSC sync (when enabled).
 */
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
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
