import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["NEW", "CONTACTED", "INTERESTED", "NEGOTIATING", "SOLD", "DEAD"];

export async function PATCH(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  const { status } = await request.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const updated = await db.lead.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ success: true, status: updated.status });
}
