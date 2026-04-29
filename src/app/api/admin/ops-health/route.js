export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getTelemetrySnapshot } from "@/lib/telemetry";
import { getAuditEvents } from "@/lib/audit-trail";
import { getGoSearchShadowMetrics } from "@/lib/go-search";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  return NextResponse.json({
    telemetry: getTelemetrySnapshot(),
    audit: getAuditEvents(60),
    goSearch: getGoSearchShadowMetrics(),
  });
}
