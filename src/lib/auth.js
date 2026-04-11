// src/lib/auth.js
// Simple session-based auth — no heavy dependencies
// Uses Node's built-in crypto for password hashing

import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "crypto";

const SESSION_COOKIE = "motorke_session";
const SESSION_DAYS   = 30;

import bcrypt from "bcrypt";

function isDynamicServerUsageError(error) {
  return (
    error?.digest === "DYNAMIC_SERVER_USAGE" ||
    (typeof error?.message === "string" && error.message.includes("Dynamic server usage"))
  );
}

// ── Password hashing ─────────────────────────────────────────
export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, stored) {
  // Backwards compatibility for early test accounts
  if (stored.includes(":")) {
    const [salt, hash] = stored.split(":");
    const attempt = crypto
      .pbkdf2Sync(password, salt, 100_000, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(hash,    "hex"),
      Buffer.from(attempt, "hex")
    );
  }
  return await bcrypt.compare(password, stored);
}

// ── Session management ────────────────────────────────────────
export async function createSession(userId) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const session = await db.session.create({
    data: { userId, expiresAt },
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires:  expiresAt,
    path:     "/",
  });

  return session;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const session = await db.session.findUnique({
      where: { token },
      include: { user: { include: { dealer: true } } },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.session.delete({ where: { token } }).catch((error) => {
          console.error("Failed to clean up expired session:", error);
        });
      }
      return null;
    }

    // Defensive guard in case a legacy/invalid session row exists without user data.
    if (!session.user) return null;

    return session;
  } catch (error) {
    if (isDynamicServerUsageError(error)) throw error;
    console.error("Failed to read session:", error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch((error) => {
      console.error("Failed to destroy session token:", error);
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}

// ── Route guards ─────────────────────────────────────────────
/** Use in Server Components — redirects if not logged in */
export async function requireAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user;
}

/** Use in Server Components — redirects if not admin */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") redirect("/");
  return user;
}

/** Use in Server Components — redirects if not dealer */
export async function requireDealer() {
  const user = await requireAuth();
  if (user.role !== "DEALER") redirect("/");
  return user;
}

// ── API route guard ───────────────────────────────────────────
export async function getSessionFromRequest() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await db.session.findUnique({
      where: { token },
      include: { user: { include: { dealer: true } } },
    });
  } catch (error) {
    if (isDynamicServerUsageError(error)) throw error;
    console.error("Failed to read session from request:", error);
    return null;
  }
}
