// src/app/api/admin/cars/route.js  — POST (create)
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { trackRequest } from "@/lib/telemetry";
import { logAuditEvent } from "@/lib/audit-trail";
import { ensureCarPublicSlugInTx } from "@/lib/car-public-slug";
import { notifyListingPublished } from "@/lib/seo-indexing";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";
import { mapCarImagesWithAlt } from "@/lib/car-listing-seo";
import { postCarToWhatsAppChannel } from "@/lib/whatsapp-channel";
import { broadcastCar, isBroadcastConfigured } from "@/lib/waha";
import { getSiteOrigin } from "@/lib/site-url";
import { sendSystemAlertEmail } from "@/lib/mail";

export async function POST(request) {
  const started = Date.now();
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    trackRequest({
      route: "/api/admin/cars",
      method: "POST",
      status: 401,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: "Unauthorised",
    });
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const car = await createCar(body);
    await revalidateInventoryForCar(car.id, { refreshHomepage: true });
    notifyListingPublished(car);
    logAuditEvent({
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "car.create",
      entity: "car",
      entityId: car.id,
      detail: { dealerId: car.dealerId, source: "admin" },
    });
    trackRequest({
      route: "/api/admin/cars",
      method: "POST",
      status: 201,
      durationMs: Date.now() - started,
      ok: true,
    });
    const origin = getSiteOrigin();
    const carUrl = `${origin}/cars/${car.id}`;
    const autoPost = body.postToWhatsApp !== false;
    if (autoPost) {
      queueMicrotask(() => {
        postCarToWhatsAppChannel(car, origin).catch(() => {});
      });
      if (isBroadcastConfigured()) {
        queueMicrotask(() => {
          broadcastCar(car, origin).catch(() => {});
        });
      }
    }
    queueMicrotask(() => {
      sendSystemAlertEmail({
        subject: `New car listed: ${car.year} ${car.make} ${car.model}`,
        summary: `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} (${car.year}) listed for ${car.price ? `KES ${parseInt(car.price).toLocaleString("en-KE")}` : "contact for price"}.`,
        details: {
          Make: car.make,
          Model: car.model,
          Variant: car.variant || "—",
          Year: String(car.year),
          Price: car.price ? `KES ${parseInt(car.price).toLocaleString("en-KE")}` : "Contact",
          Mileage: car.mileage ? `${parseInt(car.mileage).toLocaleString("en-KE")} km` : "—",
          Fuel: car.fuelType || "—",
          Transmission: car.transmission || "—",
          Body: car.bodyType || "—",
          "View listing": carUrl,
        },
      }).catch(() => {});
    });
    return NextResponse.json({ success: true, redirectTo: `/admin/cars`, car }, { status: 201 });
  } catch (err) {
    console.error(err);
    trackRequest({
      route: "/api/admin/cars",
      method: "POST",
      status: 500,
      durationMs: Date.now() - started,
      ok: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Shared create logic (used by admin and dealer portal)
export async function createCar(body) {
  const {
    dealerId: rawDealerId, make, model, variant, year, price, mileage,
    vehicleType, fuelType, transmission, bodyType, engineCC, drivetrain, steering,
    cylinders, horsepower, torque, turbo, sunroof, airbags,
    color, seats, description, features, badges, images, videoUrl,
    negotiable, imported, featured, registered, location, importCountry, dutyPaid,
    isLuxury,
  } = body;
  console.log("🏁 CREATE CAR IMAGES:", images?.map(img => ({ primary: img.isPrimary, url: img.url.split("/").pop() })));

  return db.$transaction(async (tx) => {
    let dealerId = rawDealerId;
    if (!dealerId) {
      const { getOrCreateInHouseDealer } = await import("@/lib/in-house-dealer");
      const dealer = await getOrCreateInHouseDealer();
      dealerId = dealer.id;
    }
    const car = await tx.car.create({
      data: {
      dealerId,
      vehicleType:  vehicleType || "CAR",
      make:         make.trim(),
      model:        model.trim(),
      variant:      variant?.trim() || null,
      year:         parseInt(year),
      price: price != null && String(price).trim() !== "" ? parseInt(price) : 0,
      mileage:      mileage ? parseInt(mileage) : null,
      fuelType:     fuelType || "PETROL",
      transmission: transmission || "AUTOMATIC",
      bodyType:     bodyType || "SEDAN",
      engineCC:     engineCC ? parseInt(engineCC) : null,
      cylinders:    cylinders ? parseInt(cylinders) : null,
      horsepower:   horsepower ? parseInt(horsepower) : null,
      torque:       torque ? parseInt(torque) : null,
      drivetrain:   drivetrain || "FWD",
      steering:     steering || "RHD",
      turbo:        Boolean(turbo),
      sunroof:      Boolean(sunroof),
      airbags:      airbags ? parseInt(airbags) : 0,
      color:        color?.trim() || null,
      seats:        seats ? parseInt(seats) : null,
      description:  description?.trim() || null,
      features:     Array.isArray(features) ? features : [],
      badges:       Array.isArray(badges) ? badges : [],
      videoUrl:     videoUrl?.trim() || null,
      negotiable:   Boolean(negotiable),
      dutyPaid:     dutyPaid === false || dutyPaid === "false" ? false : true,
      registered:   registered === false || registered === "false" ? false : true,
      imported:     Boolean(imported),
      importCountry: importCountry?.trim() || null,
      featured:     Boolean(featured),
      isLuxury:     Boolean(isLuxury),
      available:    true,
      location:     location?.trim() || null,
      images: images?.length
        ? {
            create: mapCarImagesWithAlt(
              {
                year: parseInt(year),
                make: make.trim(),
                model: model.trim(),
                variant: variant?.trim() || null,
                engineCC: engineCC ? parseInt(engineCC) : null,
                fuelType: fuelType || "PETROL",
                bodyType: bodyType || "SEDAN",
              },
              images,
            ),
          }
        : undefined,
    },
    });
    await ensureCarPublicSlugInTx(tx, car);
    return tx.car.findUniqueOrThrow({ where: { id: car.id } });
  });
}
