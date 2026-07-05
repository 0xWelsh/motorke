// src/app/cars/[id]/page.js
export const revalidate = 120;
import { db } from "@/lib/db";
import { notFound, permanentRedirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { telHrefFromMsisdn } from "@/lib/phone-hints";
import { PUBLIC_SUPPORT_WHATSAPP, PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
import { getPreloadImageUrl } from "@/lib/image-transform";
import { MapPin } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { TrackRecentView } from "@/components/CarActions";
import { CompareButton } from "@/components/CompareSelector";
import SpecSheet from "@/components/SpecSheet";
import CarReviewsSection from "@/components/CarReviewsSection";
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
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { facetPathSegment } from "@/lib/seo-car-facets";
import { carListingPath } from "@/lib/car-listing-url";
import { BODY_TYPE_LABELS, FUEL_LABELS } from "@/lib/constants";
import {
  buildCarListingDealerMetadata,
  buildListingSellerSchema,
  dealerShowroomPath,
} from "@/lib/seo-dealer";
import { resolveModelWikiForCar } from "@/lib/seo-model-wiki";
import CarModelWiki from "@/components/CarModelWiki";
import CarListingRelatedSearches from "@/components/CarListingRelatedSearches";
import SimilarCarsSection from "@/components/SimilarCarsSection";
import CarDetailMobileBar from "@/components/CarDetailMobileBar";
import { buildListingHighlightChips } from "@/lib/car-listing-highlights";
import {
  daysRemainingOnSite,
  isInSoldGracePeriod,
  publicDetailVisibilityClause,
} from "@/lib/car-sold-status";

export async function generateMetadata({ params }) {
  const { id: ref } = await params;
  const car = await getCarData(ref);
  if (!car) return {};

  const { title, description } = buildCarListingDealerMetadata(car, car.dealer);
  const origin = getSiteOrigin();
  const canonicalPath = carListingPath(car);
  const url = `${origin}${canonicalPath}`;
  const ogImageUrl = `${origin}/api/cars/${car.id}/og-image`;
  const documentTitle = `${title} | BIDGARI`;

  return {
    title: { absolute: documentTitle },
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: documentTitle,
      description,
      url,
      locale: "en_KE",
      siteName: "BIDGARI",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          type: "image/jpeg",
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: documentTitle,
      description,
      images: [ogImageUrl],
    },
  };
}


function getCarData(ref) {
  const cached = unstable_cache(
    async () => {
      return db.car.findFirst({
        where: {
          AND: [
            publicDetailVisibilityClause(),
            { OR: [{ id: ref }, { publicSlug: ref }] },
            ...(PUBLIC_ONLY_VERIFIED_DEALERS ? [{ dealer: { verificationStatus: "VERIFIED" } }] : []),
          ],
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
    ["car-detail-v3", ref],
    { revalidate: 120, tags: ["cars", `car-detail:${ref}`] }
  );
  return cached();
}

const getSimilarCars = unstable_cache(
  async (carId, make, dealerId, bodyType, year, price) => {
    const candidates = await db.car.findMany({
      where: {
        available: true,
        ...(PUBLIC_ONLY_VERIFIED_DEALERS && { dealer: { verificationStatus: "VERIFIED" } }),
        id:        { not: carId },
        OR: [{ dealerId }, { make }, { bodyType }],
      },
      include: {
        images: { take: 1, orderBy: { isPrimary: "desc" } },
        dealer: { select: { name: true, location: true, type: true, verificationStatus: true } },
      },
      take: 10,
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
      .slice(0, 10)
      .map((entry) => entry.candidate);
  },
  ["similar-cars"],
  { revalidate: 600, tags: ["cars"] }
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

  const { car, dealer } = { car: carData, dealer: carData.dealer };
  const soldGrace = isInSoldGracePeriod(car);
  const daysLeftOnSite = daysRemainingOnSite(car);

  const similarPromise = getSimilarCars(car.id, car.make, car.dealerId, car.bodyType, car.year, car.price);
  const reviewsPromise = getCarReviews(car.id);
  const modelWikiPromise = resolveModelWikiForCar(car);

  const { title } = buildCarListingDealerMetadata(car, dealer);
  const carName = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} ${car.year}${car.color ? ` ${car.color}` : ""}`;
  const titleWithoutYear = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const specItems = buildCarSpecSummaryItems(car);
  const specString = specItems.join(", ");
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

  const [similar, reviewsData, modelWiki] = await Promise.all([similarPromise, reviewsPromise, modelWikiPromise]);
  const highlightChips = buildListingHighlightChips(car, dealer);
  const teamWhatsapp = PUBLIC_SUPPORT_WHATSAPP;
  const teamPhone = PUBLIC_SUPPORT_PHONE;
  const whatsappHref = teamWhatsapp ? whatsappLink(teamWhatsapp, title, "BIDGARI") : null;
  const callHref = teamPhone ? telHrefFromMsisdn(teamPhone) : null;
  const waDigits = teamWhatsapp ? String(teamWhatsapp).replace(/\D/g, "") : null;
  const locationLabel = car.location || dealer.location || dealer.county || "Kenya";
  const seoDescription = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} in ${car.location || car.dealer?.location || "Kenya"} at ${formatCarPrice(car)}.${car.mileage ? ` ${formatMileage(car.mileage)}.` : ""} Contact ${car.dealer?.name || "the dealer"} on BIDGARI.`;

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
    ...(car.price
      ? {
          offers: {
            "@type": "Offer",
            price: car.price,
            priceCurrency: "KES",
            priceValidUntil,
            itemCondition: conditionLd,
            availability: car.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: listingUrl,
            seller: buildListingSellerSchema(car.dealer),
          },
        }
      : {}),
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

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Cars", item: absoluteUrl("/cars") },
  ];
  if (dealer?.slug && dealer?.name) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: dealer.name,
      item: absoluteUrl(dealerShowroomPath(dealer.slug)),
    });
  }
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: `${car.year} ${car.make} ${car.model}`,
    item: listingUrl,
  });
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  const heroPreloadUrl = primaryImg?.url ? getPreloadImageUrl(primaryImg.url) : null;

  return (
    <>
      {heroPreloadUrl && (
        <link rel="preload" as="image" href={heroPreloadUrl} fetchPriority="high" />
      )}
      <div className="car-detail-showroom min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
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
      
      <div className="mx-auto w-full max-w-[1600px] px-0 sm:px-4 lg:px-6 pt-3 sm:pt-4 pb-24 lg:pb-16">
        {/* Top nav */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5 px-4 sm:px-0">
          <Link
            href="/cars"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
            aria-label="Back to inventory"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </Link>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-none">
            <Link href="/" className="hover:text-slate-300 transition-colors">Home</Link>
            <span className="mx-1.5 opacity-40">/</span>
            <Link href="/cars" className="hover:text-slate-300 transition-colors">Inventory</Link>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="text-slate-200">{car.make} {car.model}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0 lg:gap-8 xl:gap-12">
          {/* ── Main content column ── */}
          <div className="min-w-0">

            {/* Gallery — edge-to-edge mobile, contained desktop */}
            <div className="-mx-4 sm:-mx-6 lg:mx-0">
              <ImageGallery
                images={car.images}
                title={title}
                carId={car.id}
                isLoggedIn={!!session?.user}
              />
            </div>

            {/* Sold banner */}
            {soldGrace ? (
              <div className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-3.5 dark:border-amber-900/50 dark:bg-amber-950/30" role="status">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">Sold</p>
                <p className="mt-1.5 text-sm text-amber-950/90 dark:text-amber-100/90 leading-relaxed">
                  This unit has sold. Browse similar cars below or contact our team to find a similar vehicle for you
                  ,{daysLeftOnSite != null && daysLeftOnSite > 0 ? ` (this page comes down in ${daysLeftOnSite} day${daysLeftOnSite === 1 ? "" : "s"}).` : "."}
                </p>
              </div>
            ) : null}

            {/* ── Mobile: Title + Price + Spec Chips (hidden on desktop) ── */}
            <div className="lg:hidden mt-5">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight leading-[1.15]">
                {carName}
              </h1>
              <p className="mt-1.5 text-lg font-bold text-emerald-400">
                {formatCarPrice(car)}
              </p>
              <div className="flex items-center gap-2 text-xs mt-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span>{locationLabel}</span>
                <span className="opacity-30">·</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded-[2px] ${
                  soldGrace
                    ? "bg-amber-900/30 text-amber-300"
                    : "bg-emerald-900/30 text-emerald-300"
                }`}>
                  {soldGrace ? "SOLD" : "AVAILABLE"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {(() => {
                  const chips = [];
                  if (car.year) chips.push({ label: "Year", value: String(car.year) });
                  if (positiveNum(car.mileage)) chips.push({ label: "Mileage", value: formatMileage(car.mileage) });
                  if (car.fuelType) chips.push({ label: "Fuel", value: FUEL_LABELS[car.fuelType] || car.fuelType });
                  if (car.transmission) chips.push({ label: "Gearbox", value: car.transmission === "AUTOMATIC" ? "Automatic" : "Manual" });
                  if (car.bodyType) chips.push({ label: "Body", value: BODY_TYPE_LABELS[car.bodyType] || car.bodyType });
                  if (locationLabel) chips.push({ label: "Location", value: locationLabel });
                  return chips;
                })().map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] font-semibold"
                  >
                    {chip.value}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <section className="mt-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-3">Description</h2>
              <div className="text-[14px] sm:text-[15px] leading-[1.7] font-medium text-slate-400">
                {specString ? (
                  <>
                    <span className="font-bold text-slate-200">{specString}</span>
                    {(car.description || "").trim() ? ". " : null}
                  </>
                ) : null}
                {car.description?.trim() ||
                  "No description from the dealer yet. Message them for condition, service history, and viewing times."}
              </div>
            </section>

            {/* Specifications */}
            <section className="mt-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-4">Specifications</h2>
              <div className="showroom-card divide-y divide-white/5">
                {detailSpecs.map((item) => (
                  <div key={item.label} className="flex items-center justify-between px-4 py-2.5 sm:px-5">
                    <span className="text-[12px] sm:text-[13px] font-medium text-slate-400">{item.label}</span>
                    <span className="text-[13px] sm:text-[14px] font-bold text-slate-100 tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Features */}
            {featureList.length > 0 && (
              <section className="mt-8">
                <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-500 mb-3">Features</h2>
                <FeatureList features={featureList} />
              </section>
            )}

            {/* Compare + Share (mobile only) */}
            <div className="lg:hidden mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="showroom-card p-5">
                <div className="flex gap-3 mb-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600/15 text-[10px] font-black text-emerald-300 border border-emerald-600/20" aria-hidden>VS</span>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500 mb-1">Compare</p>
                    <p className="text-[12px] text-slate-400">Add up to 3 cars and compare side-by-side.</p>
                  </div>
                </div>
                <CompareButton
                  car={compareCar}
                  className="w-full min-h-11 rounded-lg inline-flex items-center justify-center bg-white/10 hover:bg-white/15 text-white text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.99]"
                />
              </div>
              <div className="showroom-card p-5 flex flex-col justify-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500 mb-3">Share this Listing</p>
                <ShareButtons
                  listingUrl={listingUrl}
                  browseUrl={absoluteUrl("/cars")}
                  title={title}
                  price={formatCarPrice(car)}
                  dealerName={dealer.name}
                  location={car.location || dealer.location || "Kenya"}
                  mileageLabel={positiveNum(car.mileage) ? formatMileage(car.mileage) : null}
                  previewImageUrl={`/api/cars/${car.id}/og-image`}
                />
              </div>
            </div>

            {/* Explore links */}
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border border-white/5 bg-white/[0.02] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 rounded-lg">
              <span className="text-slate-500 font-black tracking-widest">Explore:</span>
              <Link href={`/cars/${slugifyCarSegment(car.make)}`} className="text-emerald-400 hover:underline">All {car.make} for sale</Link>
              <span className="hidden sm:inline text-slate-600">·</span>
              <Link href={`/cars/${slugifyCarSegment(car.make)}/${slugifyCarSegment(car.model)}`} className="text-emerald-400 hover:underline">{car.make} {car.model}</Link>
              {car.fuelType && (<><span className="hidden sm:inline text-slate-600">·</span><Link href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("fuel", car.fuelType)}`} className="text-emerald-400 hover:underline">{car.make} {FUEL_LABELS[car.fuelType] || car.fuelType}</Link></>)}
              {car.bodyType && (<><span className="hidden sm:inline text-slate-600">·</span><Link href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("body", car.bodyType)}`} className="text-emerald-400 hover:underline">{car.make} {BODY_TYPE_LABELS[car.bodyType] || car.bodyType}</Link></>)}
              {dealer.county ? (<><span className="hidden sm:inline text-slate-600">·</span><Link href={`/cars/${slugifyCarSegment(dealer.county)}`} className="text-emerald-400 hover:underline">Cars in {dealer.county}</Link></>) : null}
            </div>

            {/* Car Model Wiki */}
            <div className="mt-8"><CarModelWiki car={car} wiki={modelWiki} /></div>

            {/* Related Searches */}
            <div className="mt-8"><CarListingRelatedSearches car={car} /></div>

            {/* Reviews */}
            <div className="mt-8">
              <CarReviewsSection
                carId={car.id}
                initialReviews={reviewsData.reviews}
                initialAvgRating={reviewsData.avgRating}
              />
            </div>

            {/* Similar cars */}
            <div className="mt-8"><SimilarCarsSection cars={similar} make={car.make} /></div>
          </div>

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* Price Card */}
              <div className="showroom-card p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-2">Price</p>
                <p className="text-3xl font-bold tracking-tight">{formatCarPrice(car)}</p>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-slate-400">{locationLabel}</span>
                  <span className="opacity-30">·</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded ${
                    soldGrace
                      ? "bg-amber-900/30 text-amber-300"
                      : "bg-emerald-900/30 text-emerald-300"
                  }`}>
                    {soldGrace ? "SOLD" : "AVAILABLE"}
                  </span>
                </div>
              </div>

              {/* Key Specs */}
              <div className="showroom-card p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-3">Specs</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Year", value: car.year },
                    { label: "Mileage", value: positiveNum(car.mileage) ? formatMileage(car.mileage) : null },
                    { label: "Fuel", value: FUEL_LABELS[car.fuelType] || car.fuelType },
                    { label: "Transmission", value: car.transmission === "AUTOMATIC" ? "Automatic" : car.transmission },
                    { label: "Body", value: BODY_TYPE_LABELS[car.bodyType] || car.bodyType },
                    { label: "Engine", value: positiveNum(car.engineCC) ? `${car.engineCC}cc` : null },
                    { label: "Drive", value: car.drivetrain || null },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{s.label}</span>
                      <span className="text-xs font-semibold">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2.5">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-12 flex items-center justify-center gap-2.5 rounded-xl font-bold text-xs uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp Dealer
                  </a>
                )}
                {callHref && (
                  <a
                    href={callHref}
                    className="w-full min-h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
                    Call Dealer
                  </a>
                )}
              </div>

              {/* Compare */}
              <div className="showroom-card p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500 mb-3">Compare</p>
                <CompareButton
                  car={compareCar}
                  className="w-full min-h-11 rounded-lg inline-flex items-center justify-center bg-white/10 hover:bg-white/15 text-white text-[10px] font-bold uppercase tracking-widest transition-all active:scale-[0.99]"
                />
              </div>

              {/* Share */}
              <div className="showroom-card p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500 mb-3">Share</p>
                <ShareButtons
                  listingUrl={listingUrl}
                  browseUrl={absoluteUrl("/cars")}
                  title={title}
                  price={formatCarPrice(car)}
                  dealerName={dealer.name}
                  location={car.location || dealer.location || "Kenya"}
                  mileageLabel={positiveNum(car.mileage) ? formatMileage(car.mileage) : null}
                  previewImageUrl={`/api/cars/${car.id}/og-image`}
                />
              </div>

              {/* Dealer */}
              <div className="showroom-card p-5">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500 mb-3">Seller</p>
                <p className="text-sm font-bold">{dealer.name}</p>
                {dealer.location && (
                  <p className="text-xs text-slate-400 mt-1">{dealer.location}</p>
                )}
                {dealer.county && (
                  <p className="text-xs text-slate-500 mt-0.5">{dealer.county}</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <CarDetailMobileBar
        whatsappHref={whatsappHref}
        callHref={callHref}
        priceLabel={formatCarPrice(car)}
      />

      <SpecSheet car={car} dealer={dealer} />
      <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />
    </div>
    </>
  );
}
