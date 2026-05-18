export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextResponse } from "next/server";
import { processPendingSeoJobs } from "@/lib/seo-job-queue";

/** Process pending SEO jobs only (no enqueue). */
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await processPendingSeoJobs({ limit: 12 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
