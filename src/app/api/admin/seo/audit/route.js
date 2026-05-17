import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { runSeoAudit } from "@/lib/seo-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const report = await runSeoAudit();
    return NextResponse.json(report);
  } catch (err) {
    console.error("[seo-audit]", err);
    return NextResponse.json({ error: "Audit failed" }, { status: 500 });
  }
}
