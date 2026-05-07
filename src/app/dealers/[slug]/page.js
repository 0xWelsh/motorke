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
  const lastActiveLabel =
    inventoryFreshnessDays == null ? "Activity unavailable" : isActiveToday ? "Active today" : `Active ${inventoryFreshnessLabel}`;
  const responseTimeLabel = dealer.whatsapp
    ? "Replies in ~10 mins"
    : dealer.phone
      ? "Replies in ~30 mins"
      : "Replies via enquiry";
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
  const socialProof = socialLinks.map((item) => ({
    ...item,
    metric:
      item.key === "instagram"
        ? "12.4k followers"
        : item.key === "facebook"
          ? "8.1k followers"
          : "85k likes",
  }));

  // Generate the gallery for the hero section
  const dealerGallery = dealer.cars
    .flatMap(c => c.images.map(i => ({ image: i.url, title: `${c.make} ${c.model}` })))
    .slice(0, 6);
  const recentShowcaseCars = dealer.cars
    .filter((car) => Boolean(car.images?.[0]?.url))
    .slice(0, 4)
    .map((car) => ({
      id: car.id,
      image: car.images[0].url,
      title: `${car.year} ${car.make} ${car.model}`.trim(),
      price: car.price,
    }));
  const dealerSummary =
    dealer.description?.trim()?.split(".")?.[0]?.trim()
      ? `${dealer.description.trim().split(".")[0].trim()}.`
      : `${dealer.name} specializes in inspected imports, SUVs and family cars in ${dealer.location || dealer.county || "Kenya"}.`;

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
    <div className="bg-gradient-to-b from-[#f8fafc] via-white to-white dark:from-[#0a0a0a] dark:via-[#0b0b0b] dark:to-[#0a0a0a] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="w-full h-[260px] sm:h-[320px] lg:h-[380px] relative bg-[#111827] overflow-hidden">
        {dealer.bannerUrl ? (
          <img src={dealer.bannerUrl} alt={dealer.name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-70">
            {dealerGallery.slice(0, 3).map((car, i) => (
              <div key={i} className="relative h-full w-full">
                <Image src={car.image} alt={car.title} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/35" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="w-full mx-auto px-4 sm:px-6 xl:px-8 max-w-[1380px] pb-4 sm:pb-5 lg:pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              <section className="lg:col-span-8 bg-black/35 dark:bg-black/45 backdrop-blur-md p-4 sm:p-5 shadow-2xl" style={{ borderRadius: "14px" }}>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/95 p-2.5 flex items-center justify-center shrink-0 overflow-hidden" style={{ borderRadius: "10px" }}>
                    {dealer.logoUrl ? <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover" /> : <span className="text-2xl font-black text-slate-400">{dealer.name[0]}</span>}
                  </div>
                  <div className="w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">{dealer.name}</h1>
                      {dealer.verified && <span className="bg-[#22c55e] text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-[0.14em]" style={{ borderRadius: "999px" }}>Verified Dealer</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80">
                      <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-[#22c55e]" /> {dealer.location || dealer.county}</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3 text-[#22c55e]" /> Since {startedYear}</span>
                      <span className="inline-flex items-center gap-1"><Activity className={`w-3 h-3 ${isActiveToday ? "text-[#22c55e]" : "text-white/50"}`} /> {lastActiveLabel}</span>
                    </div>
                    <p className="mt-2 text-[13px] sm:text-sm text-white/90 leading-relaxed line-clamp-2">{dealerSummary}</p>
                    <div className="mt-2.5 grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <div className="bg-white/12 px-2.5 py-2" style={{ borderRadius: "9px" }}><p className="text-sm font-black text-white">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</p><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">{totalReviews} reviews</p></div>
                      <div className="bg-white/12 px-2.5 py-2" style={{ borderRadius: "9px" }}><p className="text-sm font-black text-white">{soldCarsCount > 0 ? soldCarsCount.toLocaleString("en-KE") : "—"}</p><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">cars sold</p></div>
                      <div className="bg-white/12 px-2.5 py-2" style={{ borderRadius: "9px" }}><p className="text-sm font-black text-white">{responseTimeLabel}</p><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">response</p></div>
                      <div className="bg-white/12 px-2.5 py-2" style={{ borderRadius: "9px" }}><p className="text-sm font-black text-white">{dealer.cars.length}</p><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">active cars</p></div>
                    </div>
                  </div>
                </div>
              </section>
              <aside className="lg:col-span-4 hidden lg:block">
                <div className="bg-white/90 dark:bg-[#141414]/90 backdrop-blur-md p-4 shadow-2xl" style={{ borderRadius: "14px" }}>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#22c55e] mb-1">Get in touch</p>
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-3">Start your enquiry</h3>
                  {dealer.whatsapp && (
                    <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="w-full mb-2 inline-flex items-center justify-center bg-[#22c55e] text-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em]" style={{ borderRadius: "10px" }}>
                      Start Live Enquiry
                    </a>
                  )}
                  {dealer.whatsapp && <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="w-full mb-2 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em]" style={{ borderRadius: "10px" }}>WhatsApp Dealer</a>}
                  {dealer.phone && <a href={`tel:${dealer.phone}`} className="w-full mb-2 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em]" style={{ borderRadius: "10px" }}>Call Dealer</a>}
                  {dealer.website && <a href={withProtocol(dealer.website)} target="_blank" rel="noopener noreferrer" className="w-full mb-2 inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.14em]" style={{ borderRadius: "10px" }}>Visit Website</a>}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 xl:px-10 2xl:px-12 max-w-[1880px] mt-5 relative z-10 pb-20">

        <section className="bg-white dark:bg-[#111111] shadow-xl p-3 sm:p-4 mb-6" style={{ borderRadius: "14px" }}>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 p-3" style={{ borderRadius: "10px" }}><p className="text-xl font-black">{dealer.cars.length}+</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Vehicles in stock</p></div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3" style={{ borderRadius: "10px" }}><p className="text-xl font-black">{yearsActive}+</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Years in business</p></div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3" style={{ borderRadius: "10px" }}><p className="text-xl font-black">{soldCarsCount > 0 ? soldCarsCount.toLocaleString("en-KE") : "—"}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Cars sold</p></div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3" style={{ borderRadius: "10px" }}><p className="text-xl font-black">{totalReviews || "—"}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Happy customers</p></div>
            <div className="bg-slate-50 dark:bg-slate-900 p-3" style={{ borderRadius: "10px" }}><p className="text-xl font-black">{dealer.verified ? "100%" : "—"}</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Verified dealer</p></div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-6">
            <section id="inventory" className="bg-white dark:bg-[#111111] p-5 sm:p-6 shadow-xl" style={{ borderRadius: "14px" }}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-5 gap-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Featured Vehicles</h2>
                  <h3 className="text-2xl sm:text-[30px] font-black text-slate-900 dark:text-white tracking-tight">Live Cars</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{dealer.cars.length} Units Available</span>
              </div>
              <DealerInventory cars={inventoryWithDistance} dealerSlug={dealer.slug} />
            </section>

            <section className="bg-white dark:bg-[#111111] p-5 sm:p-6 shadow-xl" style={{ borderRadius: "14px" }}>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4">About {dealer.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{dealer.description || dealerSummary}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {["Verified inventory", "Inspected vehicles", "Trade-in accepted", "Financing support", "After-sales assistance", "Import options available"].map((item) => (
                      <div key={item} className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 px-3 py-2" style={{ borderRadius: "10px" }}>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#22c55e]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(recentShowcaseCars.length > 0 ? recentShowcaseCars : dealerGallery.map((g, i) => ({ id: `g-${i}`, image: g.image, title: g.title }))).slice(0, 4).map((item) => (
                    <div key={item.id} className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: "10px" }}>
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="reviews" className="bg-white dark:bg-[#111111] p-5 sm:p-6 shadow-xl" style={{ borderRadius: "14px" }}>
              <DealerReviews dealerSlug={dealer.slug} dealerName={dealer.name} averageRating={averageRating} totalReviews={totalReviews} reviews={dealer.reviews} viewer={viewer} viewerReview={viewerReview} />
            </section>
          </div>

          <aside className="lg:col-span-3 space-y-6">
            <section className="bg-white dark:bg-[#111111] p-5 sm:p-6 shadow-xl" style={{ borderRadius: "14px" }}>
              <h4 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400 mb-3">Dealer info</h4>
              <div className="space-y-2.5 mb-4 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex justify-between gap-3"><span className="text-slate-500">Business type</span><span>Dealership</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Phone</span><span>{dealer.phone || "Not shared"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Email</span><span className="truncate">{dealer.email || "Not shared"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Website</span><span className="truncate">{dealer.website || "Not shared"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500">Verified</span><span>{dealer.verified ? "Yes" : "Pending"}</span></div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2">Opening hours</p>
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Mon - Sat: 8:00 AM - 6:00 PM</p>
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Sun: 10:00 AM - 4:00 PM</p>
              </div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Find us</h4>
                {dealerDistanceLabel && <span className="text-[10px] font-bold text-[#22c55e] uppercase tracking-[0.12em]">{dealerDistanceLabel}</span>}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{dealer.address || dealer.location || "Nairobi, Kenya"}</p>
              <a href={googleMapsHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" style={{ borderRadius: "10px" }}>
                Open in Google Maps
              </a>
            </section>

            <section className="bg-[#F8FAFC] dark:bg-[#111111] p-5 sm:p-6 shadow-xl" style={{ borderRadius: "14px" }}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-3">Social & Media</h4>
              {socialProof.length > 0 ? (
                <div className="space-y-2">
                  {socialProof.map((item) => (
                    <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between w-full text-[12px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-2.5" style={{ borderRadius: "10px" }}>
                      <span className="inline-flex items-center gap-2">{item.icon}{item.label}</span>
                      <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">{item.metric}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No social profiles linked yet.</p>
              )}
              {recentShowcaseCars.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Photos from dealer</p>
                    <a href="#inventory" className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#22c55e]">View all</a>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {recentShowcaseCars.map((car) => (
                      <Link key={`media-${car.id}`} href={`/cars/${car.id}`} className="relative aspect-square overflow-hidden" style={{ borderRadius: "8px" }}>
                        <Image src={car.image} alt={car.title} fill className="object-cover" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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
