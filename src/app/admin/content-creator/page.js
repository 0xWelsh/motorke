// src/app/admin/content-creator/page.js
// IG/TikTok content creator — pick a car, choose a style, generate a shareable video.
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import ContentCreatorClient from "@/components/admin/ContentCreatorClient";

export default async function ContentCreatorPage() {
  await requireAdmin();

  const cars = await db.car.findMany({
    where: { available: true },
    include: {
      images: { orderBy: { order: "asc" } },
      dealer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="min-h-screen bg-surface-hover p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-text mb-1">Content Creator</h1>
        <p className="text-sm text-muted mb-6">
          Generate IG Reels / TikTok videos from your inventory. Pick a car, choose a style, preview, and download.
        </p>
        <ContentCreatorClient cars={JSON.parse(JSON.stringify(cars))} />
      </div>
    </div>
  );
}
