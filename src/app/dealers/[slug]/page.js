// src/app/dealers/[slug]/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { formatPrice, formatMileage, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronRight, Globe, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { CompareButton } from "@/components/CompareSelector";
import DealerReviews from "@/components/DealerReviews";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dealer = await db.dealer.findUnique({ where: { slug } });
  if (!dealer) return {};
  return { title: `${dealer.name} — Motorke Kenya` };
}

export default async function DealerPage({ params }) {
  const { slug } = await params;
  const session = await getSession();

  const viewer = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role,
        dealerId: session.user.dealerId,
      }
    : null;

  const dealer = await db.dealer.findUnique({
    where:   { slug },
    include: {
      users: { select: { name: true, avatarUrl: true, email: true }, take: 1 },
      branches: { select: { id: true, name: true, location: true }, orderBy: { createdAt: "asc" } },
      reviews: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      cars: {
        where:   { available: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!dealer) notFound();

  const [reviewStats, viewerReview] = await Promise.all([
    db.dealerReview.aggregate({
      where: { dealerId: dealer.id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    viewer
      ? db.dealerReview.findUnique({
          where: {
            dealerId_userId: {
              dealerId: dealer.id,
              userId: viewer.id,
            },
          },
          select: { rating: true, comment: true },
        })
      : Promise.resolve(null),
  ]);

  const makes = [...new Set(dealer.cars.map((c) => c.make))];
  const primaryUser = dealer.users?.[0] || null;
  const brandImage = dealer.logoUrl || primaryUser?.avatarUrl || null;
  const dealerGallery = dealer.cars
    .filter((entry) => entry.images?.[0]?.url)
    .map((entry) => ({
      id: entry.id,
      title: `${entry.year} ${entry.make} ${entry.model}${entry.variant ? ` ${entry.variant}` : ""}`,
      image: entry.images[0]?.url,
      price: entry.price,
    }))
    .slice(0, 18);
  const contactLinks = [
    dealer.phone ? { href: `tel:${dealer.phone}`, label: "Call", icon: <Phone className="w-4 h-4" /> } : null,
    dealer.whatsapp ? { href: `https://wa.me/${dealer.whatsapp}`, label: "WhatsApp", icon: <MessageCircle className="w-4 h-4" />, external: true } : null,
    dealer.email ? { href: `mailto:${dealer.email}`, label: "Email", icon: <Mail className="w-4 h-4" /> } : null,
    dealer.website ? { href: dealer.website, label: "Website", icon: <Globe className="w-4 h-4" />, external: true } : null,
  ].filter(Boolean);
  const averageRating = Number(reviewStats._avg.rating || 0);
  const totalReviews = reviewStats._count._all;
  const reviewItems = dealer.reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    user: review.user,
  }));

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 sm:py-12">
        <section className="pb-10 border-b border-[#e8e2d9]">
          <div className="grid grid-cols-1 lg:grid-cols-[112px_minmax(0,1fr)_220px] gap-5 sm:gap-7 lg:gap-10 items-start">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-[#faf7f2] border border-[#ece6dd] text-slate-900 flex items-center justify-center font-black text-4xl sm:text-5xl overflow-hidden">
              {brandImage ? (
                <img src={brandImage} alt={dealer.name} className="w-full h-full object-cover" />
              ) : (
                dealer.name[0]
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-2xl sm:text-4xl md:text-5xl text-slate-900 tracking-tight">{dealer.name}</h1>
                {dealer.verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>

              <p className="text-slate-500 font-bold text-xs mb-4 flex items-center gap-2 uppercase tracking-[0.12em]">
                <MapPin className="w-3.5 h-3.5" /> {dealer.address || dealer.location}
              </p>

              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-3xl mb-5 sm:mb-6">
                {dealer.description || `${dealer.name} maintains a curated selection of vehicles for buyers who want trusted listings, clear pricing, and direct contact with a real dealership team.`}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-5 gap-y-2">
                {contactLinks.length > 0 ? (
                  contactLinks.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {item.icon} {item.label}
                    </a>
                  ))
                ) : (
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Public contact details not added yet</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:border-l lg:border-[#ece6dd] lg:pl-8">
              {[
                { label: "Live Cars", value: dealer.cars.length },
                { label: "Brands", value: makes.length },
                { label: "County", value: dealer.county || "N/A" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-extrabold mb-1">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-900 leading-none">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 border-b border-[#e8e2d9]">
          <article className="lg:col-span-2">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-3">Dealer Identity</p>
            <h2 className="text-2xl md:text-3xl text-slate-900 tracking-tight mb-3">Why buyers trust {dealer.name}</h2>
            <p className="text-slate-600 leading-relaxed mb-6 max-w-3xl">
              {dealer.description || `${dealer.name} runs a focused showroom experience with direct communication channels, clear inventory availability, and a buyer-first approach to follow-up.`}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-6">
              {dealer.verified && <span className="text-emerald-700">Verified Showroom</span>}
              <span>{dealer.cars.length} Active Listings</span>
              <span>{new Date(dealer.createdAt).getFullYear()} Joined</span>
              {dealer.branches.length > 0 && <span>{dealer.branches.length + 1} Locations</span>}
            </div>

            {dealer.branches.length > 0 && (
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-2">Additional Branches</p>
                <ul className="divide-y divide-[#ece6dd] border-y border-[#ece6dd]">
                  {dealer.branches.map((branch) => (
                    <li key={branch.id} className="py-3 flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-slate-900">{branch.name}</p>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{branch.location}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>

          <aside>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-4">Primary Contact</p>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-[#faf7f2] border border-[#ece6dd] overflow-hidden flex items-center justify-center text-2xl font-black text-slate-900">
                {primaryUser?.avatarUrl ? (
                  <img src={primaryUser.avatarUrl} alt={primaryUser.name || dealer.name} className="w-full h-full object-cover" />
                ) : (
                  (primaryUser?.name || dealer.name)[0]
                )}
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 leading-tight">{primaryUser?.name || `${dealer.name} Team`}</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Dealer Representative</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Reach the dealership for availability checks, viewing schedules, and negotiation details.
            </p>

            <div className="space-y-2">
              {contactLinks.slice(0, 3).map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {item.icon} {item.label}
                </a>
              ))}
            </div>
          </aside>
        </section>

        <section className="py-10 border-b border-[#ece6dd]">
          <DealerReviews
            dealerSlug={dealer.slug}
            dealerName={dealer.name}
            averageRating={averageRating}
            totalReviews={totalReviews}
            reviews={reviewItems}
            viewer={viewer}
            viewerReview={viewerReview}
          />
        </section>

        {makes.length > 0 && (
          <div className="py-8 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
            {makes.map((make) => (
              <span key={make}>{make}</span>
            ))}
          </div>
        )}

        {dealerGallery.length > 0 && (
          <section id="dealer-gallery" className="scroll-mt-28 py-2 pb-10 border-b border-[#ece6dd]">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4 mb-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-2">Dealer Gallery</p>
                <h2 className="text-2xl sm:text-3xl text-slate-900 tracking-tight">Inside {dealer.name}</h2>
              </div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{dealerGallery.length} showcase photos</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {dealerGallery.map((item) => (
                <Link key={item.id} href={`/cars/${item.id}`} className="group block rounded-2xl border border-[#ece6dd] overflow-hidden bg-white">
                  <div className="relative aspect-[4/3] bg-slate-50">
                    <Image src={item.image} alt={item.title} fill className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 16vw" />
                  </div>
                  <div className="px-2.5 py-2.5">
                    <p className="text-[10px] font-extrabold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">{formatPrice(item.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="pt-2 pb-10">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-2">Inventory</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl text-slate-900 tracking-tight">Current Listings</h2>
            </div>
            <Link href="/cars" className="hidden sm:inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600 hover:text-black transition-colors">
              View All Cars <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {dealer.cars.length === 0 ? (
            <div className="border-y border-[#e7e1d8] py-16 text-center">
              <p className="text-slate-400 text-sm font-extrabold uppercase tracking-[0.14em]">No active listings yet</p>
            </div>
          ) : (
            <div className="border-y border-[#ece6dd] divide-y divide-[#ece6dd]">
              {dealer.cars.map((car) => {
                const img = car.images[0]?.url;
                const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
                const specs = [
                  car.year,
                  car.fuelType && FUEL_LABELS[car.fuelType],
                  car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission,
                  car.mileage ? formatMileage(car.mileage) : null,
                ].filter(Boolean);

                const compareCar = {
                  ...car,
                  image: img,
                  model: `${car.make} ${car.model}`,
                };

                return (
                  <article key={car.id} className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)_170px] gap-4 md:gap-5 items-start">
                      <Link href={`/cars/${car.id}`} className="relative aspect-[16/10] bg-slate-50 overflow-hidden border border-[#ece6dd]">
                        {img ? (
                          <Image
                            src={img}
                            alt={title}
                            fill
                            className="w-full h-full object-cover"
                            sizes="(max-width: 768px) 100vw, 220px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Image</div>
                        )}

                        {car.badges?.length > 0 && (
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            {car.badges.slice(0, 2).map((b) => (
                              <span key={b} className={`text-[9px] font-extrabold px-2 py-1 rounded-full ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-slate-700"}`}>
                                {b}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <Link href={`/cars/${car.id}`}>
                          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight mb-2 hover:text-black transition-colors">{title}</h3>
                        </Link>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500 mb-4">
                          {specs.map((s) => (
                            <span key={s}>{s}</span>
                          ))}
                        </div>

                        <div className="w-full [&>button]:w-full md:[&>button]:w-auto [&>button]:justify-center">
                          <CompareButton car={compareCar} />
                        </div>
                        {dealerGallery.length > 0 && (
                          <div className="mt-2">
                            <Link href={`/dealers/${dealer.slug}#dealer-gallery`} className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-600 hover:text-black transition-colors">
                              View Dealer Gallery <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between md:block md:text-right">
                        <p className="text-2xl font-bold text-slate-900 md:mb-3">{formatPrice(car.price)}</p>
                        <Link href={`/cars/${car.id}`} className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-600 hover:text-black transition-colors">
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
