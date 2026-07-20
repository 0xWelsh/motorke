import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  const { assignedToId } = await request.json();

  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const admin = assignedToId
    ? await db.user.findFirst({ where: { id: assignedToId, role: "ADMIN", active: true }, select: { id: true, name: true } })
    : null;

  if (assignedToId && !admin) {
    return NextResponse.json({ error: "Invalid admin user" }, { status: 400 });
  }

  const updated = await db.lead.update({
    where: { id },
    data: { assignedToId: assignedToId || null },
  });

  await db.leadNote.create({
    data: {
      leadId: id,
      status: lead.status,
      note: assignedToId
        ? `Reassigned to ${admin.name}`
        : "Assignment cleared",
    },
  });

  if (assignedToId) {
    await db.notification.create({
      data: {
        userId: assignedToId,
        type: "LEAD_ASSIGNED",
        title: "Lead assigned to you",
        message: `A lead (${lead.name}) has been reassigned to you.`,
        link: `/admin/leads/${id}`,
      },
    });
  }

  return NextResponse.json({ success: true, assignedTo: admin ? { id: admin.id, name: admin.name } : null });
}
