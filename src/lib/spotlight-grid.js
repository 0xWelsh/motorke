/**
 * Balanced grid layouts for the homepage Spotlight row (1–8 cards).
 * Mobile: centered symmetric layouts. Desktop (lg+): full-width 4-col like Trending.
 * @param {number} count
 */
export function getSpotlightGridLayout(count) {
  const n = Math.max(0, Math.min(8, Number(count) || 0));

  const desktop =
    "lg:grid-cols-4 lg:gap-6 lg:max-w-none lg:mx-0";
  const mobileGap = "gap-2.5 sm:gap-4";
  const base = `grid grid-cols-2 ${mobileGap} ${desktop} w-full`;

  if (n === 0) {
    return { gridClass: "hidden", getItemClass: () => "" };
  }

  if (n === 1) {
    return {
      gridClass: `grid grid-cols-1 ${mobileGap} max-w-[18rem] mx-auto w-full ${desktop}`,
      getItemClass: () => "lg:col-start-2",
    };
  }

  if (n === 2) {
    return {
      gridClass: `grid grid-cols-2 ${mobileGap} max-w-2xl mx-auto w-full ${desktop}`,
      getItemClass: (index) => (index === 0 ? "lg:col-start-1" : "lg:col-start-3"),
    };
  }

  if (n === 3) {
    return {
      gridClass: `grid grid-cols-1 sm:grid-cols-3 ${mobileGap} max-w-4xl mx-auto w-full sm:max-w-none sm:mx-0 ${desktop}`,
      getItemClass: () => "",
    };
  }

  if (n === 4) {
    return {
      gridClass: base,
      getItemClass: () => "",
    };
  }

  if (n === 5) {
    return {
      gridClass: `grid grid-cols-2 sm:grid-cols-6 ${mobileGap} max-w-5xl mx-auto w-full sm:max-w-none sm:mx-0 ${desktop}`,
      getItemClass: (index) => {
        if (index < 3) return "sm:col-span-2 lg:col-span-1 lg:col-start-auto";
        if (index === 3) return "sm:col-span-2 sm:col-start-2 lg:col-span-1 lg:col-start-auto";
        return "sm:col-span-2 sm:col-start-4 lg:col-span-1 lg:col-start-2";
      },
    };
  }

  if (n === 6) {
    return {
      gridClass: `grid grid-cols-2 md:grid-cols-3 ${mobileGap} max-w-5xl mx-auto w-full md:max-w-none md:mx-0 ${desktop}`,
      getItemClass: (index) => {
        if (index < 4) return "lg:col-span-1";
        if (index === 4) return "lg:col-span-1 lg:col-start-2";
        return "lg:col-span-1 lg:col-start-3";
      },
    };
  }

  if (n === 7) {
    return {
      gridClass: base,
      getItemClass: (index) => {
        if (index < 4) return "";
        if (index === 4) return "lg:col-start-2";
        if (index === 5) return "lg:col-start-3";
        return "lg:col-start-4";
      },
    };
  }

  return {
    gridClass: base,
    getItemClass: () => "",
  };
}
