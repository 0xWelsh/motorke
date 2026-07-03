// src/app/api/admin/model-specs/route.js
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const make = searchParams.get("make");
  const model = searchParams.get("model");

  const where = {};
  if (make) where.make = { contains: make, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };

  const specs = await db.carModelSpec.findMany({
    where,
    orderBy: [{ make: "asc" }, { model: "asc" }, { yearStart: "desc" }],
  });

  return Response.json({ ok: true, specs });
}

export async function POST(request) {
  await requireAdmin();
  const body = await request.json();

  const spec = await db.carModelSpec.create({
    data: {
      make: body.make,
      model: body.model,
      variant: body.variant || null,
      yearStart: Number(body.yearStart),
      yearEnd: body.yearEnd ? Number(body.yearEnd) : null,
      bodyType: body.bodyType || null,
      vehicleType: body.vehicleType || null,
      engineCC: body.engineCC ? Number(body.engineCC) : null,
      cylinders: body.cylinders ? Number(body.cylinders) : null,
      horsepower: body.horsepower ? Number(body.horsepower) : null,
      torque: body.torque ? Number(body.torque) : null,
      fuelType: body.fuelType || null,
      transmission: body.transmission || null,
      drivetrain: body.drivetrain || null,
      steering: body.steering || null,
      seats: body.seats ? Number(body.seats) : null,
      doors: body.doors ? Number(body.doors) : null,
      airbags: body.airbags ? Number(body.airbags) : null,
      groundClearanceMm: body.groundClearanceMm ? Number(body.groundClearanceMm) : null,
      turbo: body.turbo === true || body.turbo === "true",
      sunroof: body.sunroof === true || body.sunroof === "true",
      curbWeightKg: body.curbWeightKg ? Number(body.curbWeightKg) : null,
      fuelTankLiters: body.fuelTankLiters ? Number(body.fuelTankLiters) : null,
      standardFeatures: Array.isArray(body.standardFeatures)
        ? body.standardFeatures
        : (body.standardFeatures || "").split(",").map((s) => s.trim()).filter(Boolean),
      source: body.source || "admin",
      verified: body.verified === true || body.verified === "true",
    },
  });

  revalidatePath("/admin/model-specs");
  return Response.json({ ok: true, spec });
}

export async function PUT(request) {
  await requireAdmin();
  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return Response.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  const updateData = {};
  const fields = [
    "make", "model", "variant", "yearStart", "yearEnd", "bodyType", "vehicleType",
    "engineCC", "cylinders", "horsepower", "torque", "fuelType", "transmission",
    "drivetrain", "steering", "seats", "doors", "airbags", "groundClearanceMm",
    "turbo", "sunroof", "curbWeightKg", "fuelTankLiters",
    "source", "verified",
  ];

  for (const field of fields) {
    if (data[field] !== undefined) {
      if (["engineCC", "cylinders", "horsepower", "torque", "seats", "doors",
        "airbags", "groundClearanceMm", "curbWeightKg", "fuelTankLiters", "yearStart", "yearEnd"
      ].includes(field)) {
        updateData[field] = data[field] ? Number(data[field]) : null;
      } else if (["turbo", "sunroof", "verified"].includes(field)) {
        updateData[field] = data[field] === true || data[field] === "true";
      } else {
        updateData[field] = data[field] || null;
      }
    }
  }

  if (data.standardFeatures !== undefined) {
    updateData.standardFeatures = Array.isArray(data.standardFeatures)
      ? data.standardFeatures
      : String(data.standardFeatures).split(",").map((s) => s.trim()).filter(Boolean);
  }

  const spec = await db.carModelSpec.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin/model-specs");
  return Response.json({ ok: true, spec });
}

export async function DELETE(request) {
  await requireAdmin();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ ok: false, error: "id is required" }, { status: 400 });
  }

  await db.carModelSpec.delete({ where: { id } });

  revalidatePath("/admin/model-specs");
  return Response.json({ ok: true });
}
