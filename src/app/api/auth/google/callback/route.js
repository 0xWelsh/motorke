import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import {
  exchangeGoogleCode,
  verifyGoogleToken,
  upsertGoogleUser,
  destinationForRole,
  maybeWelcomeEmail,
  isGoogleOAuthConfigured,
} from "@/lib/google-auth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "wmh_oauth_state";
const NEXT_COOKIE = "wmh_oauth_next";

function clearOauthCookies(res) {
  res.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

function loginErrorRedirect(origin, error) {
  return clearOauthCookies(
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, origin))
  );
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    // User dismissed the consent screen, etc.
    return loginErrorRedirect(url.origin, "oauth_cancelled");
  }

  if (!isGoogleOAuthConfigured() || !code || !stateParam) {
    return loginErrorRedirect(url.origin, "oauth_invalid");
  }

  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  const next = request.cookies.get(NEXT_COOKIE)?.value || null;

  if (!cookieState || cookieState !== stateParam) {
    return loginErrorRedirect(url.origin, "oauth_state");
  }

  let tokens;
  try {
    tokens = await exchangeGoogleCode(code);
  } catch (err) {
    console.error("Google code exchange failed:", err);
    return loginErrorRedirect(url.origin, "oauth_exchange");
  }
  if (!tokens?.id_token) {
    return loginErrorRedirect(url.origin, "oauth_exchange");
  }

  const payload = await verifyGoogleToken(tokens.id_token);
  if (!payload?.email) {
    return loginErrorRedirect(url.origin, "oauth_verify");
  }

  let result;
  try {
    result = await upsertGoogleUser({
      email: payload.email,
      name: payload.name,
      googleId: payload.sub,
      avatarUrl: payload.picture,
    });
  } catch (err) {
    console.error("Google upsert user failed:", err);
    return loginErrorRedirect(url.origin, "oauth_user");
  }

  if (!result.user.active) {
    return loginErrorRedirect(url.origin, "inactive");
  }

  await createSession(result.user.id);
  void maybeWelcomeEmail(result);

  const fallback = destinationForRole(result.user.role);
  const dest = next || fallback;

  return clearOauthCookies(NextResponse.redirect(new URL(dest, url.origin)));
}
