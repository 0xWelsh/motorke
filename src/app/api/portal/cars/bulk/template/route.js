import { NextResponse } from "next/server";

export async function GET() {
  const headers = [
    "make", "model", "variant", "year", "price", "mileage",
    "condition", "fuelType", "transmission", "bodyType", "drivetrain", "steering",
    "engineCC", "groundClearanceMm", "hybridBatteryTech", "spareAvailability", "importEligibility",
    "color", "seats", "features", "description", "imageUrl",
    "negotiable", "dutyPaid", "imported", "importCountry",
  ];

  const examples = [
    ["Toyota", "Harrier", "2.0 Premium", "2020", "4200000", "38000", "USED", "PETROL", "AUTOMATIC", "SUV", "FWD", "RHD", "1998", "190", "NA", "9", "true", "Pearl White", "5", "Sunroof;Leather Seats;Reverse Camera;Apple CarPlay", "Clean unit with full service history.", "", "true", "true", "true", "Japan"],
    ["Toyota", "Aqua", "S", "2019", "1800000", "61000", "USED", "HYBRID", "AUTOMATIC", "HATCHBACK", "FWD", "RHD", "1490", "140", "NIMH", "9", "true", "Silver", "5", "Hybrid;Reverse Camera;Lane Assist", "Efficient city hybrid with clean history.", "", "true", "true", "true", "Japan"],
  ];

  const rows = [headers.join(",")];
  for (const row of examples) {
    rows.push(row.map((v) => (String(v).includes(",") ? `"${v}"` : v)).join(","));
  }

  return new NextResponse(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="motorke-dealer-bulk-template.csv"',
    },
  });
}
