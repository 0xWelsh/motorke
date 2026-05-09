import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionFromRequest } from "@/lib/auth";
import { buildNetworkWeeklyReportPayload } from "@/lib/network-weekly-report-data";
import NetworkWeeklyReportPdf from "@/components/pdf/NetworkWeeklyReportPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionFromRequest();

  if (!session?.user || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await buildNetworkWeeklyReportPayload();

  const buffer = await renderToBuffer(<NetworkWeeklyReportPdf report={report} />);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="welsh-motorhub-network-weekly-${report.filenameSuffix}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
