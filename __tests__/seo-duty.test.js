/** @jest-environment node */

import { resolveDutyPathForCar, buildDutyCalculatorJsonLd } from "@/lib/seo-duty";
import { getRelatedSeoLinks } from "@/lib/seo-keyword-clusters";

describe("seo-duty", () => {
  it("resolves model-specific duty path for Land Cruiser", () => {
    const path = resolveDutyPathForCar({ make: "Toyota", model: "Land Cruiser", year: 2018 });
    expect(path).toBe("/duty/toyota-land-cruiser-v8-2018");
  });

  it("falls back to duty hub when make unknown", () => {
    expect(resolveDutyPathForCar({})).toBe("/duty");
  });

  it("includes duty link in listing related searches", () => {
    const links = getRelatedSeoLinks(
      { make: "Toyota", model: "Prado", bodyType: "SUV", price: 4_500_000, dutyPaid: false },
      { take: 6 },
    );
    const duty = links.find((l) => l.href.startsWith("/duty"));
    expect(duty).toBeTruthy();
    expect(duty.href).toContain("prado");
  });

  it("emits WebApplication and FAQ JSON-LD", () => {
    const blocks = buildDutyCalculatorJsonLd({ pathname: "/duty" });
    const types = blocks.map((b) => b["@type"]);
    expect(types).toContain("WebApplication");
    expect(types).toContain("FAQPage");
    expect(types).toContain("BreadcrumbList");
  });
});
