import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

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
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days

  await db.session.create({
    data: {
      userId: targetUser.id,
      token,
      expiresAt,
    },
  });

  cookies().set({
    name: "motorke_session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
  });

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
