// src/app/api/cron/whatsapp-digest/route.js
// GET /api/cron/whatsapp-digest — daily digest of latest cars posted to WhatsApp Channel

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isCronAuthorised } from "@/lib/cron-auth";
import { postDigestToWhatsAppChannel } from "@/lib/whatsapp-channel";
import { broadcastDigest, isBroadcastConfigured } from "@/lib/waha";
import { getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isCronAuthorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cars = await db.car.findMany({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
      },
      include: {
        images: { take: 1, orderBy: { isPrimary: "desc" } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    if (!cars.length) {
      return NextResponse.json({ success: true, posted: 0, message: "No cars to post" });
    }

    const origin = getSiteOrigin();
    const channelResult = await postDigestToWhatsAppChannel(cars, origin);
    let broadcastResult = null;
    if (isBroadcastConfigured()) {
      broadcastResult = await broadcastDigest(cars, origin);
    }

    return NextResponse.json({
      success: true,
      channel: channelResult.results?.filter((r) => r.success).length || 0,
      broadcast: broadcastResult?.results?.filter((r) => r.success).length || 0,
      total: cars.length,
    });
  } catch (err) {
    console.error("[WA Digest] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
