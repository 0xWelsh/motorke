// src/app/api/account/profile/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone-verification";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const { name, email, phone } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    // Check-and-update in an interactive transaction to prevent email race
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({
        where: { email: email.toLowerCase(), id: { not: session.user.id } },
      });
      if (existing) {
        return { error: "Email already in use" };
      }
      await tx.user.update({
        where: { id: session.user.id },
        data:  { name: name.trim(), email: email.toLowerCase().trim() },
      });
      return { success: true };
    });

    if (updated.error) {
      return NextResponse.json({ error: updated.error }, { status: 400 });
    }

    const normalizedPhone = normalizeKenyanPhone(phone);
    const phoneKey = `buyer-phone:${session.user.id}`;
    await db.setting.upsert({
      where: { key: phoneKey },
      create: {
        key: phoneKey,
        value: JSON.stringify({ phone: normalizedPhone || null }),
        description: "Buyer contact phone",
      },
      update: {
        value: JSON.stringify({ phone: normalizedPhone || null }),
      },
    });

    const verifiedKey = `phone-verified:${session.user.id}`;
    const verified = await db.setting.findUnique({ where: { key: verifiedKey } });
    if (verified?.value) {
      let parsed = {};
      try {
        parsed = JSON.parse(verified.value);
      } catch {}
      const verifiedPhone = normalizeKenyanPhone(parsed?.phone || "");
      if (verifiedPhone && verifiedPhone !== normalizedPhone) {
        await db.setting.delete({ where: { key: verifiedKey } }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
