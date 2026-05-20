/** @jest-environment node */

import { getModelWikiContent, modelHubPath } from "@/lib/seo-model-wiki";

describe("seo-model-wiki", () => {
  test("returns curated copy for known models", () => {
    const wiki = getModelWikiContent({
      make: "Toyota",
      model: "Harrier",
      year: 2019,
      fuelType: "HYBRID",
      engineCC: 2500,
      bodyType: "SUV",
    });
    expect(wiki.source).toBe("curated");
    expect(wiki.headline).toContain("Harrier");
    expect(wiki.paragraphs.length).toBeGreaterThan(2);
  });

  test("generates fallback copy for unknown models", () => {
    const wiki = getModelWikiContent({
      make: "Proton",
      model: "Saga",
      year: 2018,
      fuelType: "PETROL",
      engineCC: 1500,
      bodyType: "SEDAN",
    });
    expect(wiki.source).toBe("generated");
    expect(wiki.paragraphs[0]).toContain("Proton Saga");
  });

  test("modelHubPath builds make/model URL", () => {
    expect(modelHubPath("Mazda", "CX-5")).toBe("/cars/mazda/cx-5");
  });
});
