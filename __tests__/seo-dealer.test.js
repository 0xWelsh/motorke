/** @jest-environment node */

import {
  buildCarListingDealerMetadata,
  buildDealerMetadata,
  buildDealerSearchPhrases,
  buildDealerSeoParagraph,
  buildListingSellerSchema,
  dealerShowroomPath,
} from "@/lib/seo-dealer";

describe("seo-dealer", () => {
  const dealer = {
    name: "AutoMax Motors",
    slug: "automax-motors",
    location: "Kiambu Road",
    county: "Nairobi",
    verified: true,
  };

  test("buildDealerMetadata leads with dealer name for branded search", () => {
    const meta = buildDealerMetadata(dealer, { stockCount: 12 });
    expect(meta.title).toMatch(/^AutoMax Motors Kenya/);
    expect(meta.title).toContain("12 cars");
    expect(meta.description).toContain("AutoMax Motors");
    expect(meta.keywords).toContain("AutoMax Motors Kenya");
    expect(meta.alternates.canonical).toBe("/dealers/automax-motors");
  });

  test("buildDealerSeoParagraph includes dealer name and search hint", () => {
    const text = buildDealerSeoParagraph(dealer, { stockCount: 5, topMakes: ["Toyota", "Mazda"] });
    expect(text).toContain("AutoMax Motors");
    expect(text).toContain("Toyota");
    expect(text).toMatch(/Search "AutoMax Motors"/);
  });

  test("buildListingSellerSchema links to showroom URL", () => {
    const seller = buildListingSellerSchema(dealer);
    expect(seller.name).toBe("AutoMax Motors");
    expect(seller["@id"]).toContain("/dealers/automax-motors");
    expect(seller.url).toContain("/dealers/automax-motors");
  });

  test("buildCarListingDealerMetadata is price-forward with sale intent", () => {
    const car = {
      year: 2019,
      make: "Mazda",
      model: "CX-8",
      variant: "XDL",
      price: 4_200_000,
      fuelType: "DIESEL",
      engineCC: 2200,
      bodyType: "SUV",
      location: "Nairobi",
    };
    const meta = buildCarListingDealerMetadata(car, dealer);
    expect(meta.title).toContain("2019 Mazda CX-8");
    expect(meta.title).toMatch(/for Sale Kenya/);
    expect(meta.title).toMatch(/KSh/);
    expect(meta.description).toMatch(/^Buy a /);
    expect(meta.description).toContain("AutoMax Motors");
    expect(meta.h1).toMatch(/for Sale in/i);
  });

  test("dealerShowroomPath is stable", () => {
    expect(dealerShowroomPath("automax-motors")).toBe("/dealers/automax-motors");
  });

  test("buildDealerSearchPhrases dedupes variants", () => {
    const phrases = buildDealerSearchPhrases(dealer);
    expect(new Set(phrases).size).toBe(phrases.length);
    expect(phrases).toContain("AutoMax Motors cars for sale");
  });
});
