import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { buildSellerOfferWhatsAppMessage, serializeBuyerRequestPublic } from "@/lib/buyer-request";
import {
  assertDealerCanSendOffer,
  findDealerOfferForRequest,
} from "@/lib/buyer-request-offers";
import { getSupportWhatsAppHref } from "@/lib/site-contact";

export const dynamic = "force-dynamic";

export async function POST(_request, { params }) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.dealerId || session.user.role !== "DEALER") {
      return NextResponse.json(
        {
          error: "Sign in with a dealer account to send offers on buyer requests.",
          code: "DEALER_AUTH_REQUIRED",
          loginUrl: "/login?callbackUrl=/requests",
        },
        { status: 401 }
      );
    }

    const dealerId = session.user.dealerId;
    const { id } = await params;

    const row = await db.buyerRequest.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const pub = serializeBuyerRequestPublic(row);
    if (!pub.isOpen) {
      return NextResponse.json({ error: "This request is no longer open." }, { status: 410 });
    }

    const existingOffer = await findDealerOfferForRequest(dealerId, id);
    if (existingOffer) {
      const message = buildSellerOfferWhatsAppMessage(row);
      const whatsappHref = getSupportWhatsAppHref(message);
      if (!whatsappHref) {
        return NextResponse.json({ error: "Support WhatsApp is not configured." }, { status: 503 });
      }
      return NextResponse.json({
        success: true,
        whatsappHref,
        publicCode: row.publicCode,
        alreadySent: true,
      });
    }

    const gate = await assertDealerCanSendOffer(dealerId);
    if (!gate.allowed) {
      return NextResponse.json(
        {
          error: gate.message,
          code: gate.code,
          upgradeUrl: gate.upgradeUrl,
        },
        { status: 403 }
      );
    }

    await db.$transaction([
      db.buyerRequestOffer.create({
        data: { dealerId, buyerRequestId: id },
      }),
      db.buyerRequest.update({
        where: { id },
        data: { offerClicks: { increment: 1 } },
      }),
    ]);

    const message = buildSellerOfferWhatsAppMessage(row);
    const whatsappHref = getSupportWhatsAppHref(message);
    if (!whatsappHref) {
      return NextResponse.json({ error: "Support WhatsApp is not configured." }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      whatsappHref,
      publicCode: row.publicCode,
    });
  } catch (err) {
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "You already sent an offer for this request." }, { status: 409 });
    }
    console.error("Buyer request offer-click error:", err);
    return NextResponse.json({ error: "Could not start offer." }, { status: 500 });
  }
}
