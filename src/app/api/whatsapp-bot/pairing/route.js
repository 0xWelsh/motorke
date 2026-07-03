export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

// Pairing code is not supported by whatsapp-web.js daemon.
// Use the QR code method instead.
export async function POST() {
  return NextResponse.json(
    { error: "Pairing code not available with this engine. Use QR code instead." },
    { status: 400 },
  );
}
