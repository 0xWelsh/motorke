export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

const DAEMON_BASE = process.env.WHATSAPP_DAEMON_URL || "http://localhost:3006";

export async function GET() {
  try {
    const res = await fetch(`${DAEMON_BASE}/api/status`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return NextResponse.json({ status: "UNAVAILABLE", error: "Daemon not reachable" });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: "UNAVAILABLE", error: "Daemon not reachable" });
  }
}
