import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, ShieldCheck, MessageCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import DealerReviews from "@/components/DealerReviews";
import DealerInventory from "@/components/DealerInventory";

// Force dynamic and no-cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
  });

  if (!dealer) return { title: "Dealer Not Found" };

  return {
    title: `${dealer.name} | Verified Dealer`,
    description: `View inventory and reviews for ${dealer.name} on our platform.`,
  };
}

export default async function DealerPage(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
    include: {
      cars: {
        where: { available: true },
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: { user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dealer) {
    notFound();
  }

  const session = await getSession();
  const viewer = session?.user;

  // Check if viewing user has already reviewed
  const viewerReview = viewer ? dealer.reviews.find(r => r.userId === viewer.id) : null;

  const totalReviews = dealer.reviews.length;
  const averageRating = totalReviews > 0
    ? dealer.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
    : 0;
  const startedYear = new Date(dealer.createdAt).getFullYear();
  const mapsQuery = encodeURIComponent(
    [dealer.address || dealer.location, dealer.county, "Kenya"].filter(Boolean).join(", ")
  );
  const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const dealerRatingTags = [];
  if (totalReviews >= 8 && averageRating >= 4.5) {
    dealerRatingTags.push("Fair Pricing", "Clean Logbooks", "Good After-sales");
  } else if (totalReviews >= 3 && averageRating >= 4) {
    dealerRatingTags.push("Fair Pricing", "Smooth Process");
  } else if (totalReviews > 0) {
    dealerRatingTags.push("Rated by Buyers");
  }

  const whatsappNumber = dealer.whatsapp?.replace(/\D/g, "") || "";
  const whatsappPrefill = encodeURIComponent(
    `Hi, I'm viewing your showroom on MotorKE and I'd like to ask about your available cars.`
  );
  const whatsappChatHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappPrefill}`
    : null;

  // Contact links array
  const contactLinks = [];
  if (dealer.phone) {
    contactLinks.push({
      icon: <Phone className="w-4 h-4" />,
      label: "Call Us",
      href: `tel:${dealer.phone}`,
    });
  }
  if (dealer.whatsapp) {
    contactLinks.push({
      icon: <MessageCircle className="w-4 h-4" />,
      label: "WhatsApp",
      href: whatsappChatHref,
      external: true,
    });
  }
  if (dealer.website) {
    contactLinks.push({
      icon: <Globe className="w-4 h-4" />,
      label: "Website",
      href: dealer.website.startsWith('http') ? dealer.website : `https://${dealer.website}`,
      external: true,
    });
  }
  if (dealer.email) {
    contactLinks.push({
      icon: <Mail className="w-4 h-4" />,
      label: "Email",
      href: `mailto:${dealer.email}`,
    });
  }

  // Generate the gallery for the hero section
  const dealerGallery = dealer.cars
    .flatMap(c => c.images.map(i => ({ image: i.url, title: `${c.make} ${c.model}` })))
    .slice(0, 3);
  const hasHeroBanner = Boolean(dealer.bannerUrl) || dealerGallery.length >= 3;

  return (
    <div className="min-h-screen bg-[#fbfcfe] dark:bg-[#111111]">
      {/* 1. HERO COVER BANNER */}
      {hasHeroBanner && (
        <div className="w-full h-[240px] sm:h-[320px] lg:h-[400px] relative overflow-hidden bg-slate-900">
           {dealer.bannerUrl ? (
             <img
               src={dealer.bannerUrl}
               alt={`${dealer.name} banner`}
               className="absolute inset-0 h-full w-full object-cover opacity-80"
             />
           ) : (
             <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-70">
                {dealerGallery.slice(0, 3).map((car, i) => (
                  <div key={i} className="relative h-full w-full">
                    <Image src={car.image} alt={car.title} fill className="object-cover" />
                  </div>
                ))}
             </div>
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </div>
      )}

      {/* Adjust container based on presence of hero banner */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 pb-24 ${hasHeroBanner ? "-mt-24 sm:-mt-32 relative z-10" : "pt-8 sm:pt-12"}`}>
        
        {/* Dealership Info Card */}
        <section className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[140px_minmax(0,1fr)_auto] gap-6 sm:gap-8 lg:gap-12 items-start">
            
            {/* Logo */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-slate-100 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-black text-4xl sm:text-5xl overflow-hidden -mt-16 sm:-mt-20 shadow-md">
              {dealer.logoUrl ? (
                <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover" />
              ) : (
                dealer.name?.[0] || "D"
              )}
            </div>

            {/* Title & Details */}
            <div className="min-w-0 pt-2 lg:pt-0">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-times">{dealer.name}</h1>
                {dealer.verified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-700 border border-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Profile
                  </span>
                )}
              </div>

              <p className="text-slate-500 font-extrabold text-xs mb-5 flex items-center gap-2 uppercase tracking-[0.12em]">
                <MapPin className="w-4 h-4" /> {dealer.address || dealer.location}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Verification</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {dealer.verified ? "MotorKE Verified" : "Verification pending"}
                  </p>
                </div>

                <a
                  href={googleMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 hover:bg-slate-100 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-600 mb-1">Location</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">View on map →</p>
                </a>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600 mb-1">Operating since</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{startedYear}</p>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed max-w-3xl mb-6 font-medium">
                {dealer.description || `${dealer.name} maintains a curated selection of vehicles for buyers who want trusted listings, clear pricing, and direct contact with a real dealership team.`}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {contactLinks.length > 0 ? (
                  contactLinks.map((item) => {
                    const isWhatsApp = item.label === "WhatsApp";
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        className={isWhatsApp
                          ? "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                          : "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                        }
                      >
                        {item.icon} {item.label}
                      </a>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400">Contact info not available</p>
                )}
              </div>

              {whatsappChatHref && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Usually replies within 15 minutes
                </p>
              )}

              {dealerRatingTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {dealerRatingTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats Sidebar inside Header */}
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:border-l lg:border-slate-200 dark:border-slate-800 lg:pl-10 w-full pt-4 lg:pt-0">
              <div>
                <p className="text-slate-900 dark:text-white font-bold text-3xl leading-none">{dealer.cars.length}</p>
                <p className="text-xs text-slate-500 font-medium mt-2">Cars in stock</p>
              </div>
              <a href="#reviews" className="group block">
                <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold text-3xl leading-none group-hover:text-amber-600 transition-colors">
                   {averageRating > 0 ? averageRating.toFixed(1) : "—"} <span className="text-lg text-amber-500">★</span>
                </span>
                <p className="text-xs text-slate-500 font-medium mt-2 group-hover:text-slate-700 transition-colors">{totalReviews} {totalReviews === 1 ? "review" : "reviews"}</p>
              </a>
            </div>
          </div>
        </section>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 sm:gap-12">
          
          <div className="min-w-0">
            {/* 3. INLINE INVENTORY SEARCH & FILTERS */}
            <section className="mb-16">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Dealership Showroom</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">Explore all {dealer.cars.length} vehicles currently in stock</p>
                </div>
              </div>
              
              <DealerInventory cars={dealer.cars} dealerSlug={dealer.slug} />

            </section>

            {/* Reviews Section */}
            <section id="reviews">
              <DealerReviews
                dealerSlug={dealer.slug}
                dealerName={dealer.name}
                averageRating={averageRating}
                totalReviews={totalReviews}
                reviews={dealer.reviews}
                viewer={viewer}
                viewerReview={viewerReview}
              />
            </section>
          </div>

          <aside className="space-y-6 sm:space-y-8">
            {/* 4. INTERACTIVE LOCATION & BRANCH MAPS BOX */}
            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-6">Showroom Locations</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">Headquarters</h3>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-relaxed mb-1">{dealer.address || dealer.location}</p>
                    {dealer.county && <p className="text-[11px] font-black text-slate-400 tracking-wide">{dealer.county} County</p>}
                  </div>
                </div>

                {dealer.branches && dealer.branches.map((branch, i) => (
                  <div key={branch.id} className="flex gap-4 pt-6 border-t border-slate-100">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 flex items-center justify-center text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">{branch.name}</h3>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-relaxed">{branch.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 text-center pb-8 sm:pb-8 hidden lg:block">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-200 dark:border-slate-800 mb-4">
                 <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2">Buy with Confidence</h3>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Connect directly with the dealer. Motorke verified this partner's business details to ensure a safe shopping experience.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500 mb-5">Dealership Services</h2>
              <div className="space-y-3">
                {[
                  { name: "Trade-in Available", value: "Available on request" },
                  { name: "Bank Financing Partners", value: "Ask dealer for partner banks" },
                  { name: "Insurance Facilitation", value: "Paperwork support available" },
                ].map((item) => (
                  <div key={item.name} className="rounded-xl border border-slate-100 bg-slate-50 dark:bg-slate-900 px-3 py-3">
                    <p className="text-xs font-black text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[11px] font-bold text-slate-500 mt-1">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* 2. STICKY ACTION BAR (MOBILE UX) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transform transition-transform duration-300">
        <div className="flex gap-3 max-w-lg mx-auto">
           {contactLinks.map((item) => (
             <a
                key={item.label}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                className="flex-1 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.14em]"
             >
                {item.icon} {item.label}
             </a>
           ))}
           {contactLinks.length === 0 && (
             <span className="flex-1 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-[11px] font-black uppercase tracking-widest">
               No Contact Available
             </span>
           )}
        </div>
      </div>

      {whatsappChatHref && (
        <div className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-[60]">
          <a
            href={whatsappChatHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-emerald-900/20 hover:brightness-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with {dealer.name}
          </a>
        </div>
      )}

    </div>
  );
}
