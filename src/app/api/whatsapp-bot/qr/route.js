export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const DAEMON_BASE = process.env.WHATSAPP_DAEMON_URL || "http://localhost:3006";

export async function GET() {
  try {
    const res = await fetch(`${DAEMON_BASE}/api/qr`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "QR not available" }, { status: 404 });
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
