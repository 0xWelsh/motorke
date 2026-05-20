/** @jest-environment node */

import { SEO_PRICE_BANDS } from "@/lib/seo-car-facets";
import { resolveGlobalCarHubSlug, listGlobalHubSitemapEntries } from "@/lib/seo-global-hubs";

describe("seo-global-hubs", () => {
  test("resolves suvs-under-3-million marketing slug", () => {
    const hub = resolveGlobalCarHubSlug("suvs-under-3-million");
    expect(hub).not.toBeNull();
    expect(hub.kind).toBe("global_body_price");
    expect(hub.path).toBe("/cars/suvs-under-3-million");
    expect(hub.bodyType).toBe("SUV");
  });

  test("resolves global price band slug", () => {
    const band = SEO_PRICE_BANDS.find((b) => b.slug === "2m-to-3m");
    expect(band).toBeDefined();
    const hub = resolveGlobalCarHubSlug(`price-${band.slug}`);
    expect(hub?.kind).toBe("global_price");
    expect(hub?.path).toBe(`/cars/price-${band.slug}`);
  });

  test("sitemap entries include global hubs", () => {
    const entries = listGlobalHubSitemapEntries();
    expect(entries.some((e) => e.path === "/cars/suvs-under-3-million")).toBe(true);
    expect(entries.some((e) => e.path.startsWith("/cars/price-"))).toBe(true);
  });
});
