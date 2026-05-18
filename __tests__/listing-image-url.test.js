import {
  extractCarImageStoragePath,
  normalizeListingHeroImageUrl,
} from "@/lib/listing-image-url";

describe("listing-image-url", () => {
  test("normalizeListingHeroImageUrl adds /public/ for legacy paths", () => {
    const raw =
      "https://abc.supabase.co/storage/v1/object/car-images/cars/x/1.jpg";
    const out = normalizeListingHeroImageUrl(raw);
    expect(out).toContain("/object/public/car-images/");
  });

  test("extractCarImageStoragePath from public URL", () => {
    const url =
      "https://abc.supabase.co/storage/v1/object/public/car-images/cars/clx1/photo.jpg";
    expect(extractCarImageStoragePath(url)).toBe("cars/clx1/photo.jpg");
  });

  test("extractCarImageStoragePath strips query from signed URL", () => {
    const url =
      "https://abc.supabase.co/storage/v1/object/sign/car-images/cars/clx1/p.jpg?token=abc";
    expect(extractCarImageStoragePath(url)).toBe("cars/clx1/p.jpg");
  });
});
