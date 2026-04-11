import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const keys = ["duty_rate", "platform_fee", "support_email"];

  try {
    for (const key of keys) {
      const val = formData.get(key)?.toString();
      if (val !== undefined) {
        await db.setting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val, description: `Global configuration for ${key}` },
        });
      }
    }
    return NextResponse.redirect(new URL("/admin/settings?saved=1", request.url));
  } catch (err) {
    console.error(err);
    return NextResponse.redirect(new URL("/admin/settings?error=1", request.url));
  }
}
