import clusters from "../../data/seo/keyword-clusters.json";
import dutyClusters from "../../data/seo/duty-clusters.json";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { resolveDutyPathForCar } from "@/lib/seo-duty";

/**
 * Related internal links for a listing or hub (keyword cluster mapping).
 * @param {{ make?: string; model?: string; bodyType?: string; price?: number; dutyPaid?: boolean; year?: number; trim?: string }} ctx
 */
export function getRelatedSeoLinks(ctx = {}, { take = 5 } = {}) {
  const make = slugifyCarSegment(ctx.make);
  const model = slugifyCarSegment(ctx.model);
  const out = [];
  const seen = new Set();

  const pushLink = (href, label, score, guidePath = null) => {
    if (!href || seen.has(href)) return;
    seen.add(href);
    out.push({ href, label, score, guidePath });
  };

  for (const cluster of clusters) {
    const hub = cluster.hubPath;
    if (!hub) continue;

    let score = 0;
    const hubParts = hub.replace(/^\/cars\//, "").split("/").filter(Boolean);

    if (hub === "/duty") score = 1;
    if (hubParts[0] === make) score += 3;
    if (hubParts[1] && hubParts[1] === model) score += 5;
    if (hub.includes("suv") && ctx.bodyType === "SUV") score += 2;
    if (hub.includes("under-3-million") && ctx.price != null && ctx.price < 3_000_000) score += 2;

    if (score > 0) {
      pushLink(hub, cluster.keywords[0] || hub, score, cluster.guidePath || null);
    }
  }

  for (const cluster of dutyClusters) {
    const hub = cluster.dutyPath;
    if (!hub) continue;

    const cMake = slugifyCarSegment(cluster.make);
    const cModel = slugifyCarSegment(cluster.model);
    let score = 0;
    if (cMake === make) score += 3;
    if (cModel && model && cModel === model) score += 6;

    if (score > 0) {
      pushLink(hub, cluster.keywords[0] || hub, score, null);
    }
  }

  const dutyPath = resolveDutyPathForCar(ctx);
  const dutyScore = ctx.dutyPaid === false ? 9 : make ? 4 : 2;
  pushLink(dutyPath, "Import duty estimate", dutyScore, null);

  if (make && model) {
    const own = `/cars/${make}/${model}`;
    pushLink(own, `${ctx.make} ${ctx.model} listings`, 10, null);
  }

  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map(({ href, label, guidePath }) => ({ href, label, guidePath }));
}

export function listKeywordClusters() {
  return clusters;
}
