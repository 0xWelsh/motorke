// src/app/api/push/vapid-public-key/route.js
// Returns the VAPID public key for client-side push subscription.
import { NextResponse } from "next/server";

export const revalidate = 86400; // cache 24h

export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    return NextResponse.json({ error: "Push notifications not configured" }, { status: 503 });
  }
  return NextResponse.json({ key });
}
