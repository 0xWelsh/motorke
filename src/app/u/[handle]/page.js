// src/app/u/[handle]/page.js
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import CarCard from "@/components/CarCard";
import {
  CalendarDays,
  MapPin,
  MessageCircle,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

async function getSellerCars(dealerId) {
  if (!dealerId) return [];
  return db.car.findMany({
    where: { dealerId, available: true },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 2 },
      dealer: { select: { name: true, slug: true, verified: true, location: true, county: true, type: true } },
    },
  });
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const user = await db.user.findFirst({
    where: { handle: handle.toLowerCase(), active: true, publicProfile: true },
    select: { name: true, bio: true, avatarUrl: true, verificationStatus: true, dealerId: true },
  });
  if (!user) return { title: "Profile not found" };
  const listingCount = user.dealerId
    ? await db.car.count({ where: { dealerId: user.dealerId, available: true } })
    : 0;
  return {
    title: user.name,
    description: user.bio || `${user.name} on BIDGARI — Kenya's calmer car marketplace.`,
    openGraph: {
      title: `${user.name} — BIDGARI`,
      description: user.bio || undefined,
      images: user.avatarUrl ? [user.avatarUrl] : undefined,
      type: "profile",
    },
    // Indexable once there is real inventory behind the page; thin profiles stay out.
    robots: listingCount > 0 ? { index: true, follow: true } : { index: false, follow: true },
  };
}

function waHref(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 9) return null;
  const intl = digits.startsWith("0") ? `254${digits.slice(1)}` : digits;
  return `https://wa.me/${intl}`;
}

export default async function UserPublicProfilePage({ params }) {
  const { handle } = await params;
  const user = await db.user.findFirst({
    where: { handle: handle.toLowerCase(), active: true, publicProfile: true },
    select: {
      id: true, name: true, handle: true, bio: true, avatarUrl: true, bannerUrl: true,
      locationLabel: true, phone: true, whatsapp: true, createdAt: true,
      verificationStatus: true, verifiedAt: true, dealerId: true,
    },
  });
  if (!user) notFound();

  const cars = await getSellerCars(user.dealerId);

  const verified = user.verificationStatus === "VERIFIED";
  const joined = user.createdAt.toLocaleDateString("en-KE", { month: "long", year: "numeric" });
  const contact = waHref(user.whatsapp || user.phone);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Banner */}
      <div className="relative h-44 sm:h-64 md:h-80 w-full overflow-hidden bg-surface-hover">
        {user.bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Identity */}
        <div className="flex items-end gap-4 -mt-12 sm:-mt-16 relative z-10">
          <div
            className={`relative shrink-0 w-24 h-24 sm:w-32 sm:h-32 p-[3px] ${
              verified
                ? "bg-gradient-to-br from-[#22c55e] via-[#16a34a] to-emerald-700 shadow-[0_0_28px_-8px_rgba(34,197,94,0.6)]"
                : "bg-white/10"
            }`}
            style={{ borderRadius: "20px" }}
          >
            <div className="w-full h-full bg-[#141414] rounded-[17px] overflow-hidden flex items-center justify-center">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12 text-zinc-500" />
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 pb-16">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{user.name}</h1>
            {verified && (
              <span className="inline-flex items-center gap-1 bg-[#22c55e]/15 text-[var(--accent)] border border-[#22c55e]/40 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]" style={{ borderRadius: "999px" }}>
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/50">
            @{user.handle}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-[0.1em] text-white/70">
            {user.locationLabel && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[var(--accent)]" /> {user.locationLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-[var(--accent)]" /> Member since {joined}
            </span>
            {verified && user.verifiedAt && (
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[var(--accent)]" />
                Verified {user.verifiedAt.toLocaleDateString("en-KE", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>

          {user.bio && (
            <p className="mt-5 text-[15px] leading-relaxed text-white/85 max-w-prose">{user.bio}</p>
          )}

          {contact && (
            <a
              href={contact}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm mt-7 inline-flex"
            >
              <MessageCircle size={14} /> Message on WhatsApp
            </a>
          )}

          {/* Listings */}
          <div className="mt-10 border-t border-white/10 pt-6">
            <h2 className="text-xs font-black uppercase tracking-[0.14em] text-white/60">
              {cars.length > 0 ? `Cars for sale (${cars.length})` : "Listings"}
            </h2>
            {cars.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {cars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/45">
                No public listings yet. Selling your car through BIDGARI is coming soon —{" "}
                <Link href="/sell" className="text-[var(--accent)] hover:underline">
                  tell us what you have
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
