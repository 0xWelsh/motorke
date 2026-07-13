import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  await requireAdmin();
  const { id } = await params;

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  await db.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
