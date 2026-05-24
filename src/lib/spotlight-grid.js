/**
 * Balanced grid layouts for the homepage Spotlight row (1–8 cards).
 * @param {number} count
 */
export function getSpotlightGridLayout(count) {
  const n = Math.max(0, Math.min(8, Number(count) || 0));

  const baseGap = "gap-2 sm:gap-3";

  if (n === 0) {
    return { gridClass: "hidden", getItemClass: () => "" };
  }

  if (n === 1) {
    return {
      gridClass: `grid grid-cols-1 ${baseGap} max-w-[18rem] mx-auto w-full`,
      getItemClass: () => "",
    };
  }

  if (n === 2) {
    return {
      gridClass: `grid grid-cols-2 ${baseGap} max-w-2xl mx-auto w-full`,
      getItemClass: () => "",
    };
  }

  if (n === 3) {
    return {
      gridClass: `grid grid-cols-1 sm:grid-cols-3 ${baseGap} max-w-4xl mx-auto w-full`,
      getItemClass: () => "",
    };
  }

  if (n === 4) {
    return {
      gridClass: `grid grid-cols-2 lg:grid-cols-4 ${baseGap} max-w-5xl mx-auto w-full`,
      getItemClass: () => "",
    };
  }

  if (n === 5) {
    return {
      gridClass: `grid grid-cols-2 sm:grid-cols-6 ${baseGap} max-w-5xl mx-auto w-full`,
      getItemClass: (index) => {
        if (index < 3) return "sm:col-span-2";
        if (index === 3) return "sm:col-span-2 sm:col-start-2";
        return "sm:col-span-2 sm:col-start-4";
      },
    };
  }

  if (n === 6) {
    return {
      gridClass: `grid grid-cols-2 md:grid-cols-3 ${baseGap} max-w-5xl mx-auto w-full`,
      getItemClass: () => "",
    };
  }

  if (n === 7) {
    return {
      gridClass: `grid grid-cols-2 lg:grid-cols-12 ${baseGap} max-w-6xl mx-auto w-full`,
      getItemClass: (index) => {
        if (index < 4) return "lg:col-span-3";
        if (index === 6) {
          return "col-span-2 max-w-[calc(50%-0.375rem)] justify-self-center w-full lg:col-span-3 lg:col-start-8 lg:max-w-none lg:justify-self-stretch";
        }
        const offsets = ["lg:col-start-2", "lg:col-start-5"];
        return `lg:col-span-3 ${offsets[index - 4] || ""}`;
      },
    };
  }

  return {
    gridClass: `grid grid-cols-2 lg:grid-cols-4 ${baseGap} max-w-6xl mx-auto w-full`,
    getItemClass: () => "",
  };
}
