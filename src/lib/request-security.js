import { z } from "zod";

const emailSchema = z.string().email();

export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  const candidate = forwardedFor.split(",")[0]?.trim() || realIp.trim() || "unknown";
  return candidate.slice(0, 120);
}

export function normalizeEmail(value) {
  const safe = String(value || "").trim().toLowerCase();
  return emailSchema.safeParse(safe).success ? safe : null;
}

export function normalizeToken(value, maxLength = 256) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

export function json429(message, retryAfter) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
