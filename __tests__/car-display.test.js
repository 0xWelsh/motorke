import { buildCarDetailSpecRows, featureDedupeKey, meaningfulFeatureList } from "@/lib/car-display";
import { buildDetailFieldRows, buildFeatureItems } from "@/lib/car-detail-fields";

describe("car-display helpers", () => {
  test("buildCarDetailSpecRows omits zero and empty values", () => {
    const rows = buildCarDetailSpecRows({
      year: 2019,
      mileage: 0,
      fuelType: "",
      transmission: "",
      drivetrain: null,
      steering: undefined,
      bodyType: "",
      engineCC: 0,
      cylinders: 0,
      horsepower: 0,
      torque: 0,
      turbo: false,
      seats: 0,
      airbags: 0,
      sunroof: false,
      color: "  ",
      condition: "",
      registered: true,
      importCountry: "Japan",
    });

    const labels = rows.map((row) => row.label);
    expect(labels).toContain("Year");
    expect(labels).toContain("Registration");
    expect(labels).not.toContain("Mileage");
    expect(labels).not.toContain("Engine size");
    expect(labels).not.toContain("Seats");
    expect(labels).not.toContain("Airbags");
    expect(labels).not.toContain("Import country");
  });

  test("meaningfulFeatureList drops placeholder feature values", () => {
    expect(meaningfulFeatureList(["", "N/A", "0", "  ", "Sunroof", "Leather seats"])).toEqual([
      "Sunroof",
      "Leather seats",
    ]);
  });

  test("meaningfulFeatureList keeps the first spelling of a repeated feature", () => {
    expect(
      meaningfulFeatureList([
        "Airbags",
        "airbags",
        "AIRBAGS",
        " Airbags. ",
        "Alloy  Wheels",
        "Alloy wheels:",
        "Sunroof",
      ])
    ).toEqual(["Airbags", "Alloy  Wheels", "Sunroof"]);
  });

  test("featureDedupeKey ignores casing, padding, inner runs and trailing punctuation", () => {
    expect(featureDedupeKey("Alloy Wheels")).toBe(featureDedupeKey("  alloy   wheels. "));
    expect(featureDedupeKey("Airbags!")).toBe(featureDedupeKey("airbags"));
    expect(featureDedupeKey("sunroof")).not.toBe(featureDedupeKey("moonroof"));
  });
});

describe("buildFeatureItems", () => {
  test("caps the list and never returns a duplicate", () => {
    const features = ["Airbags", "airbags", "Sunroof", "Alloy Wheels", "ABS"];
    expect(buildFeatureItems({ features }, 24)).toEqual([
      "Airbags",
      "Sunroof",
      "Alloy Wheels",
      "ABS",
    ]);
    expect(buildFeatureItems({ features }, 2)).toEqual(["Airbags", "Sunroof"]);
  });

  test("ignores features that are only placeholders", () => {
    expect(buildFeatureItems({ features: ["N/A", "-", "0", "Roof Rack"] })).toEqual(["Roof Rack"]);
  });
});

describe("buildDetailFieldRows", () => {
  const usedImport = {
    id: "abc123456789",
    make: "Nissan",
    model: "March",
    year: 2019,
    condition: "USED",
    imported: true,
    importCountry: "Japan",
    registered: true,
    price: 420000,
    features: [],
  };

  test("never lists the same label in both tiers", () => {
    const { primary, secondary } = buildDetailFieldRows(usedImport);
    const labels = [...primary, ...secondary].map((r) => r.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  test("a used import shows Condition once and keeps Origin separate", () => {
    const { primary, secondary } = buildDetailFieldRows(usedImport);
    expect(primary.filter((r) => r.label === "Condition")).toHaveLength(1);
    expect(primary.find((r) => r.label === "Condition").value).toBe("Used");
    expect(secondary.find((r) => r.label === "Origin").value).toContain("Japan");
    expect(secondary.some((r) => r.label === "Condition")).toBe(false);
  });

  test("does not repeat the price inside the details grid", () => {
    const { primary, secondary } = buildDetailFieldRows(usedImport);
    expect([...primary, ...secondary].some((r) => r.label === "Asking price")).toBe(false);
  });

  test("falls back to the import origin when condition is unknown", () => {
    const { primary } = buildDetailFieldRows({ ...usedImport, condition: null });
    expect(primary.find((r) => r.label === "Condition").value).toContain("Japan");
  });
});
