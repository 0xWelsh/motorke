// src/app/api/leads/route.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { sendLeadAlertEmail } from "@/lib/mail";
import { NextResponse } from "next/server";

const RATE_LIMIT_MS = 15000;
const RATE_LIMIT_MAX_WINDOW = 8000;
const leadRateLimitStore = globalThis.__welsh_motorsLeadRateLimit || new Map();
globalThis.__welsh_motorsLeadRateLimit = leadRateLimitStore;

function normalizeKenyanPhone(value) {
  const digits = (value || "").toString().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && /^(7|1)/.test(digits)) return `254${digits}`;
  return "";
}

function isValidKenyanPhone(value) {
  return /^254(7\d{8}|1\d{8})$/.test(value);
}

function buildCarTitle(car) {
  const parts = [car?.year, car?.make, car?.model].filter(Boolean);
  return parts.join(" ") || "Vehicle";
}

async function dispatchLeadNotifications({ lead, car, dealerId, buyerUserId }) {
  try {
    const [dealerUsers, adminUsers] = await Promise.all([
      db.user.findMany({
        where: {
          role: "DEALER",
          dealerId,
          active: true,
        },
        select: {
          id: true,
          email: true,
        },
      }),
      db.user.findMany({
        where: {
          role: "ADMIN",
          active: true,
        },
        select: {
          id: true,
        },
      }),
    ]);

    const carTitle = buildCarTitle(car);
    const buyerName = lead.name || "Buyer";
    const notificationRows = [
      ...dealerUsers.map((user) => ({
        userId: user.id,
        type: "LEAD_NEW",
        title: `New enquiry for ${carTitle}`,
        message: `${buyerName} sent an enquiry.`,
        link: `/portal/leads?lead=${lead.id}`,
      })),
      ...adminUsers.map((user) => ({
        userId: user.id,
        type: "LEAD_NEW",
        title: `New lead submitted (${carTitle})`,
        message: `${buyerName} reached out to dealer ${car?.dealer?.name || "Unknown Dealer"}.`,
        link: `/admin/leads?lead=${lead.id}`,
      })),
      ...(buyerUserId
        ? [{
            userId: buyerUserId,
            type: "LEAD_SENT",
            title: `Enquiry sent for ${carTitle}`,
            message: `Your enquiry was delivered to ${car?.dealer?.name || "the dealer"}.`,
            link: "/account?tab=enquiries",
          }]
        : []),
    ];

    if (notificationRows.length) {
      await db.notification.createMany({ data: notificationRows });
    }

    const dealerEmailRecipients = [
      ...new Set([
        ...(dealerUsers.map((user) => user.email).filter(Boolean)),
        car?.dealer?.email,
      ]),
    ];

    if (dealerEmailRecipients.length) {
      await sendLeadAlertEmail({
        to: dealerEmailRecipients,
        dealerName: car?.dealer?.name,
        carTitle,
        buyerName: lead.name,
        buyerPhone: lead.phone,
        buyerEmail: lead.email,
        buyerMessage: lead.message,
        channel: lead.channel,
        leadId: lead.id,
      });
    }
  } catch (notificationError) {
    console.error("Lead notification dispatch error:", notificationError);
  }
}

export async function POST(request) {
  try {
    const session = await getSessionFromRequest();
    const buyerUserId =
      session?.user?.id && session?.user?.role === "BUYER" ? session.user.id : null;

    const contentType = request.headers.get("content-type") || "";
    let body;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const fd = await request.formData();
      body = Object.fromEntries(fd.entries());
    }

    const { carId, dealerId, name, phone, email, message, channel } = body;
    const normalizedChannel = (channel || "web").toString().toLowerCase();
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
    const rateKey = `${ip}:${carId || "unknown"}`;
    const now = Date.now();
    const lastHit = leadRateLimitStore.get(rateKey) || 0;

    // Lightweight anti-spam guard with periodic map cleanup.
    if (now - lastHit < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: "Too many lead requests. Please try again in a few seconds." },
        { status: 429 }
      );
    }

    if (leadRateLimitStore.size > RATE_LIMIT_MAX_WINDOW) {
      for (const [key, timestamp] of leadRateLimitStore.entries()) {
        if (now - timestamp > RATE_LIMIT_MS * 20) {
          leadRateLimitStore.delete(key);
        }
      }
    }
    leadRateLimitStore.set(rateKey, now);

    if (!carId || !dealerId) {
      return NextResponse.json(
        { error: "Missing required fields: carId, dealerId" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizeKenyanPhone(phone);
    const requiresBuyerContact = normalizedChannel !== "whatsapp";
    const normalizedName = name?.toString().trim();

    if (requiresBuyerContact && !normalizedName) {
      return NextResponse.json(
        { error: "Name is required for web enquiries" },
        { status: 400 }
      );
    }

    if (requiresBuyerContact && !normalizedPhone) {
      return NextResponse.json(
        { error: "Phone number is required for web enquiries" },
        { status: 400 }
      );
    }

    if (normalizedPhone && !isValidKenyanPhone(normalizedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Verify car + dealer exist
    const car = await db.car.findUnique({
      where:  { id: carId },
      select: {
        id: true,
        dealerId: true,
        available: true,
        year: true,
        make: true,
        model: true,
        dealer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!car || !car.available || car.dealerId !== dealerId) {
      return NextResponse.json({ error: "Invalid car or dealer" }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        carId,
        dealerId,
        name:    normalizedName || (normalizedChannel === "whatsapp" ? "WhatsApp tap" : "Anonymous"),
        phone:   normalizedPhone || "not-provided",
        email:   email?.toString().trim() || null,
        message: message?.toString().trim() || null,
        channel: normalizedChannel,
      },
    });

    await dispatchLeadNotifications({
      lead,
      car,
      dealerId,
      buyerUserId,
    });

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err) {
    console.error("Lead error:", err);
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }
}
