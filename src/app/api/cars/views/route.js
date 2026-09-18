// src/app/api/cars/views/route.js
//
// Entry point for a "car was viewed" event fired by the dwell-based
// tracker on the public car page. All recording logic (event row, counter
// bump, dedup, cache refresh) lives in lib/record-car-view.js and is
// shared with /api/leads so enquiries also count as views.
//
// The endpoint is purposefully forgiving: any failure must NOT break the
// public car page. We log and return success-ish responses so the client
// never gets stuck in retry loops.

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { classifyViewSource } from "@/lib/view-source";
import { recordCarView, ROTATION_COOKIE } from "@/lib/record-car-view";

const WINDOW_DAYS = 7;

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const carId = url.searchParams.get("carId");
    const isPriceDrop = url.searchParams.get("priceDrop") === "true";

    if (!carId) {
      return Response.json({ error: "carId required" }, { status: 400 });
    }

    if (isPriceDrop) {
      const last = await db.carPriceChange.findFirst({
        where: { carId },
        orderBy: { createdAt: "desc" },
      });
      if (last) {
        return Response.json({
          oldPrice: last.oldPrice,
          newPrice: last.newPrice,
          changedAt: last.createdAt,
        });
      }
      return Response.json({ oldPrice: null, newPrice: null });
    }

    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const count = await db.carView.count({
      where: { carId, viewedAt: { gte: since } },
    });

    return Response.json({ count });
  } catch (error) {
    console.error("Failed to get view count:", error);
    return Response.json({ count: 0 });
  }
}
export const dynamic = "force-dynamic";

function getOwnOrigin(req) {
  try {
    const u = new URL(req.url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || null;
  }
}

export async function POST(req) {
  try {
    const body   = await req.json().catch(() => ({}));
    const carId  = typeof body.carId === "string" ? body.carId : null;
    if (!carId) {
      return Response.json({ error: "carId required" }, { status: 400 });
    }

    const referrer = typeof body.referrer === "string" ? body.referrer : null;
    const session  = await getSession();
    const userId   = session?.user?.id || null;

    // Per-device anonymous key (set by middleware). Falls back to the
    // value the client echoed in the body so we still dedupe if cookies
    // are blocked for any reason.
    const cookieSessionKey = req.cookies.get(ROTATION_COOKIE)?.value || null;
    const bodySessionKey   = typeof body.sessionKey === "string" ? body.sessionKey : null;
    const sessionKey       = cookieSessionKey || bodySessionKey || null;

    const ownOrigin = getOwnOrigin(req);
    const source    = classifyViewSource(referrer, ownOrigin);

    const result = await recordCarView({ carId, userId, sessionKey, source });

    return Response.json({
      success: true,
      source,
      recorded: result.recorded,
      deduped:  result.deduped,
    });
  } catch (error) {
    console.error("Failed to track car view:", error);
    // Soft-fail – tracking should never break the user experience.
    return Response.json({ error: "Failed to track view" }, { status: 500 });
  }
}
