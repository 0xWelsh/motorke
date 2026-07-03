// src/app/api/cars/spec-lookup/route.js
import { getAutoFillData } from "@/lib/model-specs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");
  const variant = searchParams.get("variant");
  const year = searchParams.get("year");

  if (!make || !model || !year) {
    return Response.json({ ok: false, error: "make, model, and year are required" }, { status: 400 });
  }

  const fillData = await getAutoFillData({ make, model, variant, year });

  return Response.json({
    ok: true,
    matched: Object.keys(fillData).length > 0,
    fillData,
  });
}
