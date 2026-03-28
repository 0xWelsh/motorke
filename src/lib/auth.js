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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where:   { token },
    include: { user: { include: { dealer: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { token } });
    return null;
  }

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } }).catch(() => {});
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
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return db.session.findUnique({
    where:   { token },
    include: { user: { include: { dealer: true } } },
  });
}
