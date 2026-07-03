export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const DAEMON_BASE = process.env.WHATSAPP_DAEMON_URL || "http://localhost:3006";

export async function POST() {
  try {
    const res = await fetch(`${DAEMON_BASE}/api/restart`, {
      method: "POST",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
