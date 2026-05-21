/** @jest-environment node */

import {
  extractCoordsFromMapsUrl,
  inValidKenyaRange,
  resolveDealerCoordinates,
} from "@/lib/geocode";

describe("geocode", () => {
  test("extractCoordsFromMapsUrl parses @ lat,lng", () => {
    const c = extractCoordsFromMapsUrl(
      "https://www.google.com/maps/place/Test/@-1.2921,36.8219,15z",
    );
    expect(c).toEqual({ lat: -1.2921, lng: 36.8219 });
  });

  test("inValidKenyaRange accepts Nairobi", () => {
    expect(inValidKenyaRange(-1.2921, 36.8219)).toBe(true);
  });

  test("inValidKenyaRange rejects far-off coords", () => {
    expect(inValidKenyaRange(51.5, -0.12)).toBe(false);
  });

  test("resolveDealerCoordinates prefers manual pin", async () => {
    const c = await resolveDealerCoordinates({
      lat: "-1.30",
      lng: "36.82",
      address: "Kiambu Road",
      location: "Nairobi",
      county: "Nairobi",
    });
    expect(c.source).toBe("manual");
    expect(c.lat).toBeCloseTo(-1.3, 2);
  });
});
