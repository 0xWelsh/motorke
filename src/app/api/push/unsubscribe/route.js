// src/app/api/push/unsubscribe/route.js
// Remove a push subscription.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await db.pushSubscription.deleteMany({ where: { endpoint } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/unsubscribe] Error:", err);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
