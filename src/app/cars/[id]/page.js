// src/app/cars/[id]/page.js
export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { MessageCircle, ChevronRight, MapPin, Wallet, ShieldCheck, Phone, Star } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { SaveButton, TrackRecentView } from "@/components/CarActions";
import { CompareButton } from "@/components/CompareSelector";
import PrintButton from "@/components/PrintButton";
import SpecSheet from "@/components/SpecSheet";
import CarReviewForm from "@/components/CarReviewForm";
import CarCard from "@/components/CarCard";
import FeatureMarquee from "@/components/FeatureMarquee";
import TrackEventOnMount from "@/components/TrackEventOnMount";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import {
  buildCarDetailSpecRows,
  buildCarSpecSummaryItems,
  meaningfulFeatureList,
  positiveNum,
} from "@/lib/car-display";
import { specIconSrcForDetailLabel } from "@/lib/spec-icons";
import { FaWhatsapp } from "react-icons/fa";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const car = await db.car.findFirst({
    where: {
      id,
      available: true,
      ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      dealer: { select: { name: true, location: true } },
    },
  });
  if (!car) return {};

  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} for sale in Kenya`;
  const priceStr = formatCarPrice(car);
  const loc = car.location || car.dealer?.location || "Kenya";
  const mileStr = car.mileage ? formatMileage(car.mileage) : null;
  const dealerName = car.dealer?.name || "Verified dealer";
  const description = [
    `${priceStr}`,
    mileStr,
    loc,
    dealerName,
  ]
    .filter(Boolean)
    .join(" · ")
    .concat(` · ${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} on Welsh Motorhub — browse more verified cars.`);
  const image = car.images[0]?.url || BRAND_MARK_SQUARE;
  const origin = getSiteOrigin();
  const url = `${origin}/cars/${id}`;
  const ogImageUrl = image.startsWith?.("http")
    ? image
    : absoluteUrl(image.startsWith("/") ? image : `/${image}`);

  return {
    title,
    description,
    alternates: { canonical: `/cars/${id}` },
    openGraph: {
      title,
      description,
      url,
      locale: "en_KE",
      siteName: "Welsh Motorhub",
      images: [{ url: ogImageUrl, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}


const getCarData = unstable_cache(
  async (id) => {
    return db.car.findFirst({
      where: {
        id,
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
      },
      include: {
        images: { orderBy: { order: "asc" } },
        dealer: {
          include: {
            users: { select: { avatarUrl: true }, take: 1 },
          },
        },
      },
    });
  },
  ["car-detail"],
  { revalidate: 600, tags: ["cars"] }
);

const getSimilarCars = unstable_cache(
  async (carId, make, dealerId, bodyType, year, price) => {
    const candidates = await db.car.findMany({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
        id:        { not: carId },
        OR: [{ dealerId }, { make }, { bodyType }],
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        dealer: { select: { name: true, location: true, verified: true } },
      },
      take: 24,
    });

    return candidates
      .map((candidate) => {
        let score = 0;

        if (candidate.dealerId === dealerId) score += 45;
        if (candidate.make === make) score += 28;
        if (candidate.bodyType === bodyType) score += 20;

        const yearGap = Math.abs((candidate.year || 0) - (year || 0));
        score += Math.max(0, 15 - yearGap * 3);

        const priceGap = Math.abs((candidate.price || 0) - (price || 0));
        const priceGapRatio = price ? priceGap / price : 1;
        score += Math.max(0, 20 - priceGapRatio * 40);

        if (candidate.dealer?.verified) score += 3;

        return { candidate, score };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.candidate.createdAt?.getTime?.() || 0) - (a.candidate.createdAt?.getTime?.() || 0);
      })
      .slice(0, 3)
      .map((entry) => entry.candidate);
  },
  ["similar-cars"],
  { revalidate: 3600, tags: ["cars"] }
);

const getCarReviews = unstable_cache(
  async (carId) => {
    const reviews = await db.carReview.findMany({
      where: { carId },
      include: {
        user: { select: { name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    return { reviews, avgRating, count: reviews.length };
  },
  ["car-reviews"],
  { revalidate: 300, tags: ["car-reviews"] }
);

export default async function CarDetailPage({ params }) {
  const { id } = await params;
  const carData = await getCarData(id);

  if (!carData || !carData.dealer) notFound();
  
  const session    = await getSession();
  const userId     = session?.userId || null;
  const isLoggedIn = !!userId;
  const savedCar   = userId ? await db.savedCar.findUnique({
    where: { userId_carId: { userId, carId: id } },
  }).catch(() => null) : null;
  const isSaved = !!savedCar;

  const { car, dealer } = { car: carData, dealer: carData.dealer };

  
  const similar = await getSimilarCars(car.id, car.make, car.dealerId, car.bodyType, car.year, car.price);
  const reviewsData = await getCarReviews(car.id);

  const title    = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const titleWithoutYear = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const specItems = buildCarSpecSummaryItems(car);
  const specString = specItems.join(" • ");
  const detailSpecs = buildCarDetailSpecRows(car);
  const featureList = meaningfulFeatureList(car.features);

  const compareCar = {
    id: car.id,
    year: car.year,
    make: car.make,
    model: `${car.make} ${car.model}`,
    price: car.price,
    image: primaryImg?.url,
  };

  const seoDescription = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} in ${car.location || car.dealer?.location || "Kenya"} at ${formatCarPrice(car)}.${car.mileage ? ` ${formatMileage(car.mileage)}.` : ""} Contact ${car.dealer?.name || "the dealer"} on Welsh Motorhub.`;

  const listingUrl = absoluteUrl(`/cars/${car.id}`);
  const toAbsImage = (url) => {
    if (!url) return absoluteUrl(BRAND_MARK_SQUARE);
    if (/^https?:\/\//i.test(url)) return url;
    return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
  };
  const absImages = (car.images?.length ? car.images : [{ url: BRAND_MARK_SQUARE }]).map((i) =>
    toAbsImage(i.url)
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": title,
    "description": seoDescription,
    "image": absImages,
    "brand": {
      "@type": "Brand",
      "name": car.make
    },
    "sku": car.id,
    "mpn": car.id,
    "color": car.color,
    "offers": {
      "@type": "Offer",
      "price": car.price,
      "priceCurrency": "KES",
      "itemCondition": car.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      "availability": car.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": listingUrl,
      "seller": {
        "@type": "AutoDealer",
        "name": car.dealer?.name || "Welsh Motorhub dealer",
        "image": car.dealer?.logoUrl
      }
    }
  };

  return (
    <div className="bg-white min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-20">
      <TrackEventOnMount
        name="view_car"
        payload={{
          car_id: car.id,
          dealer_id: dealer.id,
          make: car.make,
          model: car.model,
          price: Number(car.price || 0),
        }}
      />
      <Script
        id="car-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container mx-auto px-6 max-w-7xl pt-3 sm:pt-4 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#38A169] mb-12">
          <Link href="/" className="hover:opacity-70 transition-opacity">Home</Link>
          <span className="opacity-40">/</span>
          <Link href="/cars" className="hover:opacity-70 transition-opacity">Inventory</Link>
          <span className="opacity-40">/</span>
          <span className="font-sans text-slate-900 dark:text-white truncate max-w-[200px] opacity-60 group-hover:opacity-100 transition-opacity">{car.make} {car.model}</span>
        </nav>

        <div className="space-y-10">
          {/* TOP SECTION: Full-Width Gallery */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
             <div className="lg:col-span-12 overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                <ImageGallery images={car.images} title={title} />
             </div>
          </div>

          {/* BOTTOM SECTION: Details + Enquiry Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Bottom Left: Title, Description, Core Details */}
            <div className="lg:col-span-8 space-y-16">
              <div>
                <div className="flex items-center gap-4 mb-4">
                   <span className="bg-[#38A169]/10 text-[#38A169] text-[10px] font-black px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>
                      {car.available ? "AVAILABLE" : "RESERVED"}
                   </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl font-semibold text-[#111827] dark:text-white tracking-tight leading-[1.2] mb-6">
                  {car.make} {car.model} {car.variant ? `( ${car.variant} )` : ""}
                </h1>

                <div className="flex flex-wrap items-center gap-1.5 mb-8 text-lg sm:text-xl">
                  <span className="font-semibold tabular-nums text-[#111827] dark:text-white leading-none">
                    {formatCarPrice(car)}
                  </span>
                  <div className="relative inline-flex shrink-0 group/tooltip">
                    <button
                      type="button"
                      aria-label="Pricing information"
                      aria-describedby="car-price-explainer"
                      className="relative z-10 inline-flex h-[0.76em] w-[0.76em] min-h-[12px] min-w-[12px] items-center justify-center rounded-full border border-emerald-700/22 bg-emerald-600/[0.05] outline-none ring-offset-2 ring-offset-white transition-[background-color,border-color] hover:border-emerald-700/34 hover:bg-emerald-600/10 focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2 dark:border-emerald-500/26 dark:bg-emerald-500/[0.06] dark:ring-offset-[#0a0a0a] dark:hover:border-emerald-400/38 dark:hover:bg-emerald-500/12"
                      style={{ fontSize: "inherit" }}
                    >
                      <span
                        className="font-serif italic font-semibold leading-none text-[0.52em] text-emerald-800 dark:text-emerald-200 select-none"
                        aria-hidden
                      >
                        i
                      </span>
                    </button>
                    <span
                      id="car-price-explainer"
                      role="tooltip"
                      className="pointer-events-none absolute bottom-[calc(100%+10px)] left-1/2 z-20 mb-0 w-max max-w-[min(280px,calc(100vw-3rem))] -translate-x-1/2 rounded-[3px] border border-[#38A169]/25 bg-gradient-to-br from-emerald-50 to-white px-3.5 py-2 pb-3 text-left text-[11px] font-semibold leading-snug text-[#14532d] shadow-[0_10px_35px_-8px_rgba(22,101,52,0.35)] opacity-0 transition-opacity duration-200 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 dark:from-emerald-950/95 dark:to-[#0f172a] dark:border-[#38A169]/35 dark:text-emerald-100 dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55)]"
                    >
                      <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[#38A169] dark:text-[#6ee7b7]">
                        Listing price
                      </span>
                      <span className="mt-1 block font-medium text-[#166534] dark:text-emerald-50">
                        Price inclusive of all costs
                      </span>
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-x-[7px] border-x-transparent border-t-[7px] border-t-emerald-100 dark:border-t-emerald-900/90"
                      />
                    </span>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-zinc-900 mt-8">
                   <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-6">Description</h2>
                   <div className="text-[15px] text-[#4A5568] dark:text-slate-400 leading-[1.8] font-medium">
                      {specString ? (
                        <>
                          <span className="text-[#111827] dark:text-white font-bold">{specString}</span>
                          {(car.description || "").trim() ? " • " : null}
                        </>
                      ) : null}
                      {car.description?.trim() ||
                        "Representing excellence in engineering, this unit undergoes a rigorous 150-point inspection before listing. Our network ensures every vehicle meets stringent quality and performance benchmarks."}
                   </div>
                </div>

                {featureList.length > 0 && (
                  <div className="pt-10 border-t border-slate-100 dark:border-zinc-900">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-4">Features</h2>
                    <FeatureMarquee features={featureList} variant="detail" />
                  </div>
                )}

                <div className="pt-10 border-t border-slate-100 dark:border-zinc-900">
                   <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-6">Vehicle Details</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-0 text-[13px]">
                      {detailSpecs.map((item, idx) => {
                        const iconSrc = specIconSrcForDetailLabel(item.label);
                        return (
                          <div
                            key={item.label}
                            className={`flex items-center gap-3 md:gap-4 py-4 border-b border-slate-50 dark:border-zinc-900/50 ${idx < 2 ? "border-t border-slate-50 dark:border-zinc-900/50" : ""}`}
                          >
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                                iconSrc
                                  ? "bg-[#f7faf8] dark:bg-zinc-900/90 ring-1 ring-slate-200/80 dark:ring-zinc-800"
                                  : ""
                              }`}
                            >
                              {iconSrc ? (
                                <Image
                                  src={iconSrc}
                                  alt=""
                                  width={28}
                                  height={28}
                                  className="object-contain opacity-[0.92] dark:opacity-95"
                                />
                              ) : null}
                            </div>
                            <span className="min-w-0 font-bold text-slate-400 dark:text-slate-600 shrink-0">{item.label}</span>
                            <span className="min-w-0 font-extrabold text-[#111827] dark:text-white text-right tabular-nums ml-auto pl-2">{item.value}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>
              </div>
            </div>

            {/* Bottom Right: Enquiry Form */}
            <div className="lg:col-span-4">
               <div className="bg-white dark:bg-[#0a0a0a] border border-slate-100 dark:border-zinc-900 p-10 shadow-sm" style={{ borderRadius: '2px' }}>
                  <div className="space-y-10">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#38A169]">Send an Enquiry</h3>
                    <EnquiryForm
                        carId={car.id}
                        dealerId={dealer.id}
                        carTitle={titleWithoutYear}
                        dealer={dealer}
                        userName={session?.user?.name || ""}
                        userEmail={session?.user?.email || ""}
                      />
                  </div>

                  <div className="mt-12 pt-10 border-t border-slate-50 dark:border-zinc-900/50 flex flex-col gap-6">
                    <div className="px-5 py-3 bg-[#fbfcfe] dark:bg-zinc-900 border border-[#e2e8f0] dark:border-zinc-800 flex items-center justify-between" style={{ borderRadius: '2px' }}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#38A169]">Reference ID</span>
                        <span className="text-[10px] font-extrabold text-[#111827] dark:text-white">{car.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="py-2 flex items-center justify-center">
                        <ShareButtons
                          listingUrl={absoluteUrl(`/cars/${car.id}`)}
                          browseUrl={absoluteUrl("/cars")}
                          title={title}
                          price={formatCarPrice(car)}
                          dealerName={dealer.name}
                          location={car.location || dealer.location || "Kenya"}
                          mileageLabel={positiveNum(car.mileage) ? formatMileage(car.mileage) : null}
                        />
                    </div>
                  </div>
               </div>

               {/* Comparison Tool Shortcut */}
               <div className="mt-8 px-6 py-5 bg-white dark:bg-[#0a0a0a] border border-slate-100 dark:border-zinc-900" style={{ borderRadius: '2px' }}>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#38A169] mb-1">Match & Compare</p>
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 mb-4">Add this car to your compare sheet and view side-by-side specs.</p>
                  <CompareButton
                    car={compareCar}
                    className="w-full h-11 inline-flex items-center justify-center bg-[#111827] text-white dark:bg-white dark:!text-black text-[10px] font-bold uppercase tracking-widest border border-[#111827] dark:border-white transition-transform hover:scale-[0.99]"
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Similar Cars Section */}
        {similar.length > 0 && (
          <div className="mt-16 sm:mt-20 pt-12 sm:pt-16 border-t border-[#EDF2F7] dark:border-zinc-800">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#38A169] mb-12">People Are Also Interested In</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {similar.map((sc) => (
                 <CarCard key={sc.id} car={sc} />
               ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-32 pt-32 border-t border-[#EDF2F7]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
             <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#38A169] mb-6">User Feedback</h2>
                <h3 className="text-3xl sm:text-4xl font-bold text-[#1A202C] dark:text-white">Experience Shared.</h3>
             </div>
             {reviewsData.avgRating && (
                <div className="flex items-center gap-4 px-6 py-4 bg-[#F7FAFC] dark:bg-zinc-900 border border-transparent dark:border-zinc-800" style={{ borderRadius: 'var(--radius)' }}>
                   <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(reviewsData.avgRating)) ? 'fill-current' : 'text-[#CBD5E0]'}`} />)}
                   </div>
                   <span className="text-lg font-bold text-[#1A202C] dark:text-white">{reviewsData.avgRating} / 5.0</span>
                </div>
             )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
             <div className="lg:col-span-4">
                <CarReviewForm carId={car.id} />
             </div>
             <div className="lg:col-span-8 space-y-8">
                {reviewsData.reviews.length > 0 ? (
                  reviewsData.reviews.map((r) => (
                    <div key={r.id} className="pb-8 border-b border-[#EDF2F7] dark:border-zinc-800">
                       <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-[#EDF2F7] dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {r.user.avatarUrl ? <img src={r.user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{r.user.name[0]}</span>}
                             </div>
                             <span className="text-sm font-bold text-[#1A202C] dark:text-white">{r.user.name}</span>
                          </div>
                          <div className="flex text-amber-400">
                             {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-[#CBD5E0]'}`} />)}
                          </div>
                       </div>
                       <p className="text-base text-[#718096] dark:text-slate-300 leading-relaxed font-medium">{r.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#718096] dark:text-slate-300 font-medium">No reviews yet for this unit.</p>
                )}
             </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="pointer-events-auto mx-auto flex max-w-lg items-stretch gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-[0_8px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl ring-1 ring-black/5 dark:border-zinc-700 dark:bg-zinc-950/95 dark:ring-white/10">
          <div className="flex min-w-0 flex-1 flex-col justify-center pl-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700/90 dark:text-emerald-400">List price</p>
            <p className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white">{formatCarPrice(car)}</p>
          </div>
          {dealer.whatsapp ? (
            <a
              href={whatsappLink(dealer.whatsapp, title, dealer.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-[#20bd5a] active:scale-[0.98]"
            >
              <FaWhatsapp className="h-6 w-6 shrink-0" aria-hidden />
              <span className="pr-0.5">WhatsApp</span>
            </a>
          ) : (
            <Link
              href={`tel:${String(dealer.phone || "").replace(/\s/g, "")}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
            >
              <Phone className="h-5 w-5 shrink-0" aria-hidden />
              Call
            </Link>
          )}
        </div>
      </div>

      <SpecSheet car={car} dealer={dealer} />
      <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />
    </div>
  );
}

// ── Similar cars section is the last thing rendered above ──
