export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { searchDutyVehicles, serializeDutyVehicleForClient } from "@/lib/duty-calculator-service";

const querySchema = z.object({
  q: z.string().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(24).optional().default(12),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: searchParams.get("q") || "",
    limit: searchParams.get("limit") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query", vehicles: [] }, { status: 400 });
  }

  const vehicles = await searchDutyVehicles(parsed.data.q, parsed.data.limit);
  return NextResponse.json({
    query: parsed.data.q,
    vehicles: vehicles.map((v) => serializeDutyVehicleForClient(v)).filter(Boolean),
  });
}
