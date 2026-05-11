import { NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  buildGoogleAuthUrl,
  isGoogleOAuthConfigured,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "wmh_oauth_state";
const NEXT_COOKIE = "wmh_oauth_next";

/**
 * Restrict the post-auth redirect to internal absolute paths to prevent
 * open-redirect abuse via ?next= manipulation.
 */
function sanitizeNext(raw) {
  if (!raw || typeof raw !== "string") return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  return raw.slice(0, 500);
}

export async function GET(request) {
  const url = new URL(request.url);

  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_unavailable", url.origin)
    );
  }

  const next = sanitizeNext(url.searchParams.get("next"));
  const mode = url.searchParams.get("mode") === "signup" ? "signup" : "signin";

  const state = crypto.randomBytes(24).toString("hex");
  const nonce = crypto.randomBytes(16).toString("hex");

  const authUrl = buildGoogleAuthUrl({ state, nonce, mode });
  if (!authUrl) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_unavailable", url.origin)
    );
  }

  const res = NextResponse.redirect(authUrl);
  const isProd = process.env.NODE_ENV === "production";
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 600,
  });
  if (next) {
    res.cookies.set(NEXT_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 600,
    });
  }
  return res;
}
