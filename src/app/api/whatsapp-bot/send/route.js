export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { sendText, sendImage, getChatId } from "@/lib/waha";
import { db } from "@/lib/db";
import { formatCarPrice } from "@/lib/utils";
import { getHeroImageUrl } from "@/lib/image-transform";

async function postCar(phone, carId, origin) {
  const car = await db.car.findUnique({
    where: { id: carId },
    include: { images: { take: 1, orderBy: { isPrimary: "desc" } } },
  });

  if (!car) return { success: false, error: "Car not found" };

  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const price = formatCarPrice(car);
  const url = `${origin}/cars/${car.publicSlug || car.id}`;
  const mileage = car.mileage ? `${Number(car.mileage).toLocaleString("en-KE")} km` : "";
  const location = car.location || "Kenya";

  const caption =
    `🚗 *${title}*\n📍 ${location} | ${price}\n` +
    `${mileage ? `⚡ ${mileage}\n` : ""}` +
    `🔗 ${url}`;

  const chatId = getChatId(phone);

  if (car.images?.[0]?.url) {
    const imgUrl = getHeroImageUrl(car.images[0].url, 75, 800);
    return sendImage(chatId, imgUrl, caption);
  }

  return sendText(chatId, caption);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { phone, carId, message } = body;

    if (!phone) {
      return NextResponse.json({ error: "phone is required" }, { status: 400 });
    }

    const chatId = getChatId(phone);

    if (carId) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://bidgari.com";
      const result = await postCar(phone, carId, origin);
      return NextResponse.json({ success: true, result });
    }

    if (message) {
      const result = await sendText(chatId, message);
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "carId or message required" }, { status: 400 });
  } catch (err) {
    console.error("[WA Bot Send] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
