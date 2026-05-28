import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdminApi() {
  const session = await getSessionFromRequest();
  if (!session?.user || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function POST(_request, { params }) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.buyerRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    await db.buyerRequest.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({ success: true, publicCode: existing.publicCode });
  } catch (err) {
    console.error("Admin buyer request delete error:", err);
    return NextResponse.json({ error: "Could not remove request." }, { status: 500 });
  }
}
