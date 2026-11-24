// src/app/seller/page.js
export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { CarFront, Plus } from "lucide-react";
import MyListingRowActions from "@/components/MyListingRowActions";

export const metadata = { title: "My Listings | BIDGARI" };

const STATUS = {
  PENDING_REVIEW: { label: "In review", cls: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  APPROVED: { label: "Live", cls: "text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent-dim)]" },
  REJECTED: { label: "Not approved", cls: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
};

export default async function MyListingsPage({ searchParams }) {
  const user = await requireAuth();
  const sp = await searchParams;

  const listings = user.dealerId
    ? await db.car.findMany({
        where: { dealerId: user.dealerId },
        orderBy: { createdAt: "desc" },
        include: { images: { where: { isPrimary: true }, take: 1, select: { url: true } } },
      })
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] uppercase font-black tracking-[0.15em] text-dim mb-1">Seller workspace</p>
            <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight">My listings</h1>
          </div>
          <Link href="/sell/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> List a car
          </Link>
        </div>

        {sp?.created === "1" && (
          <div className="mb-8 border border-[var(--accent-dim)] bg-[var(--accent)]/10 rounded-2xl p-5 text-sm font-bold text-[var(--accent)]">
            Listing received — it&apos;s in the review queue. We&apos;ll publish it once a human signs off, usually within a day.
          </div>
        )}

        {listings.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-2xl">
            <CarFront size={32} className="mx-auto text-dim mb-4" />
            <p className="text-lg font-black text-text mb-2">Nothing listed yet.</p>
            <p className="text-sm text-muted mb-6">Private listings run for 30 days, then retire. You can re-list anytime.</p>
            <Link href="/sell/new" className="btn btn-dark btn-sm">List your car</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((car) => {
              const st = STATUS[car.listingStatus] || STATUS.APPROVED;
              const live = car.available && car.listingStatus === "APPROVED";
              return (
                <div key={car.id} className="flex gap-4 bg-surface border border-border rounded-2xl p-4 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={car.images[0]?.url || "/images/bidgari-logo-on-light.png"}
                    alt=""
                    className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-text truncate">
                        {car.year} {car.make} {car.model}
                      </p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${st.cls}`}>
                        {live ? "Live" : st.label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-muted mt-1">
                      KES {car.price.toLocaleString("en-KE")}
                      {car.mileage ? ` · ${car.mileage.toLocaleString("en-KE")} km` : ""}
                    </p>
                    {car.listingStatus === "REJECTED" && car.moderationNote && (
                      <p className="text-[11px] text-rose-400 mt-1">{car.moderationNote}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {live && car.publicSlug && (
                      <Link href={`/cars/${car.publicSlug}`} className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline">
                        View →
                      </Link>
                    )}
                    <MyListingRowActions carId={car.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
