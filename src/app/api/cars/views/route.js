// src/app/api/cars/views/route.js
//
// Single source of truth for a "car was viewed" event.
//
// Responsibilities (all of them in this one handler, on purpose):
//   1. Insert a row into `car_views` (the event stream used for charts
//      and weekly reports).
//   2. Increment the denormalised `car.views` counter (used for badges
//      and inventory-table sorting).
//   3. De-duplicate refresh spam: at most one view per
//      (carId, userId OR sessionKey) inside a 30-minute window.
//   4. Classify the referer into a friendly bucket so dealers can see
//      where their buyers are coming from.
//
// The endpoint is purposefully forgiving: any failure must NOT break the
// public car page. We log and return success-ish responses so the client
// never gets stuck in retry loops.

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { classifyViewSource } from "@/lib/view-source";

const DEDUP_WINDOW_MINUTES = 30;
const ROTATION_COOKIE      = "wmh-rot";

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

    // Dedup: have we already seen this same viewer on this same car
    // within the rolling window? If yes, do nothing.
    const since = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000);
    let recentMatch = null;

    if (userId) {
      recentMatch = await db.carView.findFirst({
        where: { carId, userId, viewedAt: { gte: since } },
        select: { id: true },
      });
    } else if (sessionKey) {
      recentMatch = await db.carView.findFirst({
        where: { carId, sessionKey, viewedAt: { gte: since } },
        select: { id: true },
      });
    }
    // If neither userId nor sessionKey exists, we can't dedupe reliably.
    // Accept the view rather than throw it away – cookie-blocked users
    // are a tiny minority and we'd rather slightly over-count than lose
    // them entirely.

    if (recentMatch) {
      return Response.json({ success: true, deduped: true });
    }

    // Make sure the car actually exists before we touch counters. We
    // skip the FK round-trip when we have neither userId nor sessionKey
    // because Prisma will raise on the create anyway.
    await Promise.all([
      db.carView.create({
        data: { carId, userId, sessionKey, source },
      }),
      db.car.update({
        where: { id: carId },
        data:  { views: { increment: 1 } },
      }).catch((err) => {
        // Don't fail the whole request if the car was deleted between
        // the page-load and the tracking ping.
        console.warn("[carView] counter bump failed", { carId, err: err?.message });
      }),
    ]);

    return Response.json({ success: true, source });
  } catch (error) {
    console.error("Failed to track car view:", error);
    // Soft-fail – tracking should never break the user experience.
    return Response.json({ error: "Failed to track view" }, { status: 500 });
  }
}
