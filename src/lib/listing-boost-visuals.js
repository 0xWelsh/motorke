/**
 * Shared border / ring styles for active listing boosts (Spotlight, Hot).
 * Keeps browse cards and detail gallery visually consistent.
 */

import { isActiveHotBadge } from "@/lib/hot-badge";
import { isActiveSpotlight } from "@/lib/spotlight";

/**
 * @param {{ spotlightUntil?: Date | string | null, hotBadgeUntil?: Date | string | null }} car
 * @param {{ spotlight?: boolean, prominent?: boolean }} [opts]
 *   — `spotlight`: force Spotlight styling; `prominent`: stronger homepage-row outline
 */
export function getListingBoostVisuals(car, opts = {}) {
  const prominent = Boolean(opts.prominent);
  const spotlight = Boolean(opts.spotlight ?? isActiveSpotlight(car));
  const hot = isActiveHotBadge(car);
  const active = spotlight || hot;

  if (spotlight && prominent) {
    return {
      spotlight: true,
      hot,
      active: true,
      cardBorderClass:
        "border-[3px] border-orange-500 dark:border-orange-400 shadow-[0_0_0_1px_rgba(249,115,22,0.55),0_8px_28px_-10px_rgba(220,38,38,0.5)]",
      imageFrameClass:
        "ring-[3px] ring-inset ring-orange-500/95 shadow-[inset_0_0_0_2px_rgba(220,38,38,0.42)]",
      galleryShellClass:
        "border-[3px] border-orange-500 dark:border-orange-400 shadow-[0_0_0_1px_rgba(249,115,22,0.4)]",
      galleryHeroClass:
        "ring-[3px] ring-inset ring-orange-500/95 shadow-[inset_0_0_0_2px_rgba(220,38,38,0.42)]",
    };
  }

  if (!active) {
    return {
      spotlight: false,
      hot: false,
      active: false,
      cardBorderClass: "border-slate-100 dark:border-zinc-900",
      imageFrameClass: "",
      galleryShellClass: "",
      galleryHeroClass: "",
    };
  }

  if (spotlight && hot) {
    return {
      spotlight: true,
      hot: true,
      active: true,
      cardBorderClass:
        "border-red-600 dark:border-red-500 shadow-[0_0_0_1px_rgba(220,38,38,0.35)]",
      imageFrameClass:
        "ring-2 ring-inset ring-red-500/90 shadow-[inset_0_0_0_3px_rgba(249,115,22,0.45)]",
      galleryShellClass:
        "border-2 border-red-600 dark:border-red-500 shadow-[0_0_0_1px_rgba(220,38,38,0.25)]",
      galleryHeroClass:
        "ring-2 ring-inset ring-red-500/90 shadow-[inset_0_0_0_3px_rgba(249,115,22,0.45)]",
    };
  }

  if (spotlight) {
    return {
      spotlight: true,
      hot: false,
      active: true,
      cardBorderClass:
        "border-red-600 dark:border-red-500 shadow-[0_0_0_1px_rgba(220,38,38,0.3)]",
      imageFrameClass: "ring-2 ring-inset ring-red-500/90",
      galleryShellClass: "border-2 border-red-600 dark:border-red-500",
      galleryHeroClass: "ring-2 ring-inset ring-red-500/90",
    };
  }

  return {
    spotlight: false,
    hot: true,
    active: true,
    cardBorderClass:
      "border-orange-500 dark:border-orange-400 shadow-[0_0_0_1px_rgba(249,115,22,0.28)]",
    imageFrameClass: "ring-2 ring-inset ring-orange-500/90",
    galleryShellClass: "border-2 border-orange-500 dark:border-orange-400",
    galleryHeroClass: "ring-2 ring-inset ring-orange-500/90",
  };
}
