import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { isValidKenyanPhone, normalizeKenyanPhone } from "@/lib/phone-verification";

export async function POST(request) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const normalized = normalizeKenyanPhone(body?.phone);
    const code = String(body?.code || "").trim();
    if (!isValidKenyanPhone(normalized) || !/^\d{6}$/.test(code)) {
      return Response.json({ error: "Invalid phone or verification code." }, { status: 400 });
    }

    const identifier = `phone-otp:${session.user.id}:${normalized}`;
    const token = await db.verificationToken.findFirst({
      where: {
        identifier,
        token: code,
        expires: { gt: new Date() },
      },
    });
    if (!token) {
      return Response.json({ error: "Code expired or incorrect." }, { status: 400 });
    }

    await db.verificationToken.deleteMany({ where: { identifier } });

    const verifiedKey = `phone-verified:${session.user.id}`;
    await db.setting.upsert({
      where: { key: verifiedKey },
      create: {
        key: verifiedKey,
        value: JSON.stringify({ phone: normalized, verifiedAt: new Date().toISOString() }),
        description: "User phone verification status",
      },
      update: { value: JSON.stringify({ phone: normalized, verifiedAt: new Date().toISOString() }) },
    });

    return Response.json({ success: true, phone: normalized });
  } catch (error) {
    console.error("Phone verification failed:", error);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
