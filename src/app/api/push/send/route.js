// src/app/api/push/send/route.js
// Send push notifications (admin-only).
// POST { title, body, url?, tag?, userId? } — send to one user or broadcast
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendPushToUser, broadcastPush } from "@/lib/push";

export async function POST(req) {
  await requireAdmin();

  try {
    const { title, body: msgBody, url, tag, userId } = await req.json();

    if (!title || !msgBody) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }

    const payload = {
      title,
      body: msgBody,
      url: url || "/",
      tag: tag || "bidgari-admin",
    };

    let result;
    if (userId) {
      result = await sendPushToUser(db, userId, payload);
    } else {
      result = await broadcastPush(db, payload);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[push/send] Error:", err);
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}
