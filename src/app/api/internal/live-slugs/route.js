import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

/**
 * Compact "what is live right now" set for the middleware's dead-slug 308.
 * Small by design: slugs + distinct make slugs, ~tens of KB at full catalog.
 */
const getLiveSet = unstable_cache(
  async () => {
    const [cars, makes] = await Promise.all([
      db.car.findMany({ where: { publicSlug: { not: null } }, select: { publicSlug: true } }),
      db.car.groupBy({ by: ["make"], select: { make: true } }),
    ]);
    return {
      slugs: cars.map((c) => c.publicSlug),
      makes: [...new Set(makes.map((m) => slugifyCarSegment(m.make)).filter(Boolean))],
    };
  },
  ["live-slug-set"],
  { revalidate: 10, tags: ["cars", "homepage"] },
);

export async function GET() {
  const data = await getLiveSet();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=10" },
  });
}
