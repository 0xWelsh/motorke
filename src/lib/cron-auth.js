/**
 * Authorise cron endpoints: Vercel scheduled runs, manual ?secret=, or Bearer token.
 */
export function isCronAuthorised(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  if (request.headers.get("x-vercel-cron") === "1") return true;

  let querySecret = null;
  try {
    querySecret = new URL(request.url).searchParams.get("secret");
  } catch {
    /* ignore */
  }
  if (querySecret && secret.length === querySecret.length) {
    const buf1 = Buffer.from(secret);
    const buf2 = Buffer.from(querySecret);
    if (buf1.length === buf2.length && crypto.timingSafeEqual(buf1, buf2)) return true;
  }

  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ") && auth.length === secret.length + 7) {
    const token = auth.slice(7);
    if (token.length === secret.length) {
      const buf1 = Buffer.from(secret);
      const buf2 = Buffer.from(token);
      if (buf1.length === buf2.length && crypto.timingSafeEqual(buf1, buf2)) return true;
    }
  }

  return false;
}
