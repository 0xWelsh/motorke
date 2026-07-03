// src/app/api/cars/create/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { finalizeNewCarPublicSlug } from "@/lib/car-public-slug";
import { carListingPath } from "@/lib/car-listing-url";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";
import { buildCarImageAlt } from "@/lib/car-listing-seo";

export async function POST(request) {
  try {
    const session = await getSessionFromRequest();
    if (!session) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const formData = await request.formData();

    const get     = (key) => formData.get(key);
    const getInt  = (key) => { const v = get(key); return v ? parseInt(v) : null; };
    const getBool = (key) => get(key) === "on" || get(key) === "true";

    // Validate required fields
    const required = ["make", "model", "year", "price", "fuelType", "transmission", "bodyType"];
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

    // Resolve dealerId from session
    const dealerId = session.user.role === "ADMIN"
      ? get("dealerId")
      : session.user.dealerId;

    if (!dealerId) {
      return NextResponse.json({ error: "Dealer account required to create listings" }, { status: 400 });
    }

    const car = await db.car.create({
      data: {
        dealerId,
        make:         get("make").trim(),
        model:        get("model").trim(),
        variant:      get("variant")?.trim() || null,
        year:         getInt("year"),
        price: getInt("price"),
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
        dutyPaid:     true,
        registered:   get("registered") != null ? getBool("registered") : true,
        imported:     getBool("imported"),
        importCountry: "Japan",
        available:    true,

        // Create primary image if URL provided
        images: get("imageUrl")
          ? {
              create: [
                {
                  url: get("imageUrl"),
                  isPrimary: true,
                  order: 0,
                  alt: buildCarImageAlt(
                    {
                      year: getInt("year"),
                      make: get("make").trim(),
                      model: get("model").trim(),
                      variant: get("variant")?.trim() || null,
                      engineCC: getInt("engineCC"),
                      fuelType: get("fuelType"),
                      bodyType: get("bodyType"),
                    },
                    1,
                    { isPrimary: true },
                  ),
                },
              ],
            }
          : undefined,
      },
    });

    const finalized = await finalizeNewCarPublicSlug(car);
    await revalidateInventoryForCar(finalized.id, { refreshHomepage: true });

    return NextResponse.redirect(new URL(carListingPath(finalized), request.url));
  } catch (err) {
    console.error("Create car error:", err);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
