/**
 * Retry transient Prisma / Postgres connection failures (common on serverless + pooler).
 */

const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1017", "P2024"]);

export function isTransientDbError(err) {
  if (!err) return false;
  if (TRANSIENT_CODES.has(err.code)) return true;
  const msg = String(err.message || err);
  return /can't reach database|connection timed out|ECONNREFUSED|ENOTFOUND|socket hang up|Connection terminated/i.test(
    msg
  );
}

export async function withDbRetry(fn, { retries = 2, baseDelayMs = 500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientDbError(err) || attempt >= retries) throw err;
      const delay = baseDelayMs * (attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastErr;
}

/** Run parallel tasks but keep fulfilled results when some fail (e.g. pooler blip). */
export async function settleNamed(tasks) {
  const entries = Object.entries(tasks);
  const results = await Promise.allSettled(entries.map(([, fn]) => fn()));
  const out = {};
  const failures = [];
  results.forEach((result, i) => {
    const key = entries[i][0];
    if (result.status === "fulfilled") {
      out[key] = result.value;
    } else {
      out[key] = [];
      failures.push({ key, reason: result.reason });
    }
  });
  return { data: out, failures };
}
