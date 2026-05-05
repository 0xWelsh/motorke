export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

const NAME_RE = /^[a-z0-9_:-]{2,64}$/i;

function sanitizePayload(input) {
  if (!input || typeof input !== "object") return null;
  const safe = {};
  for (const [key, value] of Object.entries(input)) {
    if (!/^[a-z0-9_:-]{1,40}$/i.test(key)) continue;
    if (typeof value === "string") safe[key] = value.slice(0, 180);
    else if (typeof value === "number" || typeof value === "boolean") safe[key] = value;
  }
  return Object.keys(safe).length ? safe : null;
}

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }

    const body = await request.json().catch(() => null);
    const name = (body?.name || "").toString().trim();
    if (!NAME_RE.test(name)) {
      return NextResponse.json({ error: "Invalid event name" }, { status: 400 });
    }

    const source = (body?.source || "web").toString().slice(0, 32);
    const path = typeof body?.path === "string" ? body.path.slice(0, 256) : null;
    const payload = sanitizePayload(body?.payload);
    const session = await getSessionFromRequest();

    await db.marketingEvent.create({
      data: {
        name,
        source,
        path,
        payload,
        userId: session?.user?.id || null,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    // Keep this endpoint non-disruptive; callers should not surface this to end users.
    console.error("Track API error:", error);
    return NextResponse.json({ ok: false }, { status: 202 });
  }
}
