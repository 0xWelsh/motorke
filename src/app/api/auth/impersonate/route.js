import { db } from "@/lib/db";
import { getSessionFromRequest, createSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getSessionFromRequest();
  
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const targetDealerId = formData.get("dealerId");

  if (!targetDealerId) {
    return NextResponse.json({ error: "Missing dealerId" }, { status: 400 });
  }

  // Find the primary user for this dealer
  const targetUser = await db.user.findFirst({
    where: { dealerId: targetDealerId },
  });

  if (!targetUser) {
    return NextResponse.redirect(new URL(`/admin/dealers?error=NoUserFound`, request.url));
  }

  // Create a new session for the target user to impersonate them
  await createSession(targetUser.id);

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
