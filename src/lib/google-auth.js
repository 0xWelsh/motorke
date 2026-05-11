// src/lib/google-auth.js
// Server-side Google OAuth helpers + user upsert shared between the
// ID-token POST route (programmatic / GIS) and the server redirect flow
// (start + callback routes used by the clean custom button).

import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/mail";
import { getSiteOrigin } from "@/lib/site-url";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const client = googleClientId ? new OAuth2Client(googleClientId) : null;

export function isGoogleOAuthConfigured() {
  return Boolean(googleClientId && googleClientSecret);
}

export function googleRedirectUri() {
  return `${getSiteOrigin()}/api/auth/google/callback`;
}

/**
 * Build the Google authorize URL for the server redirect flow.
 */
export function buildGoogleAuthUrl({ state, nonce, mode, loginHint } = {}) {
  if (!googleClientId) return null;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", googleClientId);
  url.searchParams.set("redirect_uri", googleRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  // Always show account chooser so users can switch accounts.
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("include_granted_scopes", "true");
  if (state) url.searchParams.set("state", state);
  if (nonce) url.searchParams.set("nonce", nonce);
  if (loginHint) url.searchParams.set("login_hint", loginHint);
  if (mode === "signup") {
    // No special Google param exists; the value is echoed back via state
    // and used purely to tailor our own copy in the UI.
  }
  return url.toString();
}

/**
 * Exchange an authorization code for tokens.
 * @param {string} code
 * @returns {Promise<{access_token: string, id_token: string, expires_in: number, scope: string, token_type: string}|null>}
 */
export async function exchangeGoogleCode(code) {
  if (!googleClientId || !googleClientSecret) return null;
  const params = new URLSearchParams();
  params.set("code", code);
  params.set("client_id", googleClientId);
  params.set("client_secret", googleClientSecret);
  params.set("redirect_uri", googleRedirectUri());
  params.set("grant_type", "authorization_code");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Google token exchange failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * Verifies a Google ID token and returns the user payload.
 * @param {string} token - The ID token from the frontend or callback exchange.
 * @returns {Promise<Object|null>}
 */
export async function verifyGoogleToken(token) {
  try {
    if (!client || !googleClientId) return null;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error("Google token verification failed:", error);
    return null;
  }
}

/**
 * Find existing user by email or googleId, or create a new BUYER.
 * Links googleId / avatar / email-verified to the existing record when missing.
 *
 * @returns {Promise<{ user: any, isNew: boolean }>}
 */
export async function upsertGoogleUser({ email, name, googleId, avatarUrl }) {
  if (!email) throw new Error("Google profile is missing email");

  let user = await db.user.findFirst({
    where: googleId ? { OR: [{ email }, { googleId }] } : { email },
  });

  let isNew = false;

  if (user) {
    const updates = {};
    if (!user.googleId && googleId) updates.googleId = googleId;
    if (!user.avatarUrl && avatarUrl) updates.avatarUrl = avatarUrl;
    if (!user.emailVerified) updates.emailVerified = new Date();
    if (!user.name && name) updates.name = name;
    if (Object.keys(updates).length > 0) {
      user = await db.user.update({ where: { id: user.id }, data: updates });
    }
  } else {
    isNew = true;
    user = await db.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        googleId: googleId || null,
        avatarUrl: avatarUrl || null,
        emailVerified: new Date(),
        active: true,
        role: "BUYER",
      },
    });
  }

  return { user, isNew };
}

export function destinationForRole(role) {
  if (role === "ADMIN") return "/admin";
  if (role === "DEALER") return "/portal";
  return "/";
}

/**
 * Fire-and-forget welcome email for new Google signups.
 */
export async function maybeWelcomeEmail({ user, isNew }) {
  if (!isNew || !user?.email) return;
  try {
    await sendWelcomeEmail({
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Welcome email:", err);
  }
}
