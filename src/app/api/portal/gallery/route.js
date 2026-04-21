// src/app/api/portal/gallery/route.js
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "DEALER" || !session.user.dealerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const type = formData.get("type"); // 'image' or 'video'
  const url = formData.get("url");
  const caption = formData.get("caption") || null;

  if (!type || !url) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const media = await db.dealerGalleryMedia.create({
    data: {
      dealerId: session.user.dealerId,
      url,
      type,
      caption,
    },
  });

  return NextResponse.json({ success: true, media });
}
