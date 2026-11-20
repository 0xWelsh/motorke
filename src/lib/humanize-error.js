// src/lib/humanize-error.js
// Turns raw API/Prisma/network errors into buyer-and-admin-friendly
// sentences. Pass through anything that already reads like a human
// message; never leak stack traces, SQL, or connection strings.

const LOOKS_TECHNICAL = /prisma|\bP2\d{3}\b|at async|at Object|\{.*:.*\}|<|ECONNREFUSED|ENOTFOUND|does not exist|constraint|violates|syntax error|unexpected token|Internal Server Error|Minified React/;

export function humanizeError(err, fallback = "Something went wrong. Try again — if it keeps happening, we've logged it.") {
  const msg = typeof err === "string" ? err : String(err?.message || err || "");
  if (!msg) return fallback;

  // Prisma error codes (often present alongside the raw message)
  const code = err?.code || (msg.match(/P2\d{3}/) || [])[0];
  if (code === "P2002" || /Unique constraint failed/i.test(msg))
    return "That value already exists — something else is using it (check for a duplicate slug, email, or VIN).";
  if (code === "P2003" || /foreign key constraint/i.test(msg))
    return "This record is still linked to other data, so it can't be deleted yet.";
  if (code === "P2025" || /No record found|not found.*update|not found.*delete/i.test(msg))
    return "We couldn't find that record — it may have been deleted in another tab.";
  if (code === "P2024" || /pool timeout|too many connections/i.test(msg))
    return "The database is busy. Give it a few seconds and retry.";
  if (code === "P2010" || /Raw query failed/i.test(msg) || /does not exist.*column|column .* does not exist/i.test(msg))
    return "A database schema problem occurred. It's been logged — the engineering view is the fastest route to fix it.";
  if (/Can't reach database|ECONNREFUSED|ENOTFOUND|connection terminated|closed the connection/i.test(msg))
    return "We couldn't reach the database. It may be waking up — try again in a few seconds.";

  // Network / upload
  if (/Failed to fetch|NetworkError|Network request failed/i.test(msg) || msg === "Network error.")
    return "Network hiccup — check your connection and retry.";
  if (/too large|file size|MAX_SIZE|413/i.test(msg))
    return "That file is too large. Try a smaller image (under ~8MB).";
  if (/unsupported|invalid image|mime/i.test(msg))
    return "That file doesn't look like a supported image (JPG, PNG, WebP).";

  // Auth
  if (/unauthori[sz]ed|not signed in|401/i.test(msg))
    return "Your session expired — sign in again and retry.";
  if (/forbidden|403|admin only/i.test(msg))
    return "You don't have permission to do that.";

  // Already human? pass through short, clean sentences.
  if (msg.length <= 140 && !LOOKS_TECHNICAL.test(msg) && /^[A-Za-z]/.test(msg))
    return msg;

  return fallback;
}

// For API responses: prefer a server-provided human message, else map raw.
export function humanizeApiError(dataOrMessage, fallback) {
  const raw = typeof dataOrMessage === "string" ? dataOrMessage : dataOrMessage?.error;
  return humanizeError(raw, fallback);
}
