export const dynamic = "force-dynamic";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ email: session.user.email, role: session.user.role });
}
