export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseDutyCrspCsv, upsertDutyCrspRows } from "@/lib/duty-crsp-import";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let csvText = "";
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof file === "string") {
        return NextResponse.json({ error: "Missing CSV file" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      csvText = await request.text();
    }
  } catch {
    return NextResponse.json({ error: "Could not read upload" }, { status: 400 });
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: "CSV is empty" }, { status: 400 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";
  const { rows, errors: parseErrors } = parseDutyCrspCsv(csvText);

  if (!rows.length) {
    return NextResponse.json(
      {
        error: "No valid rows found",
        parseErrors: parseErrors.slice(0, 30),
      },
      { status: 400 },
    );
  }

  const result = await upsertDutyCrspRows(db, rows, {
    source: `admin-upload:${session.user.email || session.user.id}`,
    dryRun,
  });

  const total = await db.dutyVehicle.count({ where: { active: true } });

  return NextResponse.json({
    ok: true,
    dryRun,
    parsed: rows.length,
    upserted: result.upserted,
    skipped: result.skipped,
    parseErrors: parseErrors.slice(0, 30),
    rowErrors: result.rowErrors.slice(0, 30),
    activeCatalogCount: total,
  });
}
