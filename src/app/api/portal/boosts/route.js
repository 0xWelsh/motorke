export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  applyDealerBoost,
  getDealerBoostStatus,
  getOrCreateBoostBalance,
} from "@/lib/dealer-boosts";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";

export async function GET(request) {
  const session = await getSessionFromRequest();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const status = await getDealerBoostStatus(session.user.dealerId);
  return NextResponse.json(status);
}

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session?.user || session.user.role !== "DEALER") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { type, carId, action } = body;

  if (action === "grant_pack" && type === "spotlight_5pack") {
    await getOrCreateBoostBalance(session.user.dealerId);
    const balance = await db.dealerBoostBalance.update({
      where: { dealerId: session.user.dealerId },
      data: { spotlight7d: { increment: 5 } },
    });
    return NextResponse.json({
      success: true,
      message: "Five Spotlight credits added to your balance.",
      balance: {
        spotlight7d: balance.spotlight7d,
        spotlight30d: balance.spotlight30d,
        hotBadge7d: balance.hotBadge7d,
        dealerLift14d: balance.dealerLift14d,
      },
    });
  }

  const result = await applyDealerBoost({
    dealerId: session.user.dealerId,
    carId,
    type,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  if (result.car?.id) {
    const refreshHomepage =
      type === "spotlight_7d" || type === "spotlight_30d";
    await revalidateInventoryForCar(result.car.id, { refreshHomepage });
  } else if (type === "dealer_lift_14d") {
    const { revalidateInventory } = await import("@/lib/revalidate-inventory");
    revalidateInventory({ refreshHomepage: false });
  }

  return NextResponse.json({
    success: true,
    car: result.car,
    dealer: result.dealer,
    endsAt: result.endsAt,
    balance: result.balance,
  });
}
