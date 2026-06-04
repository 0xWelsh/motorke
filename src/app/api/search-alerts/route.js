// src/app/api/search-alerts/route.js
import { NextResponse } from "next/server";
import { subscribeToSearchAlert } from "@/lib/search-alerts";

function normalizeKenyanPhone(value) {
  const digits = (value || "").toString().replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.length === 9 && /^(7|1)/.test(digits)) return `254${digits}`;
  return "";
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, make, model, minPrice, maxPrice, minYear, bodyType } = body;

    const normalizedPhone = normalizeKenyanPhone(phone);
    if (!normalizedPhone || normalizedPhone.length !== 12) {
      return NextResponse.json({ error: "Please provide a valid Kenyan phone number (e.g., 0712...)" }, { status: 400 });
    }

    const alert = await subscribeToSearchAlert({
      phone: normalizedPhone,
      make,
      model,
      minPrice,
      maxPrice,
      minYear,
      bodyType
    });

    return NextResponse.json({ success: true, alertId: alert.id }, { status: 201 });

  } catch (error) {
    console.error("Search Alert API Error:", error);
    return NextResponse.json({ error: "Failed to set up alert" }, { status: 500 });
  }
}
