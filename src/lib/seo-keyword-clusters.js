import clusters from "../../data/seo/keyword-clusters.json";
import { slugifyCarSegment } from "@/lib/seo-car-slug";

/**
 * Related internal links for a listing or hub (keyword cluster mapping).
 * @param {{ make?: string; model?: string; bodyType?: string; price?: number }} ctx
 */
export function getRelatedSeoLinks(ctx = {}, { take = 5 } = {}) {
  const make = slugifyCarSegment(ctx.make);
  const model = slugifyCarSegment(ctx.model);
  const out = [];
  const seen = new Set();

  for (const cluster of clusters) {
    const hub = cluster.hubPath;
    if (!hub || seen.has(hub)) continue;

    let score = 0;
    const hubParts = hub.replace(/^\/cars\//, "").split("/").filter(Boolean);

    if (hubParts[0] === make) score += 3;
    if (hubParts[1] && hubParts[1] === model) score += 5;
    if (hub.includes("suv") && ctx.bodyType === "SUV") score += 2;
    if (hub.includes("under-3-million") && ctx.price != null && ctx.price < 3_000_000) score += 2;
    if (hub.startsWith("/showrooms")) score += 0;

    if (score > 0) {
      seen.add(hub);
      out.push({
        href: hub,
        label: cluster.keywords[0] || hub,
        score,
        guidePath: cluster.guidePath || null,
      });
    }
  }

  if (make && model) {
    const own = `/cars/${make}/${model}`;
    if (!seen.has(own)) {
      out.unshift({
        href: own,
        label: `${ctx.make} ${ctx.model} listings`,
        score: 10,
        guidePath: null,
      });
      seen.add(own);
    }
  }

  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map(({ href, label, guidePath }) => ({ href, label, guidePath }));
}

export function listKeywordClusters() {
  return clusters;
}
