import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  const { note, status } = await request.json();

  if (!note || note.trim().length === 0) {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const [created] = await db.$transaction([
    db.leadNote.create({
      data: {
        leadId: id,
        note: note.trim(),
        status: status || lead.status,
      },
    }),
  ]);

  return NextResponse.json({ success: true, note: created });
}
