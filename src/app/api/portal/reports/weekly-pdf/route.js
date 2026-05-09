import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionFromRequest } from "@/lib/auth";
import { buildWeeklyReportPayload } from "@/lib/dealer-weekly-report-data";
import DealerWeeklyReportPdf from "@/components/pdf/DealerWeeklyReportPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionFromRequest();

  if (!session?.user || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (session.user.role !== "DEALER" || !session.user.dealerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await buildWeeklyReportPayload(session.user.dealerId);

  const buffer = await renderToBuffer(<DealerWeeklyReportPdf report={report} />);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="welsh-motorhub-weekly-${report.filenameSuffix}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
