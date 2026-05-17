import { db } from "@/lib/db";

const TRENDING_WINDOW_DAYS = 7;
const MIN_OCCURRENCES = 2;

export function normalizeSearchQuery(query) {
  return String(query || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/** Fire-and-forget search logging for trending queries. */
export async function logSearchQuery({ query, resultCount, sessionKey, userId }) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized || normalized.length < 2) return;

  try {
    await db.searchQueryLog.create({
      data: {
        query: String(query).trim().slice(0, 120),
        normalized,
        resultCount: resultCount ?? null,
        sessionKey: sessionKey || null,
        userId: userId || null,
      },
    });
  } catch {
    /* table may not exist until migrate */
  }
}

export async function getTrendingSearches({ limit = 12, days = TRENDING_WINDOW_DAYS } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const rows = await db.searchQueryLog.groupBy({
      by: ["normalized"],
      where: { createdAt: { gte: since } },
      _count: { normalized: true },
      orderBy: { _count: { normalized: "desc" } },
      take: limit * 3,
    });

    return rows
      .filter((r) => r._count.normalized >= MIN_OCCURRENCES)
      .slice(0, limit)
      .map((r) => ({
        query: r.normalized,
        count: r._count.normalized,
        href: `/cars?q=${encodeURIComponent(r.normalized)}`,
      }));
  } catch {
    return [];
  }
}
