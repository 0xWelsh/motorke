// src/app/api/push/subscribe/route.js
// Store a push subscription for the current user (or anonymous device).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Missing push subscription keys" }, { status: 400 });
    }

    const session = await getSession();
    const userId = session?.user?.id || null;
    const userAgent = req.headers.get("user-agent") || null;

    // Upsert by endpoint (unique) — prevents duplicates
    const existing = await db.pushSubscription.findUnique({ where: { endpoint } });

    if (existing) {
      // Update existing subscription (keys may rotate)
      await db.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh,
          auth,
          userId: userId || existing.userId,
          userAgent,
          lastUsedAt: new Date(),
        },
      });
    } else {
      await db.pushSubscription.create({
        data: { endpoint, p256dh, auth, userId, userAgent },
      });
    }

    const totalSubs = await db.pushSubscription.count();

    return NextResponse.json({ ok: true, totalSubs });
  } catch (err) {
    console.error("[push/subscribe] Error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
