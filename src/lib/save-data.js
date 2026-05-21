/** Detect Save-Data / slow-network preference (Kenya mobile bundles). */

export const SAVE_DATA_COOKIE = "wmh-save-data";

export function isSaveDataRequest(headers) {
  if (!headers) return false;
  const saveData = headers.get("save-data");
  if (saveData === "on") return true;
  const cookie = headers.get("cookie") || "";
  if (cookie.includes(`${SAVE_DATA_COOKIE}=1`)) return true;
  return false;
}

export function saveDataImageProps(saveData) {
  if (!saveData) return {};
  return {
    loading: "lazy",
    fetchPriority: "low",
  };
}

/** Cap gallery thumbs preloaded on metered connections. */
export function saveDataGalleryLimits(saveData, imageCount) {
  if (!saveData) {
    return {
      maxThumbs: imageCount,
      preloadAdjacent: true,
      lightboxAutoplay: true,
      // Slideshow + thumb strip on all viewports; mosaic grid was desktop-only and confused buyers.
      mosaicMode: false,
    };
  }
  return {
    maxThumbs: Math.min(4, imageCount),
    preloadAdjacent: false,
    lightboxAutoplay: false,
    mosaicMode: false,
  };
}
