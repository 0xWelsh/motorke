import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import {
  buyerRequestExpiresAt,
  generateBuyerRequestPublicCode,
  parseBuyerRequestPayload,
  serializeBuyerRequestPublic,
} from "@/lib/buyer-request";

export const dynamic = "force-dynamic";

const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;

function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const entries = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  entries.push(now);
  HITS.set(ip, entries);
  return entries.length > MAX_PER_WINDOW;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("limit") || "24", 10)));
    const county = (searchParams.get("county") || "").trim();

    const now = new Date();
    const rows = await db.buyerRequest.findMany({
      where: {
        status: "OPEN",
        expiresAt: { gt: now },
        ...(county ? { county } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      requests: rows.map(serializeBuyerRequestPublic),
    });
  } catch (err) {
    console.error("Buyer requests list error:", err);
    return NextResponse.json({ error: "Could not load requests." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ success: true, publicCode: "REQ-00000" });
    }

    const parsed = parseBuyerRequestPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const session = await getSessionFromRequest();
    const buyerUserId = session?.user?.role === "BUYER" ? session.user.id : null;

    let publicCode = generateBuyerRequestPublicCode();
    let created = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        created = await db.buyerRequest.create({
          data: {
            publicCode,
            userId: buyerUserId,
            expiresAt: buyerRequestExpiresAt(),
            ...parsed.data,
          },
        });
        break;
      } catch (err) {
        if (err?.code === "P2002" && attempt < 4) {
          publicCode = generateBuyerRequestPublicCode();
          continue;
        }
        throw err;
      }
    }

    if (!created) {
      return NextResponse.json({ error: "Could not save your request." }, { status: 500 });
    }

    try {
      const adminUsers = await db.user.findMany({
        where: { role: "ADMIN", active: true },
        select: { id: true },
      });
      if (adminUsers.length) {
        await db.notification.createMany({
          data: adminUsers.map((u) => ({
            userId: u.id,
            type: "BUYER_REQUEST_NEW",
            title: `New car request ${created.publicCode}`,
            message: `${created.make} ${created.model} · ${created.county} · up to KES ${created.budgetMax.toLocaleString()}`,
            link: "/admin/buyer-requests",
          })),
        });
      }
    } catch (notifyErr) {
      console.error("Buyer request notification error:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      publicCode: created.publicCode,
      request: serializeBuyerRequestPublic(created),
    });
  } catch (err) {
    console.error("Buyer request create error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
