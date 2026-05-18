import { db } from "@/lib/db";
import { fetchGscDailySeries } from "@/lib/google-search-console";

export async function syncGscDailyMetrics({ days = 28 } = {}) {
  const fetched = await fetchGscDailySeries({ days });
  if (fetched.skipped) return fetched;
  if (!fetched.ok || !fetched.rows?.length) {
    return { ok: false, error: fetched.error || "no_rows" };
  }

  let upserted = 0;
  try {
    for (const row of fetched.rows) {
      const date = new Date(`${row.date}T00:00:00.000Z`);
      await db.seoGscDailyMetric.upsert({
        where: { date },
        create: {
          date,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        },
        update: {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          syncedAt: new Date(),
        },
      });
      upserted += 1;
    }

    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() - (days + 60));
    await db.seoGscDailyMetric.deleteMany({ where: { date: { lt: cutoff } } });

    return { ok: true, upserted };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function getGscDailySeries({ days = 28 } = {}) {
  try {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    return await db.seoGscDailyMetric.findMany({
      where: { date: { gte: since } },
      orderBy: { date: "asc" },
    });
  } catch {
    return [];
  }
}
