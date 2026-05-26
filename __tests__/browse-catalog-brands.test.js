import { BRANDS } from "@/lib/browse-catalog";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { existsSync } from "fs";
import { join } from "path";

describe("browse-catalog brands", () => {
  it("includes Audi with logo file and hub slug", () => {
    const audi = BRANDS.find((b) => b.name === "Audi");
    expect(audi).toBeDefined();
    expect(audi.img).toBe("logo_audi.png");
    expect(existsSync(join(process.cwd(), "public", "images", "logos", audi.img))).toBe(true);
    expect(slugifyCarSegment(audi.make || audi.name)).toBe("audi");
  });

  it("maps Mercedes display name to mercedes-benz slug", () => {
    const merc = BRANDS.find((b) => b.name === "Mercedes");
    expect(slugifyCarSegment(merc.make)).toBe("mercedes-benz");
  });

  it("every brand has a logo file in public", () => {
    for (const brand of BRANDS) {
      const path = join(process.cwd(), "public", "images", "logos", brand.img);
      expect(existsSync(path)).toBe(true);
    }
  });
});
