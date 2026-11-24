import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Apply for a BIDGARI verified badge. Requirements: name, a contact phone,
 * a handle (so the verified badge has somewhere to live) and a verified
 * email. Lands in the admin approvals queue as PENDING.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (user.verificationStatus === "PENDING") {
      return NextResponse.json({ error: "Application already pending." }, { status: 400 });
    }
    if (user.verificationStatus === "VERIFIED") {
      return NextResponse.json({ error: "Already verified." }, { status: 400 });
    }

    const missing = [];
    if (!user.name?.trim()) missing.push("full name");
    if (!user.phone?.trim()) missing.push("contact phone");
    if (!user.handle) missing.push("profile handle");
    // Google sign-ins are already email-verified at the IdP.
    if (!user.emailVerified && !user.googleId) missing.push("email verification");
    if (missing.length) {
      return NextResponse.json(
        { error: `Complete your profile first: ${missing.join(", ")}.` },
        { status: 400 },
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { verificationStatus: "PENDING", verificationRejectionReason: null },
    });
    return NextResponse.json({ success: true, status: "PENDING" });
  } catch (error) {
    console.error("Verification request error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}
