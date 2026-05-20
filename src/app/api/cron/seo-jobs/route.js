export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { processPendingSeoJobs } from "@/lib/seo-job-queue";
import { isCronAuthorised } from "@/lib/cron-auth";

/** Process pending SEO jobs (LISTING_SEO, crawl, GSC, etc.). Vercel Cron or ?secret= / Bearer. */
export async function GET(request) {
  if (!isCronAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await processPendingSeoJobs({ limit: 12 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
