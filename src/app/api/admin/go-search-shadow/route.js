export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getGoSearchShadowMetrics } from "@/lib/go-search";

export async function GET() {
  try {
    await requireAdmin();
    const metrics = getGoSearchShadowMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Go search shadow metrics error:", error);
    return NextResponse.json({ error: "Failed to fetch go-search shadow metrics" }, { status: 500 });
  }
}
