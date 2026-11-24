// src/app/admin/listings/page.js
export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ShieldCheck, ClipboardList, ExternalLink } from "lucide-react";
import ListingReviewActions from "@/components/admin/ListingReviewActions";
import { handleFromDealerSlug } from "@/lib/private-seller";

export const metadata = { title: "Listing Review | BIDGARI Admin" };

export default async function AdminListingsPage() {
  await requireAdmin();

  const [pending, recent] = await Promise.all([
    db.car.findMany({
      where: { listingStatus: "PENDING_REVIEW" },
      include: {
        images: { orderBy: { order: "asc" }, take: 8, select: { url: true } },
        dealer: { select: { name: true, slug: true, phone: true, location: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.car.findMany({
      where: { listingStatus: { in: ["APPROVED", "REJECTED"] } },
      include: { dealer: { select: { name: true, slug: true } } },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-xl bg-[var(--accent)] animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary">Private Listings</span>
      </div>
      <h1 className="text-4xl font-black text-text tracking-tight mb-2">
        Listing Review <span className="text-muted font-medium ml-3">/ {pending.length} pending</span>
      </h1>
      <p className="text-sm text-muted mb-10">
        Self-service listings from verified private sellers. Nothing here is public until you approve it.
      </p>

      {pending.length === 0 ? (
        <div className="py-24 text-center bg-[#1c1c1c] border border-white/[0.08] rounded-xl">
          <ClipboardList size={32} className="text-muted mx-auto mb-4" />
          <p className="text-lg font-black text-text uppercase tracking-tight">Queue Clear</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted mt-2">No private listings waiting.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.map((car) => (
            <div key={car.id} className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Photos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 lg:w-[420px]">
                  {car.images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={img.url} src={img.url} alt="" className={`w-full ${i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"} object-cover rounded-lg`} />
                  ))}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-xl font-black text-text tracking-tight">
                      {car.year} {car.make} {car.model} {car.variant || ""}
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent-dim)] px-2 py-0.5 rounded-full">
                      KES {car.price.toLocaleString("en-KE")}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted mb-4">
                    Seller:{" "}
                    {(() => {
                      const h = handleFromDealerSlug(car.dealer.slug);
                      return h ? (
                        <Link href={`/u/${h}`} className="text-secondary hover:text-text inline-flex items-center gap-1">
                          {car.dealer.name} <ExternalLink size={11} />
                        </Link>
                      ) : (
                        <span className="text-secondary">{car.dealer.name}</span>
                      );
                    })()}
                    {" · "}{car.dealer.phone || "no phone"}
                    {car.publicSlug && (
                      <>
                        {" · "}
                        <a href={`/cars/${car.publicSlug}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] inline-flex items-center gap-1">
                          preview <ExternalLink size={11} />
                        </a>
                      </>
                    )}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs text-muted mb-4">
                    <span>Mileage: <b className="text-secondary">{car.mileage ? `${car.mileage.toLocaleString("en-KE")} km` : "—"}</b></span>
                    <span>Fuel: <b className="text-secondary">{car.fuelType}</b></span>
                    <span>Trans: <b className="text-secondary">{car.transmission}</b></span>
                    <span>CC: <b className="text-secondary">{car.engineCC || "—"}</b></span>
                    <span>Color: <b className="text-secondary">{car.color || "—"}</b></span>
                    <span>Body: <b className="text-secondary">{car.bodyType}</b></span>
                    <span>Drive: <b className="text-secondary">{car.drivetrain}</b></span>
                    <span>Submitted: <b className="text-secondary">{new Date(car.createdAt).toLocaleDateString("en-KE")}</b></span>
                  </div>

                  {car.description && (
                    <p className="text-sm text-secondary leading-relaxed whitespace-pre-line mb-4 max-h-32 overflow-auto border-l-2 border-white/10 pl-3">
                      {car.description}
                    </p>
                  )}

                  <ListingReviewActions carId={car.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-14">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-secondary mb-4 flex items-center gap-2">
            <ShieldCheck size={14} /> Recently decided
          </h2>
          <div className="bg-[#1c1c1c] border border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <tbody>
                {recent.map((car) => (
                  <tr key={car.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-3 text-sm text-text font-bold">
                      {car.year} {car.make} {car.model}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">{car.dealer.name}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${car.listingStatus === "APPROVED" ? "text-[var(--accent)]" : "text-rose-400"}`}>
                        {car.listingStatus}
                      </span>
                      <span className="block text-[10px] text-dim mt-0.5">{new Date(car.updatedAt).toLocaleDateString("en-KE")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
