// src/app/api/cars/create/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();

    const get     = (key) => formData.get(key);
    const getInt  = (key) => { const v = get(key); return v ? parseInt(v) : null; };
    const getBool = (key) => get(key) === "on" || get(key) === "true";

    // Validate required fields
    const required = ["dealerId", "make", "model", "year", "price", "fuelType", "transmission", "bodyType"];
    for (const field of required) {
      if (!get(field)) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Parse features (comma-separated string → array)
    const featuresRaw = get("features") || "";
    const features    = featuresRaw
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const car = await db.car.create({
      data: {
        dealerId:     get("dealerId"),
        make:         get("make").trim(),
        model:        get("model").trim(),
        variant:      get("variant")?.trim() || null,
        year:         getInt("year"),
        price:        getInt("price"),
        mileage:      getInt("mileage"),
        fuelType:     get("fuelType"),
        transmission: get("transmission"),
        bodyType:     get("bodyType"),
        engineCC:     getInt("engineCC"),
        color:        get("color")?.trim() || null,
        seats:        getInt("seats"),
        description:  get("description")?.trim() || null,
        features,
        negotiable:   getBool("negotiable"),
        dutyPaid:     getBool("dutyPaid"),
        imported:     getBool("imported"),
        importCountry: "Japan",
        available:    true,

        // Create primary image if URL provided
        images: get("imageUrl")
          ? {
              create: [{
                url:       get("imageUrl"),
                isPrimary: true,
                order:     0,
              }],
            }
          : undefined,
      },
    });

    // Redirect to the new car page
    return NextResponse.redirect(
      new URL(`/cars/${car.id}`, request.url)
    );
  } catch (err) {
    console.error("Create car error:", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
