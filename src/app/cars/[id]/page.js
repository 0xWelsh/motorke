// src/app/cars/[id]/page.js
export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { notFound, permanentRedirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { telHrefFromMsisdn } from "@/lib/phone-hints";
import { MessageCircle, ChevronRight, MapPin, Wallet, ShieldCheck, Phone } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import MobileListingContactBar from "@/components/MobileListingContactBar";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { SaveButton, TrackRecentView } from "@/components/CarActions";
import { CompareButton } from "@/components/CompareSelector";
import PrintButton from "@/components/PrintButton";
import SpecSheet from "@/components/SpecSheet";
import CarReviewsSection from "@/components/CarReviewsSection";
import CarCard from "@/components/CarCard";
import FeatureList from "@/components/FeatureList";
import TrackEventOnMount from "@/components/TrackEventOnMount";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { absoluteUrl, absoluteMediaUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import {
  buildCarDetailSpecRows,
  buildCarSpecSummaryItems,
  meaningfulFeatureList,
  positiveNum,
} from "@/lib/car-display";
import { specIconSrcForDetailLabel, specIconImageClassName } from "@/lib/spec-icons";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { facetPathSegment } from "@/lib/seo-car-facets";
import { carListingPath } from "@/lib/car-listing-url";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";

export async function generateMetadata({ params }) {
  const { id: ref } = await params;
  const car = await getCarData(ref);
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
  const origin = getSiteOrigin();
  const canonicalPath = carListingPath(car);
  const url = `${origin}${canonicalPath}`;
  const ogImageUrl = `${origin}/api/cars/${car.id}/og-image`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url,
      locale: "en_KE",
      siteName: "Welsh Motorhub",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
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
  async (ref) => {
    return db.car.findFirst({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verified: true } }),
        OR: [{ id: ref }, { publicSlug: ref }],
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
  ["car-detail-v2"],
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

async function getCarReviews(carId) {
  const cached = unstable_cache(
    async () => {
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
    ["car-reviews", carId],
    { revalidate: 300, tags: [`car-reviews:${carId}`] }
  );
  return cached();
}

export default async function CarDetailPage({ params }) {
  const { id: ref } = await params;
  const carData = await getCarData(ref);

  if (!carData || !carData.dealer) notFound();

  if (carData.publicSlug && ref === carData.id) {
    permanentRedirect(carListingPath(carData));
  }

  const session    = await getSession();
  const userId     = session?.userId || null;
  const isLoggedIn = !!userId;
  const savedCar   = userId ? await db.savedCar.findUnique({
    where: { userId_carId: { userId, carId: carData.id } },
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

  const listingUrl = absoluteUrl(carListingPath(car));
  const absImages = (car.images?.length ? car.images : [{ url: BRAND_MARK_SQUARE }]).map((i) =>
    absoluteMediaUrl(i.url, BRAND_MARK_SQUARE)
  );

  // ── Schema.org maps for enum values ─────────────────────────────────────
  const FUEL_TYPE_LD = {
    PETROL: "Gasoline",
    DIESEL: "Diesel",
    HYBRID: "Hybrid",
    ELECTRIC: "Electric",
    LPG: "LPG",
  };
  const TRANSMISSION_LD = {
    AUTOMATIC: "Automatic",
    MANUAL: "Manual",
    CVT: "Continuously Variable Transmission",
  };
  const DRIVETRAIN_LD = {
    FWD: "https://schema.org/FrontWheelDriveConfiguration",
    RWD: "https://schema.org/RearWheelDriveConfiguration",
    AWD: "https://schema.org/AllWheelDriveConfiguration",
    FOURWD: "https://schema.org/FourWheelDriveConfiguration",
  };
  const conditionLd =
    car.condition === "NEW"
      ? "https://schema.org/NewCondition"
      : car.condition === "CERTIFIED"
        ? "https://schema.org/RefurbishedCondition"
        : "https://schema.org/UsedCondition";

  const priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const ratingAvg = reviewsData?.avgRating ? Number(reviewsData.avgRating) : null;
  const ratingCount = reviewsData?.count || 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: title,
    description: seoDescription,
    image: absImages,
    url: listingUrl,
    sku: car.id,
    mpn: car.id,
    brand: { "@type": "Brand", name: car.make },
    manufacturer: { "@type": "Organization", name: car.make },
    model: car.model,
    vehicleConfiguration: car.variant || undefined,
    vehicleModelDate: String(car.year),
    productionDate: String(car.year),
    bodyType: car.bodyType,
    color: car.color || undefined,
    numberOfDoors: car.doors || undefined,
    vehicleSeatingCapacity: car.seats || undefined,
    fuelType: FUEL_TYPE_LD[car.fuelType] || car.fuelType,
    vehicleTransmission: TRANSMISSION_LD[car.transmission] || car.transmission,
    driveWheelConfiguration: DRIVETRAIN_LD[car.drivetrain] || undefined,
    steeringPosition:
      car.steering === "LHD"
        ? "https://schema.org/LeftHandDriving"
        : "https://schema.org/RightHandDriving",
    itemCondition: conditionLd,
    countryOfOrigin: car.importCountry || undefined,
    ...(positiveNum(car.mileage)
      ? {
          mileageFromOdometer: {
            "@type": "QuantitativeValue",
            value: car.mileage,
            unitCode: "KMT",
          },
        }
      : {}),
    ...(positiveNum(car.engineCC)
      ? {
          vehicleEngine: {
            "@type": "EngineSpecification",
            engineDisplacement: {
              "@type": "QuantitativeValue",
              value: car.engineCC,
              unitCode: "CMQ",
            },
            ...(positiveNum(car.horsepower)
              ? {
                  enginePower: {
                    "@type": "QuantitativeValue",
                    value: car.horsepower,
                    unitCode: "BHP",
                  },
                }
              : {}),
            fuelType: FUEL_TYPE_LD[car.fuelType] || car.fuelType,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "KES",
      priceValidUntil,
      itemCondition: conditionLd,
      availability: car.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: listingUrl,
      seller: {
        "@type": "AutoDealer",
        name: car.dealer?.name || "Welsh Motorhub dealer",
        ...(car.dealer?.logoUrl ? { image: absoluteMediaUrl(car.dealer.logoUrl, BRAND_MARK_SQUARE) } : {}),
        ...(car.dealer?.location
          ? {
              address: {
                "@type": "PostalAddress",
                addressLocality: car.dealer.location,
                addressCountry: "KE",
              },
            }
          : {}),
      },
    },
    ...(ratingAvg && ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingAvg,
            reviewCount: ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Inventory", item: absoluteUrl("/cars") },
      {
        "@type": "ListItem",
        position: 3,
        name: `${car.make} ${car.model}`,
        item: listingUrl,
      },
    ],
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
      <Script
        id="car-breadcrumb-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-3 sm:pt-4 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#38A169] mb-8 sm:mb-12">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            {/* Bottom Left: Title, Description, Core Details */}
            <div className="lg:col-span-8 space-y-12 sm:space-y-16">
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

                <div className="pt-10 border-t border-slate-100 dark:border-zinc-900">
                   <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-5">Vehicle Details</h2>
                   <div className="max-w-lg">
                     <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6 lg:gap-x-8 gap-y-0 text-[12px] md:text-[13px]">
                      {detailSpecs.map((item, idx) => {
                        const iconSrc = specIconSrcForDetailLabel(item.label);
                        return (
                          <div
                            key={item.label}
                            className={`flex items-center gap-2 md:gap-2.5 py-2.5 md:py-3 border-b border-slate-50 dark:border-zinc-900/50 ${idx < 2 ? "border-t border-slate-50 dark:border-zinc-900/50" : ""}`}
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                                iconSrc
                                  ? "bg-[#f7faf8] dark:bg-white/[0.06] ring-1 ring-slate-200/80 dark:ring-white/10"
                                  : ""
                              }`}
                            >
                              {iconSrc ? (
                                <Image
                                  src={iconSrc}
                                  alt=""
                                  width={22}
                                  height={22}
                                  className={specIconImageClassName(item.label)}
                                />
                              ) : null}
                            </div>
                            <span className="min-w-0 font-bold text-slate-400 dark:text-slate-600 shrink-0 text-[11px] md:text-[13px]">{item.label}</span>
                            <span className="min-w-0 font-extrabold text-[#111827] dark:text-white text-right tabular-nums ml-auto pl-1.5">{item.value}</span>
                          </div>
                        );
                      })}
                     </div>
                   </div>
                </div>

                {featureList.length > 0 && (
                  <div className="pt-10 border-t border-slate-100 dark:border-zinc-900">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-4">Features</h2>
                    <FeatureList features={featureList} />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Right: enquiry + compare — stacked cards, mobile-first spacing */}
            <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
               <section className="bg-white dark:bg-[#0a0a0a] border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 sm:p-8 lg:p-10 lg:rounded-sm shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
                  <header className="mb-5 sm:mb-6 lg:mb-8">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#38A169]">
                      Send an Enquiry
                    </h3>
                    <p className="mt-2 text-[12px] sm:text-[13px] leading-snug text-slate-500 dark:text-slate-400">
                      Reach <span className="font-semibold text-slate-700 dark:text-slate-300">{dealer.name}</span>
                      {" "}about this car. Typical response within a few hours.
                    </p>
                  </header>
                  <div>
                    <EnquiryForm
                        carId={car.id}
                        dealerId={dealer.id}
                        carTitle={titleWithoutYear}
                        dealer={dealer}
                        userName={session?.user?.name || ""}
                        userEmail={session?.user?.email || ""}
                      />
                  </div>

                  <div className="mt-8 pt-6 sm:mt-10 sm:pt-8 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col gap-4 sm:gap-5">
                    <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-[#f8fafc] dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl sm:rounded-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#38A169] shrink-0">Reference ID</span>
                        <span className="text-[11px] sm:text-[10px] font-mono font-extrabold text-[#111827] dark:text-white tracking-wide tabular-nums break-all text-left sm:text-right">{car.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center justify-center pt-1">
                        <ShareButtons
                          listingUrl={listingUrl}
                          browseUrl={absoluteUrl("/cars")}
                          title={title}
                          price={formatCarPrice(car)}
                          dealerName={dealer.name}
                          location={car.location || dealer.location || "Kenya"}
                          mileageLabel={positiveNum(car.mileage) ? formatMileage(car.mileage) : null}
                        />
                    </div>
                  </div>
               </section>

               <section className="rounded-2xl lg:rounded-sm border border-slate-200/90 dark:border-zinc-800 bg-gradient-to-b from-emerald-50/50 via-white to-white dark:from-emerald-950/20 dark:via-[#0a0a0a] dark:to-[#0a0a0a] p-5 sm:p-6 ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
                  <div className="flex gap-3 mb-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 text-[10px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-600/20" aria-hidden>
                      VS
                    </span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#38A169] mb-1">Match &amp; Compare</p>
                      <p className="text-[12px] sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Add up to three cars and open a side-by-side spec sheet on any device.
                      </p>
                    </div>
                  </div>
                  <CompareButton
                    car={compareCar}
                    className="w-full min-h-12 rounded-xl sm:rounded-sm inline-flex items-center justify-center bg-[#111827] text-white dark:bg-white dark:!text-black text-[10px] font-bold uppercase tracking-widest border border-[#111827] dark:border-white transition-transform active:scale-[0.99] hover:opacity-95"
                  />
               </section>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border border-[#EDF2F7] dark:border-zinc-800 bg-[#F7FAFC] dark:bg-zinc-900/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-zinc-400">
          <span className="sr-only md:not-sr-only md:inline text-[#718096] font-black tracking-widest">Explore:</span>
          <Link href={`/cars/${slugifyCarSegment(car.make)}`} className="text-[#38A169] hover:underline">
            All {car.make} for sale
          </Link>
          <span className="hidden sm:inline text-slate-300">·</span>
          <Link
            href={`/cars/${slugifyCarSegment(car.make)}/${slugifyCarSegment(car.model)}`}
            className="text-[#38A169] hover:underline"
          >
            {car.make} {car.model}
          </Link>
          <span className="hidden sm:inline text-slate-300">·</span>
          <Link
            href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("fuel", car.fuelType)}`}
            className="text-[#38A169] hover:underline"
          >
            {car.make} {FUEL_LABELS[car.fuelType] || car.fuelType}
          </Link>
          <span className="hidden sm:inline text-slate-300">·</span>
          <Link
            href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("body", car.bodyType)}`}
            className="text-[#38A169] hover:underline"
          >
            {car.make} {BODY_TYPE_LABELS[car.bodyType] || car.bodyType}
          </Link>
          {dealer.county ? (
            <>
              <span className="hidden sm:inline text-slate-300">·</span>
              <Link href={`/cars/${slugifyCarSegment(dealer.county)}`} className="text-[#38A169] hover:underline">
                Cars in {dealer.county}
              </Link>
              <span className="hidden sm:inline text-slate-300">·</span>
              <Link
                href={`/cars/${slugifyCarSegment(car.make)}/${slugifyCarSegment(dealer.county)}`}
                className="text-[#38A169] hover:underline"
              >
                {car.make} in {dealer.county}
              </Link>
            </>
          ) : null}
        </div>

        {/* Similar Cars Section */}
        {similar.length > 0 && (
          <div className="mt-12 sm:mt-20 pt-10 sm:pt-16 border-t border-[#EDF2F7] dark:border-zinc-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4 mb-6 sm:mb-10">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#38A169]">People Are Also Interested In</h2>
                <p className="mt-2 text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-snug">
                  Similar listings from our network — swipe sideways on your phone.
                </p>
              </div>
              <Link
                href={`/cars/${slugifyCarSegment(car.make)}`}
                className="shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#38A169] transition-colors py-1"
              >
                All {car.make} →
              </Link>
            </div>
            <div className="relative -mx-4 sm:mx-0">
              <div className="flex md:grid md:grid-cols-3 gap-3 sm:gap-5 md:gap-8 overflow-x-auto md:overflow-visible px-4 sm:px-0 pb-2 md:pb-0 snap-x snap-mandatory md:snap-none scroll-px-4 no-scrollbar items-stretch">
               {similar.map((sc) => (
                 <div
                   key={sc.id}
                   className="snap-center shrink-0 w-[min(88vw,19.5rem)] sm:w-[min(88vw,20rem)] md:w-auto md:shrink md:min-w-0 self-stretch"
                 >
                   <div className="h-full min-h-[clamp(22.5rem,72vw,25rem)] md:min-h-[25rem]">
                     <CarCard car={sc} />
                   </div>
                 </div>
               ))}
              </div>
            </div>
          </div>
        )}

        <CarReviewsSection
          carId={car.id}
          initialReviews={reviewsData.reviews}
          initialAvgRating={reviewsData.avgRating}
        />
      </div>

      <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 pointer-events-none px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <MobileListingContactBar
          carId={car.id}
          dealerId={dealer.id}
          carTitle={title}
          dealerName={dealer.name}
          priceLabel={formatCarPrice(car)}
          whatsappHref={dealer.whatsapp ? whatsappLink(dealer.whatsapp, title, dealer.name) : null}
          callHref={!dealer.whatsapp && dealer.phone ? telHrefFromMsisdn(dealer.phone) : null}
        />
      </div>

      <SpecSheet car={car} dealer={dealer} />
      <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />
    </div>
  );
}

// ── Similar cars section is the last thing rendered above ──
