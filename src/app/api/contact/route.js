import { NextResponse } from "next/server";
import { sendContactFormEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

const ALLOWED_SUBJECTS = new Set(["bug", "partnership", "dealer", "general"]);

function isEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function clamp(s, max) {
  if (typeof s !== "string") return "";
  return s.trim().slice(0, max);
}

// In-memory per-IP throttle. Resets on cold start, which is fine for spam.
const HITS = new Map(); // ip -> [timestamps]
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const entries = (HITS.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  entries.push(now);
  HITS.set(ip, entries);
  return entries.length > MAX_PER_WINDOW;
}

export async function POST(request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Honeypot — bots fill hidden fields. If "website" is set, silently succeed.
    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json({ success: true });
    }

    const name = clamp(body.name, 200);
    const email = clamp(body.email, 200);
    const subject = clamp(body.subject, 40);
    const message = clamp(body.message, 5000);

    if (!name || !isEmail(email) || !ALLOWED_SUBJECTS.has(subject) || !message) {
      return NextResponse.json(
        { error: "Please fill in your name, a valid email, a subject, and a message." },
        { status: 400 }
      );
    }

    const result = await sendContactFormEmail({
      name,
      email,
      subject,
      message,
      meta: {
        ip,
        userAgent: request.headers.get("user-agent") || "",
        referer: request.headers.get("referer") || "",
      },
    });

    if (!result?.success) {
      return NextResponse.json(
        { error: "We could not send your message. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
