// src/app/api/whatsapp-channel/post/route.js
// POST /api/whatsapp-channel/post — post a single car to the WhatsApp Channel

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { postCarToWhatsAppChannel } from "@/lib/whatsapp-channel";
import { getSiteOrigin } from "@/lib/site-url";

export async function POST(request) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let carId;
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await request.json();
      carId = body.carId;
    } else {
      const form = await request.formData();
      carId = form.get("carId");
    }
    if (!carId) {
      return NextResponse.json({ error: "carId is required" }, { status: 400 });
    }

    const car = await db.car.findUnique({
      where: { id: carId },
      include: { images: { take: 1, orderBy: { isPrimary: "desc" } } },
    });

    if (!car) {
      return NextResponse.json({ error: "Car not found" }, { status: 404 });
    }

    const origin = getSiteOrigin();
    const result = await postCarToWhatsAppChannel(car, origin);

    if (!result.success) {
      const msg = result.error || "Failed to post";
      if (ct.includes("application/json")) {
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      return NextResponse.redirect(new URL("/admin/cars?error=wa-post-failed", request.url));
    }

    if (ct.includes("application/json")) {
      return NextResponse.json({ success: true, messageId: result.messageId });
    }
    return NextResponse.redirect(new URL("/admin/cars?success=wa-posted", request.url));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
