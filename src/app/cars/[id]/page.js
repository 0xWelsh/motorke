// src/app/cars/[id]/page.js
export const revalidate = 120;
import { db } from "@/lib/db";
import { notFound, permanentRedirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { telHrefFromMsisdn } from "@/lib/phone-hints";
import { getPreloadImageUrl } from "@/lib/image-transform";
import { MapPin } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { TrackRecentView } from "@/components/CarActions";
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
        id:  { not: carId },
        make,
      },
      include: {
        images: { take: 3, orderBy: { isPrimary: "desc" } },
        dealer: { select: { name: true, location: true, type: true, verificationStatus: true } },
      },
      take: 12,
    });

    return candidates
      .map((candidate) => {
        let score = 0;

        if (candidate.dealerId === dealerId) score += 45;
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
      .slice(0, 8)
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

  const [similar, reviewsData, modelWiki] = await Promise.all([similarPromise, reviewsPromise, modelWikiPromise]);
  const highlightChips = buildListingHighlightChips(car, dealer);
  const teamWhatsapp = "254717303587";
  const teamPhone = "254717303587";
  const whatsappHref = whatsappLink(teamWhatsapp, title, "Admin");
  const callHref = telHrefFromMsisdn(teamPhone);
  const waDigits = "254717303587";
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
      
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-3 sm:pt-4 pb-24 lg:pb-16">
        {/* Top nav */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Link
            href="/cars"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            aria-label="Back to inventory"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </Link>
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 leading-none">
            <Link href="/" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Home</Link>
            <span className="mx-1.5 opacity-40">/</span>
            <Link href="/cars" className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Inventory</Link>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="text-zinc-800 dark:text-zinc-200">{car.make} {car.model}</span>
          </div>
        </div>

        <div>
          {/* ── Left column ── */}
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

            {/* Vehicle Title */}
            <div className="mt-5">
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight leading-[1.15]">
                {carName}
              </h1>
              <p className="mt-1.5 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCarPrice(car)}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{locationLabel}</span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded-[2px] ${
                  soldGrace
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
                    : "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                }`}>
                  {soldGrace ? "SOLD" : "AVAILABLE"}
                </span>
              </div>
            </div>

            {/* Quick spec chips */}
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
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[11px] font-semibold text-zinc-600 dark:text-zinc-300"
                >
                  {chip.value}
                </span>
              ))}
            </div>

            {/* Specifications */}
            <section className="mt-8">
              <h2 className="text-[12px] font-serif font-bold uppercase tracking-[0.15em] text-emerald-600 mb-4">Specifications</h2>
              <div className="grid grid-cols-2 gap-px rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                {detailSpecs.map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5 bg-white dark:bg-[#0a0a0a] px-4 py-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-900 dark:text-white/80">{item.label}</span>
                    <span className="text-[13px] font-bold text-amber-500">{item.value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Description */}
            <section className="mt-8">
              <h2 className="text-[12px] font-serif font-bold uppercase tracking-[0.15em] text-emerald-600 mb-4">Description</h2>
              <div className="mt-4 text-[14px] sm:text-[15px] text-zinc-600 dark:text-zinc-400 leading-[1.7] font-medium">
                {specString ? (
                  <>
                    <span className="text-zinc-900 dark:text-white font-bold">{specString}</span>
                    {(car.description || "").trim() ? ". " : null}
                  </>
                ) : null}
                {car.description?.trim() ||
                  "No description from the dealer yet. Message them for condition, service history, and viewing times."}
              </div>
            </section>

            {/* Features */}
            {featureList.length > 0 && (
              <section className="mt-8">
                <h2 className="text-[12px] font-serif font-bold uppercase tracking-[0.15em] text-emerald-600 mb-4">Features</h2>
                <FeatureList features={featureList} />
              </section>
            )}

            {/* Share */}
            <div className="mt-8">
              <h2 className="text-[12px] font-serif font-bold uppercase tracking-[0.15em] text-emerald-600 mb-4">Share this Listing</h2>
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

            {/* Explore links */}
            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 rounded-lg">
              <span className="text-zinc-400 font-black tracking-widest">Explore:</span>
              <Link href={`/cars/${slugifyCarSegment(car.make)}`} className="text-emerald-600 hover:underline">All {car.make} for sale</Link>
              <span className="hidden sm:inline text-zinc-300">·</span>
              <Link href={`/cars/${slugifyCarSegment(car.make)}/${slugifyCarSegment(car.model)}`} className="text-emerald-600 hover:underline">{car.make} {car.model}</Link>
              {car.fuelType && (<><span className="hidden sm:inline text-zinc-300">·</span><Link href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("fuel", car.fuelType)}`} className="text-emerald-600 hover:underline">{car.make} {FUEL_LABELS[car.fuelType] || car.fuelType}</Link></>)}
              {car.bodyType && (<><span className="hidden sm:inline text-zinc-300">·</span><Link href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("body", car.bodyType)}`} className="text-emerald-600 hover:underline">{car.make} {BODY_TYPE_LABELS[car.bodyType] || car.bodyType}</Link></>)}
              {dealer.county ? (<><span className="hidden sm:inline text-zinc-300">·</span><Link href={`/cars/${slugifyCarSegment(dealer.county)}`} className="text-emerald-600 hover:underline">Cars in {dealer.county}</Link></>) : null}
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
