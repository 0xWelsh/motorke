import { db } from "@/lib/db";
import { fetchGscPerformance } from "@/lib/google-search-console";

/** Pull GSC search analytics and persist latest sync. */
export async function syncGscToDatabase({ days = 28 } = {}) {
  const fetched = await fetchGscPerformance({ days });
  if (fetched.skipped) return fetched;

  if (!fetched.ok || !fetched.rows?.length) {
    return { ok: false, error: fetched.error || "no_rows" };
  }

  try {
    const sync = await db.seoGscSync.create({
      data: {
        siteUrl: fetched.siteUrl,
        startDate: fetched.startDate,
        endDate: fetched.endDate,
        rows: {
          create: fetched.rows.map((row) => ({
            dimension: row.dimension,
            key: row.key.slice(0, 500),
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          })),
        },
      },
      include: { rows: true },
    });

    const old = await db.seoGscSync.findMany({
      orderBy: { syncedAt: "desc" },
      skip: 5,
      select: { id: true },
    });
    if (old.length) {
      await db.seoGscSync.deleteMany({ where: { id: { in: old.map((s) => s.id) } } });
    }

    return { ok: true, syncId: sync.id, rowCount: sync.rows.length };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function getLatestGscSync() {
  try {
    return await db.seoGscSync.findFirst({
      orderBy: { syncedAt: "desc" },
      include: {
        rows: {
          orderBy: [{ clicks: "desc" }],
        },
      },
    });
  } catch {
    return null;
  }
}
