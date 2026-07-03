import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const trackRateMap = new Map();

export async function POST(req, { params }) {
  const { id }     = await params;
  const { action } = await req.json(); // "whatsapp" or "print"

  // Per-car rate limit: max 1 request per 10 seconds per action
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateKey = `track:${id}:${action}:${clientIp}`;
  const now = Date.now();
  const last = trackRateMap.get(rateKey) || 0;
  if (now - last < 10_000) {
    return NextResponse.json({ success: true });
  }
  trackRateMap.set(rateKey, now);
  if (trackRateMap.size > 10_000) {
    const cutoff = now - 60_000;
    for (const [k, v] of trackRateMap) {
      if (v < cutoff) trackRateMap.delete(k);
    }
  }

  try {
    if (action === "whatsapp") {
      await db.car.update({
        where: { id },
        data: { whatsappClicks: { increment: 1 } },
      });
    } else if (action === "print") {
      await db.car.update({
        where: { id },
        data: { printCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
