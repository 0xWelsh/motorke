import { NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/seo-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron: GET /api/cron/seo-audit?secret=CRON_SECRET
 * Logs audit summary; extend later to persist to DB or alert.
 */
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const report = await runSeoAudit();
    if (!report.ok) {
      console.warn("[cron/seo-audit] issues:", report.summary, report.issues?.slice(0, 5));
    }
    return NextResponse.json(report);
  } catch (err) {
    console.error("[cron/seo-audit]", err);
    return NextResponse.json({ error: err?.message || "Audit failed" }, { status: 500 });
  }
}
