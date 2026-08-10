import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FAKE_EMAIL_RE =
  /^[a-z]+\d+@(gmail|yahoo|outlook|icloud|proton)\.me$/;
const FAKE_PHONE_RE =
  /^(0700|0711|0722|0733|0743|0757|0777|0789|0799|0100|0110|0111)\d{6}$/;

function isFakeLead(lead) {
  const email = (lead.email || "").toLowerCase().trim();
  const phone = (lead.phone || "").trim();
  return FAKE_EMAIL_RE.test(email) && FAKE_PHONE_RE.test(phone);
}

async function purge() {
  const leads = await db.lead.findMany({ select: { id: true, email: true, phone: true } });
  const fakeIds = leads.filter(isFakeLead).map((l) => l.id);

  if (fakeIds.length === 0) {
    return NextResponse.json({ ok: true, removed: 0, message: "No fake leads found." });
  }

  await db.leadNote.deleteMany({ where: { leadId: { in: fakeIds } } });
  const { count } = await db.lead.deleteMany({ where: { id: { in: fakeIds } } });

  return NextResponse.json({ ok: true, removed: count, message: `Removed ${count} generated lead(s).` });
}

export async function GET() {
  await requireAdmin();
  return purge();
}

export async function POST() {
  await requireAdmin();
  return purge();
}

