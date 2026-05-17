export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { syncComparisonPagesFromInventory } from "@/lib/seo-comparison-generator";

/** Nightly comparison page sync from live inventory (CRON_SECRET). */
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  if (!secret || searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pages = await syncComparisonPagesFromInventory({ maxPairs: 30 });
    return NextResponse.json({ ok: true, synced: pages.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
