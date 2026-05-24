/** @jest-environment node */

import { saveDataGalleryLimits, isSaveDataRequest } from "@/lib/save-data";

describe("save-data", () => {
  test("detects Save-Data header", () => {
    const headers = new Headers({ "save-data": "on" });
    expect(isSaveDataRequest(headers)).toBe(true);
  });

  test("limits gallery on save-data mode", () => {
    const limits = saveDataGalleryLimits(true, 12);
    expect(limits.preloadAdjacent).toBe(false);
    expect(limits.maxThumbs).toBe(4);
    expect(limits.mosaicMode).toBe(false);
  });

  test("full gallery when not save-data", () => {
    const limits = saveDataGalleryLimits(false, 12);
    expect(limits.preloadAdjacent).toBe(true);
    expect(limits.maxThumbs).toBe(12);
    expect(limits.lightboxAutoplay).toBe(true);
    // Slideshow + thumbs on all viewports (mosaic grid retired)
    expect(limits.mosaicMode).toBe(false);
  });
});
