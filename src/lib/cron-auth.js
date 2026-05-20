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
  if (querySecret && querySecret === secret) return true;

  const auth = request.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;

  return false;
}
