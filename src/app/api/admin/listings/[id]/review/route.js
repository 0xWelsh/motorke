import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { notifyListingPublished } from "@/lib/seo-indexing";

export const dynamic = "force-dynamic";

/** Body: { decision: "APPROVE" | "REJECT", note? } */
export async function POST(request, { params }) {
  await requireAdmin();
  const { id } = await params;
  const { decision, note } = await request.json().catch(() => ({}));

  const car = await db.car.findUnique({
    where: { id },
    select: { id: true, listingStatus: true, publicSlug: true, dealer: { select: { type: true } } },
  });  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (car.dealer?.type !== "PRIVATE") {
    return NextResponse.json({ error: "Only private self-listings go through this queue." }, { status: 400 });
  }

  if (decision === "APPROVE") {
    await db.car.update({
      where: { id },
      data: { listingStatus: "APPROVED", available: true, moderationNote: null },
    });
    notifyListingPublished({ id: car.id, publicSlug: car.publicSlug });
  } else if (decision === "REJECT") {
    await db.car.update({
      where: { id },
      data: {
        listingStatus: "REJECTED",
        available: false,
        moderationNote: String(note || "").slice(0, 500) || "Did not meet listing standards.",
      },
    });
  } else {
    return NextResponse.json({ error: "decision must be APPROVE or REJECT" }, { status: 400 });
  }

  revalidateTag("cars");
  revalidateTag("homepage");
  // Detail pages cache per listing — bust this one's negative cache now,
  // otherwise an early crawl of the preview URL sticks for an hour.
  for (const ref of [car.id, car.publicSlug].filter(Boolean)) {
    try { revalidateTag(`car-detail:${ref}`); } catch {}
  }
  return NextResponse.json({ success: true });
}
