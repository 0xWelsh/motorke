/**
 * Shared Leaflet divIcon pins — correct anchor at the map point (bottom of dot).
 */

export function escapeMapHtml(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {import("leaflet")} L
 * @param {{ label: string; sublabel?: string; verified?: boolean; badge?: string; compact?: boolean }} opts
 */
export function createDealerDivIcon(L, { label, sublabel, verified, badge, compact = false }) {
  const safeLabel = escapeMapHtml(label);
  const safeSub = sublabel ? escapeMapHtml(sublabel) : "";
  const check = verified ? '<span class="wmh-map-pin__check">✓</span>' : "";
  const badgeHtml = badge
    ? `<span class="wmh-map-pin__badge">${escapeMapHtml(badge)}</span>`
    : "";

  const labelChars = (label || "").length;
  const width = compact
    ? 48
    : Math.min(240, Math.max(72, labelChars * 6.5 + (badge ? 36 : 20) + 28));
  const labelBlock = sublabel ? 46 : compact ? 30 : 34;
  const stem = 10;
  const dot = 14;
  const height = labelBlock + stem + dot;

  const html = `
    <div class="wmh-map-pin" style="width:${width}px">
      <div class="wmh-map-pin__label${compact ? " wmh-map-pin__label--compact" : ""}">
        <span class="wmh-map-pin__text">${safeLabel}</span>${check}${badgeHtml}
      </div>
      ${safeSub ? `<div class="wmh-map-pin__sublabel">${safeSub}</div>` : ""}
      <div class="wmh-map-pin__stem" aria-hidden="true"></div>
      <div class="wmh-map-pin__dot" aria-hidden="true"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "wmh-map-pin-wrapper",
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 6],
  });
}

/** Pin for admin location picker (click to place). */
export function createPickerDivIcon(L) {
  const width = 32;
  const height = 42;
  const html = `
    <div class="wmh-map-pin wmh-map-pin--picker" style="width:${width}px">
      <div class="wmh-map-pin__dot wmh-map-pin__dot--picker" aria-hidden="true"></div>
      <div class="wmh-map-pin__stem wmh-map-pin__stem--picker" aria-hidden="true"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "wmh-map-pin-wrapper",
    iconSize: [width, height],
    iconAnchor: [width / 2, height - 2],
    popupAnchor: [0, -height],
  });
}
