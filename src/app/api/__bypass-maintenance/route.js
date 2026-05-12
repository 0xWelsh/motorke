// src/app/api/__bypass-maintenance/route.js
// One-shot endpoint to obtain a cookie that bypasses maintenance mode.
// Usage:  /api/__bypass-maintenance?token=<MAINTENANCE_BYPASS_TOKEN>&next=/
// Sets `welsh-maint-bypass=1` for 8 hours, then 302s to ?next or "/".

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COOKIE = "welsh-maint-bypass";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const expected = process.env.MAINTENANCE_BYPASS_TOKEN || "";
  const nextPath = url.searchParams.get("next") || "/";

  if (!expected || token !== expected) {
    return NextResponse.json(
      { error: "Invalid bypass token" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/";

  const res = NextResponse.redirect(new URL(safeNext, url.origin));
  res.cookies.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return res;
}
