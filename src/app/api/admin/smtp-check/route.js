export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { verifySmtpTransport } from "@/lib/mail";

/** Admin-only: test SMTP credentials (does not send an email). */
export async function GET() {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const result = await verifySmtpTransport();
  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    ...result,
    hint:
      result.ok === false &&
      result.configured &&
      /535|authentication|invalid credentials|login/i.test(result.message || "")
        ? 'Zoho: generate an Application-Specific Password and set SMTP_PASS. MAIL_FROM_* "From" address must match SMTP_USER or a Zoho-allowed alias.'
        : result.ok === false && result.configured
          ? "If SMTP login succeeds locally but signup still fails, check that MAIL_FROM_VERIFICATION matches the mailbox you send as (Zoho rejects mismatched From)."
          : undefined,
  });
}
