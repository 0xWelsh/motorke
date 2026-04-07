import { NextResponse } from "next/server";

export async function GET() {
  const headers = [
    "make", "model", "variant", "year", "price", "mileage",
    "condition", "fuelType", "transmission", "bodyType", "drivetrain", "steering",
    "engineCC", "color", "seats", "features", "description", "imageUrl",
    "negotiable", "dutyPaid", "imported", "importCountry",
  ];

  const examples = [
    ["Toyota", "Harrier", "2.0 Premium", "2020", "4200000", "38000", "USED", "PETROL", "AUTOMATIC", "SUV", "FWD", "RHD", "1998", "Pearl White", "5", "Sunroof;Leather Seats;Reverse Camera;Apple CarPlay", "Clean unit with full service history.", "", "true", "true", "true", "Japan"],
    ["Subaru", "Forester", "2.0i EyeSight", "2019", "2850000", "39000", "USED", "PETROL", "CVT", "SUV", "AWD", "RHD", "1995", "Dark Blue", "5", "AWD;EyeSight;Panoramic Roof", "Safety package and good condition.", "", "true", "true", "true", "Japan"],
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
