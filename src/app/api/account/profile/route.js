// src/app/api/account/profile/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const { name, email, phone } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    // Check email not taken by another user
    const existing = await db.user.findFirst({
      where: { email: email.toLowerCase(), id: { not: session.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    await db.user.update({
      where: { id: session.userId },
      data:  { name: name.trim(), email: email.toLowerCase().trim() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
