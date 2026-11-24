import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Admin decision on a user's verification application.
 * Body: { decision: "APPROVE" | "REJECT", reason?: string }
 */
export async function POST(request, { params }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { decision, reason } = await request.json().catch(() => ({}));

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, verificationStatus: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (decision === "APPROVE") {
    await db.user.update({
      where: { id },
      data: {
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
        verifiedBy: admin.id,
        verificationRejectionReason: null,
      },
    });
  } else if (decision === "REJECT") {
    await db.user.update({
      where: { id },
      data: {
        verificationStatus: "REJECTED",
        verificationRejectionReason: String(reason || "").slice(0, 300) || null,
      },
    });
  } else {
    return NextResponse.json({ error: "decision must be APPROVE or REJECT" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
