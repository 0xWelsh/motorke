import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Price rates endpoint retired. Listings now use final prices." },
    { status: 410 }
  );
}
