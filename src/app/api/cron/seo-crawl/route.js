export const dynamic = "force-dynamic";
export const maxDuration = 90;

import { NextResponse } from "next/server";
import { runCrawlMonitor } from "@/lib/seo-crawl-monitor";

/** GET /api/cron/seo-crawl?secret=CRON_SECRET */
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await runCrawlMonitor();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
