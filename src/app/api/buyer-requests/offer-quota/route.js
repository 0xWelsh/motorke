import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getDealerOfferQuota } from "@/lib/buyer-request-offers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.dealerId) {
      return NextResponse.json({
        loggedIn: false,
        isDealer: false,
        loginUrl: "/login?callbackUrl=/requests",
      });
    }

    const quota = await getDealerOfferQuota(session.user.dealerId);
    return NextResponse.json({
      loggedIn: true,
      isDealer: session.user.role === "DEALER",
      ...quota,
    });
  } catch (err) {
    console.error("Buyer request offer-quota error:", err);
    return NextResponse.json({ error: "Could not load offer quota." }, { status: 500 });
  }
}
