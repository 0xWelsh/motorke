import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, ShieldCheck, MessageCircle, Star, Clock3, CarFront, Activity, CalendarDays } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { getSession } from "@/lib/auth";
import DealerReviews from "@/components/DealerReviews";
import DealerInventory from "@/components/DealerInventory";
import { calculateDistance } from "@/lib/geolocation";
import { absoluteUrl, BRAND_OG_IMAGE } from "@/lib/site-url";

// Force dynamic and no-cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

function withProtocol(url) {
  if (!url) return null;
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

export async function generateMetadata(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      description: true,
      county: true,
      location: true,
      bannerUrl: true,
      logoUrl: true,
    },
  });

  if (!dealer) return { title: "Dealer Not Found" };

  const place = dealer.location || dealer.county || "Kenya";
  const title = `${dealer.name} — dealer showroom in ${place}`;
  const description =
    (dealer.description && dealer.description.trim().slice(0, 158)) ||
    `View live inventory and reviews for ${dealer.name} in ${place}. Contact the dealer on Welsh Motorhub.`;

  const ogCand = dealer.bannerUrl || dealer.logoUrl;
  const ogImage = ogCand
    ? /^https?:\/\//i.test(ogCand)
      ? ogCand
      : absoluteUrl(ogCand.startsWith("/") ? ogCand : `/${ogCand}`)
    : absoluteUrl(BRAND_OG_IMAGE);

  const canonical = `/dealers/${dealer.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: "Welsh Motorhub",
      locale: "en_KE",
      images: [{ url: ogImage }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function DealerPage(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
    include: {
      cars: {
        where: { available: true },
        select: {
          id: true,
          make: true,
          model: true,
          variant: true,
          year: true,
          price: true,
          engineCC: true,
          mileage: true,
          bodyType: true,
          fuelType: true,
          transmission: true,
          featured: true,
          badges: true,
          description: true,
          available: true,
          steering: true,
          horsepower: true,
          torque: true,
          cylinders: true,
          turbo: true,
          updatedAt: true,
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
  const soldCarsCount = await db.lead.count({
    where: { dealerId: dealer.id, status: "SOLD" },
  });

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
  const userLat = Number.isFinite(viewer?.lat) ? viewer.lat : null;
  const userLng = Number.isFinite(viewer?.lng) ? viewer.lng : null;
  const dealerLat = Number.isFinite(dealer?.lat) ? dealer.lat : null;
  const dealerLng = Number.isFinite(dealer?.lng) ? dealer.lng : null;
  const dealerDistanceKm =
    userLat != null && userLng != null && dealerLat != null && dealerLng != null
      ? calculateDistance(userLat, userLng, dealerLat, dealerLng)
      : null;
  const dealerDistanceLabel =
    dealerDistanceKm == null
      ? null
      : dealerDistanceKm < 1
        ? `${Math.round(dealerDistanceKm * 1000)} m away`
        : `${dealerDistanceKm.toFixed(1)} km away`;
  const inventoryWithDistance = dealer.cars.map((car) => ({
    ...car,
    distance: dealerDistanceKm,
  }));
  const latestInventoryUpdate =
    dealer.cars.length > 0
      ? new Date(Math.max(...dealer.cars.map((car) => new Date(car.updatedAt).getTime())))
      : null;
  const inventoryFreshnessDays = latestInventoryUpdate
    ? Math.max(0, Math.floor((Date.now() - latestInventoryUpdate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const inventoryFreshnessLabel =
    inventoryFreshnessDays == null ? null : `${inventoryFreshnessDays} day${inventoryFreshnessDays === 1 ? "" : "s"} ago`;
  const yearsActive = Math.max(1, new Date().getFullYear() - startedYear + 1);
  const isActiveToday = inventoryFreshnessDays != null && inventoryFreshnessDays <= 0;
  const lastActiveLabel = isActiveToday
    ? "Active today"
    : inventoryFreshnessDays == null
      ? "Activity unavailable"
      : `Active ${inventoryFreshnessLabel}`;
  const responseLabel = dealer.whatsapp
    ? "Replies fastest on WhatsApp"
    : dealer.phone
      ? "Replies by direct call"
      : "Replies via enquiry form";
  const heroTrustStats = [
    {
      label: "Buyer rating",
      value: totalReviews > 0 ? `${averageRating.toFixed(1)} / 5` : "Not rated",
      sub: `${totalReviews} review${totalReviews === 1 ? "" : "s"}`,
      icon: <Star className="w-4 h-4 text-amber-500" />,
    },
    {
      label: "Cars sold",
      value: soldCarsCount > 0 ? soldCarsCount.toLocaleString("en-KE") : "—",
      sub: "Closed through enquiries",
      icon: <CarFront className="w-4 h-4 text-[#38A169]" />,
    },
    {
      label: "Response",
      value: responseLabel,
      sub: "Contact channel",
      icon: <Clock3 className="w-4 h-4 text-sky-500" />,
    },
    {
      label: "Years active",
      value: `${yearsActive} year${yearsActive === 1 ? "" : "s"}`,
      sub: `Member since ${startedYear}`,
      icon: <CalendarDays className="w-4 h-4 text-violet-500" />,
    },
    {
      label: "Location",
      value: dealer.location || dealer.county || "Kenya",
      sub: "Dealership base",
      icon: <MapPin className="w-4 h-4 text-rose-500" />,
    },
    {
      label: "Status",
      value: lastActiveLabel,
      sub: "Inventory signal",
      icon: <Activity className={`w-4 h-4 ${isActiveToday ? "text-[#38A169]" : "text-slate-400"}`} />,
    },
  ];
  const heroQuickStats = [
    {
      label: "Vehicles in stock",
      value: `${dealer.cars.length}+`,
    },
    {
      label: "Years active",
      value: `${yearsActive}+ years`,
    },
    {
      label: "Happy buyers",
      value: totalReviews > 0 ? `${totalReviews.toLocaleString("en-KE")} reviews` : "Building reviews",
    },
    {
      label: "Verified status",
      value: dealer.verified ? "100% verified dealer" : "Verification in progress",
    },
  ];
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
      href: withProtocol(dealer.website),
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

  const socialLinks = [
    { key: "instagram", label: "Instagram", href: withProtocol(dealer.instagramUrl), icon: <SiInstagram className="w-3.5 h-3.5" style={{ color: "#E4405F" }} /> },
    { key: "facebook", label: "Facebook", href: withProtocol(dealer.facebookUrl), icon: <SiFacebook className="w-3.5 h-3.5" style={{ color: "#1877F2" }} /> },
    { key: "tiktok", label: "TikTok", href: withProtocol(dealer.tiktokUrl), icon: <SiTiktok className="w-3.5 h-3.5 text-slate-900 dark:text-white" /> },
  ].filter((item) => Boolean(item.href));

  // Generate the gallery for the hero section
  const dealerGallery = dealer.cars
    .flatMap(c => c.images.map(i => ({ image: i.url, title: `${c.make} ${c.model}` })))
    .slice(0, 3);
  const recentShowcaseCars = dealer.cars
    .filter((car) => Boolean(car.images?.[0]?.url))
    .slice(0, 4)
    .map((car) => ({
      id: car.id,
      title: `${car.year} ${car.make} ${car.model}`.trim(),
      image: car.images[0].url,
      price: car.price,
    }));
  const hasHeroBanner = Boolean(dealer.bannerUrl) || dealerGallery.length >= 3;

  const absAsset = (u) => {
    if (!u) return absoluteUrl("/headerlogo.png");
    if (/^https?:\/\//i.test(u)) return u;
    return absoluteUrl(u.startsWith("/") ? u : `/${u}`);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.name,
    url: absoluteUrl(`/dealers/${dealer.slug}`),
    image: absAsset(dealer.logoUrl),
    address: {
      "@type": "PostalAddress",
      addressLocality: dealer.location,
      addressRegion: dealer.county,
      addressCountry: "KE",
    },
    telephone: dealer.phone || dealer.whatsapp || undefined,
  };

  return (
    <div className="bg-gradient-to-b from-[#f8fafc] via-white to-white dark:from-[#080808] dark:via-[#0a0a0a] dark:to-[#0a0a0a] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Banner */}
      <div className="w-full h-[210px] sm:h-[260px] lg:h-[300px] relative bg-[#111827] overflow-hidden">
         {dealer.bannerUrl ? (
           <img
             src={dealer.bannerUrl}
             alt={dealer.name}
             className="absolute inset-0 w-full h-full object-cover opacity-[0.86] sm:opacity-65"
           />
         ) : (
           <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-72 sm:opacity-40">
              {dealerGallery.map((car, i) => (
                <div key={i} className="relative h-full w-full">
                  <Image src={car.image} alt={car.title} fill className="object-cover" />
                </div>
              ))}
           </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 xl:px-8 max-w-[1380px] -mt-12 sm:-mt-16 lg:-mt-20 relative z-10 pb-16">
        
        {/* Dealership Info Card */}
        <div className="bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 lg:p-7 shadow-2xl mb-5 sm:mb-6" style={{ borderRadius: 'var(--radius)' }}>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-7 items-start">
            
            {/* Logo & Identity */}
            <div className="xl:col-span-8 flex flex-col gap-4 sm:gap-5 items-start">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
               <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-3 sm:p-4 flex items-center justify-center shrink-0 overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                  {dealer.logoUrl ? <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-[#CBD5E0] dark:text-slate-700">{dealer.name[0]}</span>}
               </div>
               <div>
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mb-3 sm:mb-4">
                     <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111827] dark:text-white leading-tight tracking-tight">{dealer.name}</h1>
                     {dealer.verified && <span className="bg-[#38A169] text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] shadow-lg shadow-emerald-900/25 border border-white/20" style={{ borderRadius: '2px' }}>VERIFIED DEALER</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400">
                     <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#38A169]" /> {dealer.location || dealer.county}</span>
                     {dealerDistanceLabel && (
                       <span className="flex items-center gap-2 text-[#38A169]"><MapPin className="w-3 h-3" /> {dealerDistanceLabel}</span>
                     )}
                     <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-[#38A169]" /> Member since {startedYear}</span>
                  </div>
                  {dealerRatingTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {dealerRatingTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300"
                          style={{ borderRadius: "2px" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
               </div>
            </div>
            </div>

            <div className="xl:col-span-4">
              <div className="bg-[#0f172a]/95 border border-white/10 p-4 sm:p-5 text-white shadow-2xl" style={{ borderRadius: "12px" }}>
                <div className="flex items-end justify-between gap-3 mb-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">Get in touch</p>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight">Talk to {dealer.name}</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mb-4">We are here to help you find your next car quickly and transparently.</p>
                <div className="space-y-2">
                  {dealer.whatsapp && (
                    <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center bg-[#ef3340] text-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em]" style={{ borderRadius: "2px" }}>
                      Start Live Enquiry
                    </a>
                  )}
                  {dealer.phone && (
                    <a href={`tel:${dealer.phone}`} className="w-full inline-flex items-center justify-center bg-white/5 border border-white/15 text-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em]" style={{ borderRadius: "2px" }}>
                      Call Dealer
                    </a>
                  )}
                  {dealer.website && (
                    <a href={withProtocol(dealer.website)} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center bg-white/5 border border-white/15 text-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em]" style={{ borderRadius: "2px" }}>
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-100 dark:border-slate-800">
             <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-4">About this dealer</h2>
             <div className="text-sm sm:text-base text-[#111827] dark:text-white leading-relaxed font-medium font-sans max-w-4xl">
                {dealer.description || `${dealer.name} is a cornerstone of our verified network, committed to operational excellence and transparency in asset logistics.`}
             </div>
          </div>
        </div>

        <section className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-3 sm:p-4 shadow-xl mb-6" style={{ borderRadius: "var(--radius)" }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {heroQuickStats.map((stat) => (
              <div key={stat.label} className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4" style={{ borderRadius: "var(--radius)" }}>
                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <section id="inventory" className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 shadow-xl" style={{ borderRadius: "var(--radius)" }}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 sm:mb-6 gap-3">
                 <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-2">Featured Vehicles</h2>
                    <h3 className="text-2xl sm:text-[30px] font-bold text-[#111827] dark:text-white tracking-tight">Live Cars</h3>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400">{dealer.cars.length} Units Available</span>
              </div>
              <DealerInventory cars={inventoryWithDistance} dealerSlug={dealer.slug} />
            </section>

            <section id="reviews" className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 shadow-xl" style={{ borderRadius: "var(--radius)" }}>
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

          <aside className="lg:col-span-4 space-y-6">
            <section className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 shadow-xl" style={{ borderRadius: "var(--radius)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
              {heroTrustStats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-[#f8fafc] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {stat.icon}
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{stat.label}</p>
                  </div>
                  <p className="text-base sm:text-lg font-black text-[#111827] dark:text-white leading-tight">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{stat.sub}</p>
                </div>
              ))}
              </div>
            </section>

            {/* Google Maps Link */}
            <section className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 overflow-hidden shadow-xl" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500">Dealer Address</h4>
                {dealerDistanceLabel && (
                  <span className="text-[10px] font-bold text-[#38A169] uppercase tracking-[0.12em]">{dealerDistanceLabel}</span>
                )}
              </div>
              <p className="text-sm font-bold text-[#111827] dark:text-white leading-relaxed">
                {dealer.address || dealer.location || "Nairobi, Kenya"}
              </p>
              <a
                href={googleMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                style={{ borderRadius: "var(--radius)" }}
              >
                Open in Google Maps
              </a>
            </section>

            {/* Stats / Badges */}
            <section className="bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-6 shadow-xl" style={{ borderRadius: 'var(--radius)' }}>
               <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-4">Service Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                        <p className="text-2xl font-bold text-[#111827] dark:text-white">{dealer.cars.length}</p>
                        <p className="text-[9px] font-bold text-[#718096] dark:text-slate-400 uppercase tracking-widest mt-1">Stock</p>
                     </div>
                     <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                        <p className="text-2xl font-bold text-[#111827] dark:text-white">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</p>
                        <p className="text-[9px] font-bold text-[#718096] dark:text-slate-400 uppercase tracking-widest mt-1">Rating</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800 space-y-2" style={{ borderRadius: 'var(--radius)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#718096] dark:text-slate-400">Response cue</p>
                    <p className="text-sm font-bold text-[#111827] dark:text-white">
                      {dealer.whatsapp ? "Fastest response on WhatsApp" : dealer.phone ? "Best reached via direct call" : "Use enquiry form for replies"}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800 space-y-2" style={{ borderRadius: 'var(--radius)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#718096] dark:text-slate-400">Inventory freshness</p>
                    <p className="text-sm font-bold text-[#111827] dark:text-white">
                      {inventoryFreshnessLabel ? `Updated ${inventoryFreshnessLabel}` : "No recent inventory updates"}
                    </p>
                  </div>
                  {[
                    "Verified Assets",
                    "Direct Logistics",
                    "Bank Finance Ready"
                  ].map((tag) => (
                    <div key={tag} className="flex items-center gap-3 text-xs font-bold text-[#111827] dark:text-white uppercase tracking-widest">
                       <ShieldCheck className="w-4 h-4 text-[#38A169]" /> {tag}
                    </div>
                  ))}
                  {socialLinks.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800 space-y-3" style={{ borderRadius: 'var(--radius)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#718096] dark:text-slate-400">Follow us</p>
                      <div className="space-y-2">
                        {socialLinks.map((item) => (
                          <a
                            key={`sidebar-${item.key}`}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-between w-full text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#38A169] dark:hover:text-[#38A169]"
                          >
                            <span className="inline-flex items-center gap-2">{item.icon}{item.label}</span>
                            <span className="text-[10px] uppercase tracking-[0.12em] text-slate-400">Visit</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {recentShowcaseCars.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800 space-y-3" style={{ borderRadius: 'var(--radius)' }}>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#718096] dark:text-slate-400">Photos</p>
                        <a href="#inventory" className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#38A169]">View all</a>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {recentShowcaseCars.slice(0, 4).map((car) => (
                          <Link key={`thumb-${car.id}`} href={`/cars/${car.id}`} className="relative aspect-square overflow-hidden" style={{ borderRadius: "6px" }}>
                            <Image src={car.image} alt={car.title} fill className="object-cover" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Persistent Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-4 py-4 shadow-2xl">
         <div className="flex items-center gap-3">
           {dealer.phone && (
             <a href={`tel:${dealer.phone}`} className="flex-1 bg-[#111827] dark:bg-white text-white dark:!text-black py-3.5 text-center text-[11px] font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                Call
             </a>
           )}
           {dealer.whatsapp && (
             <a href={whatsappChatHref} className="flex-1 bg-[#38A169] text-white py-3.5 text-center text-[11px] font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                WhatsApp
             </a>
           )}
         </div>
         {socialLinks.length > 0 && (
           <div className="mt-3 grid grid-cols-3 gap-3">
             {socialLinks.map((item) => (
               <a
                 key={`mobile-${item.key}`}
                 href={item.href}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-2.5 text-center text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-1.5"
                 style={{ borderRadius: "var(--radius)" }}
               >
                 {item.icon}
                 {item.label}
               </a>
             ))}
           </div>
         )}
      </div>

    </div>
  );
}
