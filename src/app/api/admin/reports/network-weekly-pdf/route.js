import React from "react";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSessionFromRequest } from "@/lib/auth";
import { buildNetworkWeeklyReportPayload } from "@/lib/network-weekly-report-data";
import NetworkWeeklyReportPdf from "@/components/pdf/NetworkWeeklyReportPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const session = await getSessionFromRequest();

    if (!session?.user || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const report = await buildNetworkWeeklyReportPayload();

    const buf = await renderToBuffer(<NetworkWeeklyReportPdf report={report} />);
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);

    const filename = `welsh-motorhub-network-weekly-${report.filenameSuffix}.pdf`;

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
    console.error("[network-weekly-pdf]", err);
    return NextResponse.json(
      { error: err?.message || "PDF generation failed. Try again." },
      { status: 500 }
    );
  }
}
