// src/app/api/cars/bulk/template/route.js
import { NextResponse } from "next/server";

export async function GET() {
  const headers = [
    "make", "model", "variant", "year", "price", "mileage",
    "fuelType", "transmission", "bodyType", "engineCC", "color",
    "seats", "drivetrain", "steering", "features", "description", "imageUrl",
    "dutyPaid", "imported", "importCountry",
  ];

  // Example rows showing real Kenyan car data
  const examples = [
    ["Toyota","Hilux","Double Cab 4x4","2021","5500000","31000","DIESEL","MANUAL","PICKUP","2755","White","5","FOURWD","RHD","Bull bar;Tow bar;4WD","Excellent condition. Duty paid. One owner.","","true","true","Japan"],
    ["Toyota","Harrier","2.0 Premium","2020","4200000","38000","PETROL","AUTOMATIC","SUV","1998","Pearl White","5","FWD","RHD","Sunroof;Leather seats;Reverse camera;Apple CarPlay","Full service history. Accident free.","","true","true","Japan"],
    ["Mazda","CX-5","2.5 Skyactiv AWD","2021","4600000","27000","PETROL","AUTOMATIC","SUV","2488","Soul Red","5","AWD","RHD","Bose sound;HUD;Sunroof;Blind spot monitor","Award winning SUV. Outstanding condition.","","true","true","Japan"],
    ["Toyota","Fielder","1.5G Hybrid","2019","1150000","58000","HYBRID","CVT","WAGON","1496","Silver","5","FWD","RHD","Hybrid;Reverse camera;Keyless entry","Fuel efficient. Clean interior.","","true","true","Japan"],
    ["Subaru","Forester","2.0i EyeSight AWD","2019","2850000","39000","PETROL","CVT","SUV","1995","Dark Blue","5","AWD","RHD","EyeSight;Symmetrical AWD;Panoramic sunroof","Safety packed SUV. Full service history.","","true","true","Japan"],
  ];

  const csvRows = [headers.join(",")];
  for (const row of examples) {
    csvRows.push(row.map(v => v.includes(",") ? `"${v}"` : v).join(","));
  }

  const csv = csvRows.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": 'attachment; filename="welsh-motors-cars-template.csv"',
    },
  });
}