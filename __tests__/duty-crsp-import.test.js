/** @jest-environment node */

import {
  parseDutyCrspCsv,
  generateDutyCrspTemplateCsv,
  DUTY_CRSP_CSV_HEADERS,
} from "@/lib/duty-crsp-import";

describe("duty CRSP CSV import", () => {
  test("parses valid rows with comma thousands in crspKes", () => {
    const csv = `make,model,trim,year,engineCC,fuelType,bodyType,crspKes
Toyota,Prado,TX,2018,2800,DIESEL,SUV,"5,400,000"
Mazda,CX-5,,2019,2000,PETROL,SUV,3100000`;

    const { rows, errors } = parseDutyCrspCsv(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(2);
    expect(rows[0].crspKes).toBe(5_400_000);
    expect(rows[1].fuelType).toBe("PETROL");
  });

  test("reports missing required columns", () => {
    const { rows, errors } = parseDutyCrspCsv("make,model\nToyota,Hiace");
    expect(rows).toHaveLength(0);
    expect(errors[0].message).toMatch(/Missing columns/);
  });

  test("template includes header row", () => {
    const csv = generateDutyCrspTemplateCsv();
    expect(csv.split("\n")[0]).toBe(DUTY_CRSP_CSV_HEADERS.join(","));
  });
});
