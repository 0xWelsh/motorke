// src/app/api/admin/seed-views/route.js
// Manual trigger: adds 40-50 views per car. Run from admin panel.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { runOrganicViews } from "@/app/api/cron/view-organic/route";

export async function POST() {
  await requireAdmin();
  const result = await runOrganicViews();
  return NextResponse.json({ success: true, ...result });
}
