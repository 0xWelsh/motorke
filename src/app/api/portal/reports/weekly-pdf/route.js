import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionFromRequest } from "@/lib/auth";
import { buildWeeklyReportPayload } from "@/lib/dealer-weekly-report-data";
import DealerWeeklyReportPdf from "@/components/pdf/DealerWeeklyReportPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow slow PDF render on serverless (e.g. Vercel). */
export const maxDuration = 60;

export async function GET() {
  try {
    const session = await getSessionFromRequest();

    if (!session?.user || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    if (session.user.role !== "DEALER" || !session.user.dealerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = await buildWeeklyReportPayload(session.user.dealerId);

    const buf = await renderToBuffer(<DealerWeeklyReportPdf report={report} />);
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);

    const filename = `welsh-motorhub-weekly-${report.filenameSuffix}.pdf`;

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[weekly-pdf]", err);
    return NextResponse.json(
      { error: err?.message || "PDF generation failed. Try again." },
      { status: 500 }
    );
  }
}
