import { requestGoogleUrlIndexing } from "@/lib/google-indexing";
import { buildDutyVehicleSlug } from "@/lib/duty-vehicle-slug";

/**
 * Fire-and-forget indexing pings after CRSP catalog changes.
 * @param {Array<{ make: string; model: string; year?: number; trim?: string }>} rows
 */
export function notifyDutyCatalogUpdated(rows = []) {
  queueMicrotask(() => {
    requestGoogleUrlIndexing("/duty").catch(() => {});

    const seen = new Set(["/duty"]);
    for (const row of rows.slice(0, 40)) {
      const slug = buildDutyVehicleSlug(row);
      if (!slug) continue;
      const path = `/duty/${slug}`;
      if (seen.has(path)) continue;
      seen.add(path);
      requestGoogleUrlIndexing(path).catch(() => {});
    }
  });
}
