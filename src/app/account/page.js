// src/app/account/page.js
export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AccountTabs from "@/components/AccountTabs";
import AvatarUpload from "@/components/AvatarUpload";
import { Heart, MessageSquare, ShieldCheck, User as UserIcon, Calendar, ArrowRight } from "lucide-react";

export const metadata = { title: "My Account | BIDGARI Digital Garage" };

export default async function AccountPage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireAuth();
  if (user.role === "ADMIN")  redirect("/admin");
  if (user.role === "DEALER") redirect("/");

  // Full profile fields (session carries only the basics).
  const profile = await db.user.findUnique({
    where: { id: user.id },
    select: {
      handle: true, bannerUrl: true, bio: true, whatsapp: true, locationLabel: true,
      publicProfile: true, verificationStatus: true, verificationRejectionReason: true,
    },
  });

  const tab = sp.tab || "profile";

  const buyerPhoneSetting = await db.setting.findUnique({
    where: { key: `buyer-phone:${user.id}` },
  });
  let buyerPhone = "";
  try {
    buyerPhone = JSON.parse(buyerPhoneSetting?.value || "{}")?.phone || "";
  } catch {}
  const phoneTail = buyerPhone.replace(/\D/g, "").slice(-9);

  const [savedCars, enquiries] = await Promise.all([
    db.savedCar.findMany({
      where:   { userId: user.id },
      include: {
        car: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            dealer: { select: { name: true, location: true, slug: true, verified: true, verificationStatus: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.findMany({
      where: {
        OR: [
          { userId: user.id },
          { email: { equals: user.email, mode: "insensitive" } },
          ...(phoneTail.length >= 9 ? [{ phone: { contains: phoneTail } }] : []),
        ],
      },
      include: {
        car:    { select: { id: true, publicSlug: true, make: true, model: true, year: true, price: true, engineCC: true, fuelType: true, available: true } },
        dealer: { select: { name: true, slug: true, phone: true, whatsapp: true } },
      },
      orderBy: { createdAt: "desc" },
      take:    50,
    }),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-16 max-w-4xl">
        
        {/* Header Section */}
        <header className="mb-6 sm:mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-6 mb-4 sm:mb-8">
            <div>
              <p className="hidden sm:block text-[11px] uppercase font-black tracking-[0.15em] text-dim uppercase tracking-widest mb-1 sm:mb-2">Personal Workspace</p>
              <h1 className="text-3xl sm:text-5xl font-bold text-text mb-0.5 sm:mb-1">Your Account</h1>
              <p className="text-[10px] sm:text-[11px] uppercase font-black tracking-[0.10em] text-muted font-medium">Manage your profile, saved cars, and inquiries</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase font-black tracking-[0.10em] sm:tracking-[0.15em] text-muted">
              <Calendar size={14} className="text-dim" />
              Member since {new Date(user.createdAt || Date.now()).getFullYear()}
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-surface p-4 sm:p-8 shadow-sm rounded-xl border border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex flex-col items-start gap-1">
                  <AvatarUpload
                    currentUrl={user.avatarUrl || ""}
                    userName={user.name}
                    size="md"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-dim">
                    Tap photo to update
                  </span>
                </div>
                
                <div className="sm:hidden flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-text">{user.name}</h2>
                  </div>
                  <p className="text-[10px] uppercase font-black tracking-[0.10em] text-muted">{user.email}</p>
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 w-full min-w-0">
                <div className="hidden sm:flex flex-row items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-text">{user.name}</h2>
                  {profile?.verificationStatus === "VERIFIED" && (
                    <span className="inline-flex items-center gap-1 bg-accent-wash text-accent px-2.5 py-1 rounded-none text-[11px] font-bold uppercase tracking-wider border border-[var(--accent-dim)]">
                      <ShieldCheck size={12} /> Verified
                    </span>
                  )}
                </div>
                <p className="hidden sm:block text-[11px] uppercase font-black tracking-[0.10em] text-muted mb-3">{user.email}</p>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-surface-hover rounded-none text-[10px] sm:text-[11px] uppercase font-black tracking-[0.10em] sm:tracking-[0.15em] text-muted border border-border">
                    <Heart size={14} className="text-red-500" />
                    {savedCars.length} Saved
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 bg-surface-hover rounded-none text-[10px] sm:text-[11px] uppercase font-black tracking-[0.10em] sm:tracking-[0.15em] text-muted border border-border">
                    <MessageSquare size={14} className="text-[var(--accent)]" />
                    {enquiries.length} Enquiries
                  </div>
                </div>
              </div>

              {/* Quick Link */}
              <a href="/cars" className="btn btn-dark w-full sm:w-auto">
                Browse <ArrowRight size={16} className="hidden sm:block" />
              </a>
            </div>
          </div>
        </header>

        {/* Tabbed Interface */}
        <div className="bg-surface rounded-xl overflow-hidden min-h-[600px] shadow-sm border border-border">
          <AccountTabs
            tab={tab}
            user={{
              id: user.id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl || null,
              bannerUrl: profile?.bannerUrl || null,
              lat: user.lat ?? null,
              lng: user.lng ?? null,
              phone: buyerPhone,
              handle: profile?.handle || null,
              bio: profile?.bio || "",
              whatsapp: profile?.whatsapp || "",
              locationLabel: profile?.locationLabel || "",
              publicProfile: profile?.publicProfile !== false,
              verificationStatus: profile?.verificationStatus || "UNVERIFIED",
              verificationRejectionReason: profile?.verificationRejectionReason || null,
            }}
            savedCars={savedCars.map(sc => ({
              savedId:   sc.id,
              savedAt:   sc.createdAt.toISOString(),
              id:        sc.car.id,
              publicSlug: sc.car.publicSlug,
              make:      sc.car.make,
              model:     sc.car.model,
              year:      sc.car.year,
              price:     sc.car.price,
              mileage:   sc.car.mileage,
              available: sc.car.available,
              image:     sc.car.images[0]?.url || null,
              dealer:    sc.car.dealer,
            }))}
            enquiries={enquiries.map(e => ({
              id:        e.id,
              message:   e.message,
              channel:   e.channel,
              createdAt: e.createdAt.toISOString(),
              car:       e.car,
              dealer:    e.dealer,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
