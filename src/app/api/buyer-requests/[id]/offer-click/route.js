import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildSellerOfferWhatsAppMessage, serializeBuyerRequestPublic } from "@/lib/buyer-request";
import { getSupportWhatsAppHref } from "@/lib/site-contact";

export const dynamic = "force-dynamic";

export async function POST(_request, { params }) {
  try {
    const { id } = await params;
    const row = await db.buyerRequest.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const pub = serializeBuyerRequestPublic(row);
    if (!pub.isOpen) {
      return NextResponse.json({ error: "This request is no longer open." }, { status: 410 });
    }

    await db.buyerRequest.update({
      where: { id },
      data: { offerClicks: { increment: 1 } },
    });

    const message = buildSellerOfferWhatsAppMessage(row);
    const whatsappHref = getSupportWhatsAppHref(message);

    return NextResponse.json({
      success: true,
      whatsappHref,
      publicCode: row.publicCode,
    });
  } catch (err) {
    console.error("Buyer request offer-click error:", err);
    return NextResponse.json({ error: "Could not start offer." }, { status: 500 });
  }
}
