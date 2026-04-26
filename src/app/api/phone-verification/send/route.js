import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { isValidKenyanPhone, normalizeKenyanPhone, sendOtpSms } from "@/lib/phone-verification";

const OTP_EXPIRES_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

export async function POST(request) {
  try {
    const session = await getSessionFromRequest();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const normalized = normalizeKenyanPhone(body?.phone);
    if (!isValidKenyanPhone(normalized)) {
      return Response.json({ error: "Use a valid Kenyan phone number" }, { status: 400 });
    }

    const cooldownKey = `phone-otp-cooldown:${session.user.id}`;
    const cooldown = await db.setting.findUnique({ where: { key: cooldownKey } });
    if (cooldown?.value) {
      const parsed = JSON.parse(cooldown.value);
      const lastSentAt = parsed?.lastSentAt ? new Date(parsed.lastSentAt).getTime() : 0;
      const secondsSince = Math.floor((Date.now() - lastSentAt) / 1000);
      if (secondsSince < RESEND_COOLDOWN_SECONDS) {
        return Response.json(
          { error: `Please wait ${RESEND_COOLDOWN_SECONDS - secondsSince}s before requesting another code.` },
          { status: 429 }
        );
      }
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const identifier = `phone-otp:${session.user.id}:${normalized}`;
    const expires = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    await db.verificationToken.deleteMany({ where: { identifier } });
    await db.verificationToken.create({
      data: { identifier, token: code, expires },
    });

    await sendOtpSms({ phone: normalized, code });

    await db.setting.upsert({
      where: { key: cooldownKey },
      create: {
        key: cooldownKey,
        value: JSON.stringify({ phone: normalized, lastSentAt: new Date().toISOString() }),
        description: "Phone OTP resend cooldown",
      },
      update: { value: JSON.stringify({ phone: normalized, lastSentAt: new Date().toISOString() }) },
    });

    return Response.json({ success: true, expiresAt: expires.toISOString() });
  } catch (error) {
    console.error("Phone OTP send failed:", error);
    return Response.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}
