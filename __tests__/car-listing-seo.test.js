/** @jest-environment node */

import {
  buildCarListingH1,
  buildCarListingTitle,
  buildCarListingDescription,
  buildCarImageAlt,
  buildCarListingDealerMetadata,
} from "@/lib/car-listing-seo";

const sampleCar = {
  year: 2019,
  make: "Mazda",
  model: "CX-8",
  variant: "XDL PACKAGE",
  price: 3_500_000,
  engineCC: 2200,
  fuelType: "DIESEL",
  bodyType: "SUV",
  location: "Nairobi",
};

const dealer = { name: "Test Motors", location: "Kiambu Road", county: "Nairobi" };

describe("car-listing-seo", () => {
  test("H1 includes year, specs, and sale intent", () => {
    const h1 = buildCarListingH1(sampleCar, dealer);
    expect(h1).toMatch(/2019 Mazda CX-8/);
    expect(h1).toMatch(/for Sale in/i);
    expect(h1).toMatch(/Diesel|2\.2L/i);
  });

  test("title is compact and price-forward", () => {
    const title = buildCarListingTitle(sampleCar);
    expect(title).toMatch(/2019 Mazda CX-8/);
    expect(title).toMatch(/for Sale Kenya/);
    expect(title).toMatch(/KSh/);
    expect(title.length).toBeLessThanOrEqual(65);
  });

  test("description is action-oriented and under 160 chars", () => {
    const desc = buildCarListingDescription(sampleCar, dealer);
    expect(desc).toMatch(/^Buy a /);
    expect(desc).toMatch(/Welsh Motorhub/);
    expect(desc.length).toBeLessThanOrEqual(160);
  });

  test("image alt is descriptive", () => {
    const alt = buildCarImageAlt(sampleCar, 2, { isPrimary: false });
    expect(alt).toMatch(/2019 Mazda CX-8/);
    expect(alt).toMatch(/photo 2/);
  });

  test("metadata bundle exposes h1", () => {
    const meta = buildCarListingDealerMetadata(sampleCar, dealer);
    expect(meta.h1).toBe(buildCarListingH1(sampleCar, dealer));
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
  });
});
