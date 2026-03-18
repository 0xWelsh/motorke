// src/app/api/leads/route.js
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const fd = await request.formData();
      body = Object.fromEntries(fd.entries());
    }

    const { carId, dealerId, name, phone, email, message, channel } = body;

    if (!carId || !dealerId || !name || !phone) {
      return NextResponse.json(
        { error: "Missing required fields: carId, dealerId, name, phone" },
        { status: 400 }
      );
    }

    // Verify car + dealer exist
    const car = await db.car.findUnique({
      where:  { id: carId },
      select: { id: true, dealerId: true },
    });

    if (!car || car.dealerId !== dealerId) {
      return NextResponse.json({ error: "Invalid car or dealer" }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        carId,
        dealerId,
        name:    name.toString().trim(),
        phone:   phone.toString().trim(),
        email:   email?.toString().trim() || null,
        message: message?.toString().trim() || null,
        channel: channel || "web",
      },
    });

    return NextResponse.json({ success: true, leadId: lead.id }, { status: 201 });
  } catch (err) {
    console.error("Lead error:", err);
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }
}
