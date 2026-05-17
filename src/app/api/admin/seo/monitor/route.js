export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSeoMonitorDashboard } from "@/lib/seo-monitor";

export async function GET() {
  await requireAdmin();
  const dashboard = await getSeoMonitorDashboard();
  return NextResponse.json(dashboard);
}
