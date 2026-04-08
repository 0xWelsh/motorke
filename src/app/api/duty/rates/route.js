import { NextResponse } from "next/server";
import { getDutyRates } from "@/lib/duty-rates";

export const dynamic = "force-dynamic";

export async function GET() {
  const { rates, meta } = await getDutyRates();
  return NextResponse.json({ rates, meta });
}
