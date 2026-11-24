import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadImage, deleteImage, imagePath } from "@/lib/storage";
import { ensureCarPublicSlugInTx } from "@/lib/car-public-slug";
import { ensurePrivateDealerFor, PRIVATE_LISTING_LIMIT } from "@/lib/private-seller";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FUEL = ["PETROL", "DIESEL", "HYBRID", "ELECTRIC"];
const TRANS = ["AUTOMATIC", "MANUAL", "CVT"];
const DRIVE = ["FWD", "RWD", "AWD", "FOURWD"];
const normDrivetrain = (v) => (v === "4WD" ? "FOURWD" : v); // form sends 4WD
const BODY = ["SEDAN", "SUV", "HATCHBACK", "COUPE", "CONVERTIBLE", "PICKUP", "VAN", "WAGON", "STATION_WAGON"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

async function sellerSession() {
  const session = await getSession();
  if (!session) return { error: "Unauthorised", status: 401 };
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Not found", status: 404 };
  return { user };
}

/** GET — my listings with moderation status. */
export async function GET() {
  const s = await sellerSession();
  if (s.error) return NextResponse.json({ error: s.error }, { status: s.status });
  if (!s.user.dealerId) return NextResponse.json({ listings: [] });

  const listings = await db.car.findMany({
    where: { dealerId: s.user.dealerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, publicSlug: true, make: true, model: true, year: true, price: true,
      available: true, listingStatus: true, moderationNote: true, createdAt: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  });
  return NextResponse.json({ listings });
}

/** POST — create a listing (multipart). Lands in review, not on the site. */
export async function POST(request) {
  const s = await sellerSession();
  if (s.error) return NextResponse.json({ error: s.error }, { status: s.status });

  const ensured = await ensurePrivateDealerFor(s.user);
  if (ensured.error) return NextResponse.json({ error: ensured.error }, { status: 400 });
  const dealer = ensured.dealer;

  const fd = await request.formData().catch(() => null);
  if (!fd) return NextResponse.json({ error: "Malformed request" }, { status: 400 });

  const get = (k) => (fd.get(k)?.toString() || "").trim();
  const num = (k) => { const n = Number(get(k)); return Number.isFinite(n) ? n : null; };

  const make = get("make"), model = get("model");
  const year = num("year"), price = num("price");
  const photos = fd.getAll("photos").filter((f) => typeof f !== "string");

  const errors = [];
  if (!make || !model) errors.push("Make and model are required.");
  if (!year || year < 1970 || year > new Date().getFullYear() + 1) errors.push("Year looks wrong.");
  if (!price || price < 100000 || price > 500_000_000) errors.push("Price (KES) looks wrong.");
  if (photos.length === 0) errors.push("At least one photo is required.");
  if (photos.length > MAX_PHOTOS) errors.push(`Max ${MAX_PHOTOS} photos.`);
  for (const p of photos) {
    if (!IMAGE_TYPES.includes(p.type)) errors.push("Photos must be JPEG, PNG or WebP.");
    if (p.size > MAX_PHOTO_BYTES) errors.push("Each photo must be under 8MB.");
  }
  if (errors.length) return NextResponse.json({ error: [...new Set(errors)].join(" ") }, { status: 400 });

  const activeCount = await db.car.count({
    where: { dealerId: dealer.id, available: true },
  });
  const pendingCount = await db.car.count({
    where: { dealerId: dealer.id, listingStatus: "PENDING_REVIEW" },
  });
  if (activeCount + pendingCount >= PRIVATE_LISTING_LIMIT) {
    return NextResponse.json(
      { error: `Private sellers can have ${PRIVATE_LISTING_LIMIT} cars out at a time. Sell one, then list the next.` },
      { status: 400 },
    );
  }

  const mileage = num("mileage");
  const engineCC = num("engineCC");
  const fuelType = FUEL.includes(get("fuelType").toUpperCase()) ? get("fuelType").toUpperCase() : "PETROL";
  const transmission = TRANS.includes(get("transmission").toUpperCase()) ? get("transmission").toUpperCase() : "AUTOMATIC";
  const drivetrain = DRIVE.includes(normDrivetrain(get("drivetrain").toUpperCase())) ? normDrivetrain(get("drivetrain").toUpperCase()) : "FWD";
  const bodyType = BODY.includes(get("bodyType").toUpperCase()) ? get("bodyType").toUpperCase() : "SEDAN";

  const car = await db.car.create({
    data: {
      dealerId: dealer.id,
      make: make.slice(0, 40),
      model: model.slice(0, 60),
      variant: get("variant").slice(0, 60) || null,
      year,
      price,
      negotiable: true,
      mileage,
      engineCC,
      fuelType,
      transmission,
      drivetrain,
      bodyType,
      color: get("color").slice(0, 30) || null,
      description: get("description").slice(0, 4000) || null,
      videoUrl: get("videoUrl").slice(0, 300) || null,
      condition: "USED",
      imported: false,          // local stock: inherits the 30-day listing lifecycle
      dutyPaid: true,
      registered: true,
      available: false,         // hidden until an admin approves
      listingStatus: "PENDING_REVIEW",
    },
  });

  let order = 0;
  for (const file of photos) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = imagePath(car.id, order, file.type);
    const url = await uploadImage(buffer, path, file.type);
    await db.carImage.create({
      data: { carId: car.id, url, isPrimary: order === 0, order },
    });
    order++;
  }

  // Keyword slug now (preview links work in the queue); no index ping yet.
  const withSlug = await db.$transaction(async (tx) => {
    await ensureCarPublicSlugInTx(tx, car);
    return tx.car.findUniqueOrThrow({ where: { id: car.id } });
  });

  revalidateTag("cars");
  return NextResponse.json({
    success: true,
    id: withSlug.id,
    status: "PENDING_REVIEW",
    message: "Listing received. Our team usually reviews within a day.",
  });
}

/** DELETE ?id= — pull a listing (seller can always remove their own). */
export async function DELETE(request) {
  const s = await sellerSession();
  if (s.error) return NextResponse.json({ error: s.error }, { status: s.status });
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !s.user.dealerId) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const car = await db.car.findFirst({
    where: { id, dealerId: s.user.dealerId },
    include: { images: { select: { url: true } } },
  });
  if (!car) return NextResponse.json({ error: "Not your listing" }, { status: 404 });

  await db.car.delete({ where: { id } });
  for (const img of car.images) await deleteImage(img.url).catch(() => {});

  revalidateTag("cars");
  revalidateTag("homepage");
  return NextResponse.json({ success: true });
}
