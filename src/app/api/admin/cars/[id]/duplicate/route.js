export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { NextResponse } from "next/server";
import { revalidateInventoryForCar } from "@/lib/revalidate-inventory";

export async function POST(request, { params }) {
  const { id } = await params;
  const session = await getSessionFromRequest();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const source = await db.car.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } } },
  });
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const {
    id: _id, images: _images, publicSlug: _slug, available: _avail,
    views: _views, printCount: _pc, whatsappClicks: _wc,
    featured: _feat, featuredWeight: _fw, spotlightUntil: _su, hotBadgeUntil: _hu,
    soldAt: _sa, createdAt: _ca, updatedAt: _ua, dealerId, branchId,
    leads: _leads, carViews: _cv, reviews: _rev, savedBy: _sb, boostEvents: _be,
    ...rest
  } = source;

  const car = await db.car.create({
    data: {
      ...rest,
      dealerId,
      branchId,
      available: true,
      views: 0,
      printCount: 0,
      whatsappClicks: 0,
      featured: false,
      featuredWeight: 0,
      variant: source.variant ? `${source.variant} (Copy)` : null,
      images: {
        create: source.images.map((img) => ({
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
      },
    },
  });

  await revalidateInventoryForCar(car.id, { refreshHomepage: true });

  return NextResponse.redirect(new URL(request.headers.get("referer") || "/admin/cars", request.url));
}
