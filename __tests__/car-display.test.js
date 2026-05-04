import { buildCarDetailSpecRows, meaningfulFeatureList } from "@/lib/car-display";

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
});
