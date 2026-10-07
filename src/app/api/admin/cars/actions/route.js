// src/app/api/admin/cars/actions/route.js
// Lightweight admin inventory ops: live/hide/sold/reopen/feature/boost/price.
// Single (`carId`) or bulk (`ids`) — the row controls and bulk bar both use it.
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateInventory, revalidateInventoryForCar } from "@/lib/revalidate-inventory";
import { availabilityUpdateData } from "@/lib/car-sold-status";

const ACTIONS = new Set([
  "setLive",
  "setHidden",
  "setSold",
  "reopen",
  "setFeatured",
  "setBoost",
  "setPrice",
]);

function buildUpdate(action, payload) {
  switch (action) {
    case "setLive":
      return { available: true, soldAt: null };
    case "setHidden":
      return availabilityUpdateData(false);
    case "setSold":
      return { available: false, soldAt: new Date() };
    case "reopen":
      return { available: true, soldAt: null };
    case "setFeatured":
      return { featured: Boolean(payload?.featured) };
    case "setBoost": {
      const boost = Math.max(0, Math.min(100, parseInt(payload?.boost, 10) || 0));
      return { boostScore: boost };
    }
    case "setPrice": {
      const price = Math.max(0, parseInt(payload?.price, 10) || 0);
      return { price };
    }
    default:
      return null;
  }
}

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { carId, ids, action, payload } = body;
  const list = carId ? [carId] : Array.isArray(ids) ? ids : [];
  if (!action || !ACTIONS.has(action) || list.length === 0) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const data = buildUpdate(action, payload);
  if (!data) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  await db.car.updateMany({ where: { id: { in: list } }, data });

  if (list.length === 1) {
    await revalidateInventoryForCar(list[0], { refreshHomepage: true });
  } else {
    await revalidateInventory({ refreshHomepage: true });
  }

  return NextResponse.json({ ok: true, count: list.length });
}