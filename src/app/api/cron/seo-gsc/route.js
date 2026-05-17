export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { syncGscToDatabase } from "@/lib/seo-gsc-sync";

/** GET /api/cron/seo-gsc?secret=CRON_SECRET */
export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const result = await syncGscToDatabase();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
