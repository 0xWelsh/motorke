import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { normalizeKenyanPhone } from "@/lib/phone-verification";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetPhone = normalizeKenyanPhone(searchParams.get("phone") || "");
    const key = `phone-verified:${session.user.id}`;
    const setting = await db.setting.findUnique({ where: { key } });
    if (!setting?.value) {
      return Response.json({ verified: false });
    }
    let parsed = {};
    try {
      parsed = JSON.parse(setting.value);
    } catch {}
    const verifiedPhone = normalizeKenyanPhone(parsed?.phone || "");
    const isMatch = targetPhone ? verifiedPhone === targetPhone : Boolean(verifiedPhone);
    return Response.json({
      verified: Boolean(parsed?.verifiedAt) && isMatch,
      phone: verifiedPhone || null,
      verifiedAt: parsed?.verifiedAt || null,
    });
  } catch (error) {
    console.error("Phone verification status failed:", error);
    return Response.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
