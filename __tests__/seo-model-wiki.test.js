/** @jest-environment node */

import {
  buildListingTailoredWiki,
  getModelWikiContent,
  guideMatchesListingBody,
  modelHubPath,
  wikiBodyFamily,
} from "@/lib/seo-model-wiki";

describe("seo-model-wiki", () => {
  test("returns curated copy for known SUV models when listing is SUV", () => {
    const wiki = getModelWikiContent({
      make: "Toyota",
      model: "Harrier",
      year: 2019,
      fuelType: "HYBRID",
      engineCC: 2500,
      bodyType: "SUV",
    });
    expect(wiki.source).toBe("curated");
    expect(wiki.headline).toContain("2019");
    expect(wiki.headline).toContain("SUV");
    expect(wiki.paragraphs[0]).toContain("listed as a");
    expect(wiki.paragraphs[0]).not.toMatch(/\bsedan\b/i);
    expect(wiki.paragraphs.length).toBeGreaterThan(2);
  });

  test("does not apply SUV curated guide to a sedan-bodied listing", () => {
    const wiki = getModelWikiContent({
      make: "Toyota",
      model: "Harrier",
      year: 2019,
      fuelType: "PETROL",
      engineCC: 2000,
      bodyType: "SEDAN",
    });
    expect(wiki.source).toBe("listing");
    expect(wiki.paragraphs[0]).toContain("sedan");
    expect(guideMatchesListingBody(
      { make: "Toyota", model: "Harrier", bodyType: "SEDAN" },
      {
        headline: "Toyota Harrier in Kenya",
        paragraphs: ["Harrier is a premium SUV footprint without Prado size."],
      }
    )).toBe(false);
  });

  test("E-Class curated copy matches sedan listings", () => {
    const wiki = getModelWikiContent({
      make: "Mercedes-Benz",
      model: "E-Class",
      year: 2018,
      fuelType: "DIESEL",
      engineCC: 2200,
      bodyType: "SEDAN",
    });
    expect(wiki.source).toBe("curated");
    expect(wiki.paragraphs[0]).toContain("sedan");
  });

  test("generates listing-tailored copy for unknown models", () => {
    const wiki = buildListingTailoredWiki({
      make: "Proton",
      model: "Saga",
      year: 2018,
      fuelType: "PETROL",
      engineCC: 1500,
      bodyType: "SEDAN",
    });
    expect(wiki.source).toBe("listing");
    expect(wiki.paragraphs[0]).toContain("Proton Saga");
    expect(wiki.paragraphs[0]).toContain("sedan");
  });

  test("wikiBodyFamily maps body types", () => {
    expect(wikiBodyFamily("SUV")).toBe("suv");
    expect(wikiBodyFamily("SEDAN")).toBe("sedan");
    expect(wikiBodyFamily("HATCHBACK")).toBe("hatch");
  });

  test("modelHubPath builds make/model URL", () => {
    expect(modelHubPath("Mazda", "CX-5")).toBe("/cars/mazda/cx-5");
  });
});
