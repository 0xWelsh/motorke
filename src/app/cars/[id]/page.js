// src/app/cars/[id]/page.js
export const revalidate = 60;
import { db } from "@/lib/db";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { getSalesmanWhatsappNumbers, pickSalesmanWhatsapp } from "@/lib/salesman-whatsapp";
import { telHrefFromMsisdn } from "@/lib/phone-hints";
import { getPreloadImageUrl } from "@/lib/image-transform";
import { MapPin, BadgeCheck, Check, ShieldCheck } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { TrackRecentView } from "@/components/CarActions";
import SpecSheet from "@/components/SpecSheet";
import CarReviewsSection from "@/components/CarReviewsSection";
import FeatureList from "@/components/FeatureList";
import TrackEventOnMount from "@/components/TrackEventOnMount";
import CarContactActions from "@/components/CarContactActions";
import CarViewCounter from "@/components/CarViewCounter";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { absoluteUrl, absoluteMediaUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";
import {
  buildCarSpecSummaryItems,
  meaningfulFeatureList,
  positiveNum,
} from "@/lib/car-display";
import { slugifyCarSegment } from "@/lib/seo-car-slug";
import { facetPathSegment } from "@/lib/seo-car-facets";
import { carListingPath } from "@/lib/car-listing-url";
import { stockCode } from "@/lib/stock-code";
import { FUEL_LABELS, CAR_STATUS_LABELS, CAR_STATUS_COLORS } from "@/lib/constants";
import {
  buildCarListingDealerMetadata,
  buildListingSellerSchema,
} from "@/lib/seo-dealer";
import CarListingRelatedSearches from "@/components/CarListingRelatedSearches";
import AlsoViewed from "@/components/AlsoViewed";
import CarDetailMobileBar from "@/components/CarDetailMobileBar";
import CarActionButtons from "@/components/CarActionButtons";
import NikkyoSpecTable from "@/components/NikkyoSpecTable";
import CarSimilarStrip from "@/components/detail/CarSimilarStrip";
import CarSimilarSection from "@/components/detail/CarSimilarSection";
import CarReviewsBlock from "@/components/detail/CarReviewsBlock";
import CarWikiBlock from "@/components/detail/CarWikiBlock";
import CarMarketRange from "@/components/detail/CarMarketRange";
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
              _count: { select: { cars: true } },
            },
          },
        },
      });
    },
    ["car-detail-v4", ref],
    { revalidate: 120, tags: ["cars", `car-detail:${ref}`] }
  );
  return cached();
}

function daysSince(date) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function freshnessLabel(days) {
  if (days <= 1) return "Listed today";
  if (days <= 3) return "Listed recently";
  if (days <= 7) return "Listed this week";
  return "Listed recently";
}

const SYSTEM_BADGES = new Set(["HOT", "NEW", "FEATURED", "SPOTLIGHT", "SOLD"]);

export default async function CarDetailPage({ params }) {
  const { id: ref } = await params;
  const carData = await getCarData(ref);

  if (!carData || !carData.dealer) notFound();

  if (carData.publicSlug && ref === carData.id) {
    permanentRedirect(carListingPath(carData));
  }

  const { car, dealer } = { car: carData, dealer: carData.dealer };
  const soldGrace = isInSoldGracePeriod(car);
  const daysLeftOnSite = daysRemainingOnSite(car);

  const { title } = buildCarListingDealerMetadata(car, dealer);
  const carName = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} ${car.year}${car.color ? ` ${car.color}` : ""}`;
  const titleWithoutYear = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const specItems = buildCarSpecSummaryItems(car);
  const specString = specItems.join(", ");
  const featureList = meaningfulFeatureList(car.features);

  const freshDays = daysSince(car.createdAt);
  const freshLabel = freshnessLabel(freshDays);
  const sellerNotes = [
    car.negotiable ? "Price negotiable" : null,
    ...(Array.isArray(car.badges) ? car.badges.map((b) => String(b).trim()).filter((b) => b && !SYSTEM_BADGES.has(b.toUpperCase())) : []),
  ].filter(Boolean);
  const salesmanNumbers = await getSalesmanWhatsappNumbers();
  const waDigits = pickSalesmanWhatsapp(salesmanNumbers, car.id);
  const whatsappHref = whatsappLink(waDigits, title, "BIDGARI");
  const callHref = telHrefFromMsisdn(waDigits);
  const locationLabel = car.location || dealer.location || dealer.county || "Kenya";
  const code = stockCode(car);
  const quickFacts = [
    car.year ? { icon: "📅", value: String(car.year) } : null,
    car.transmission
      ? {
          icon: "⚙️",
          value:
            car.transmission === "AUTOMATIC"
              ? "Automatic"
              : car.transmission === "MANUAL"
                ? "Manual"
                : car.transmission,
        }
      : null,
    car.fuelType ? { icon: "⛽", value: FUEL_LABELS[car.fuelType] || car.fuelType } : null,
    locationLabel ? { icon: "📍", value: locationLabel } : null,
    positiveNum(car.mileage) ? { icon: "🛣️", value: formatMileage(car.mileage) } : null,
  ].filter(Boolean);
  const seoDescription = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} in ${car.location || car.dealer?.location || "Kenya"} at ${formatCarPrice(car)}.${car.mileage ? ` ${formatMileage(car.mileage)}.` : ""} Sold by BIDGARI with full buyer support.`;

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
            seller: buildListingSellerSchema(),
          },
        }
      : {}),
  };

  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
    { "@type": "ListItem", position: 2, name: "Cars", item: absoluteUrl("/cars") },
  ];
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
      <div className="bg-[var(--bg)] min-h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-20">
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
      
      <div className="container mx-auto px-4 sm:px-6 max-w-[1475px] pt-3 sm:pt-4 pb-24 lg:pb-16">
        <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />

        {/* Top nav / breadcrumb */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Link
            href="/cars"
            className="btn btn-neutral btn-icon w-8 h-8"
            aria-label="Back to inventory"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </Link>
          <nav aria-label="Breadcrumb" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 leading-none">
            <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <span className="mx-1.5 opacity-40">/</span>
            <Link href="/cars" className="hover:text-slate-900 transition-colors">Cars</Link>
            <span className="mx-1.5 opacity-40">/</span>
            <span className="text-slate-700">{car.make} {car.model}</span>
            {code ? (
              <>
                <span className="mx-1.5 opacity-40">/</span>
                <span className="text-slate-700">{code}</span>
              </>
            ) : null}
          </nav>
        </div>

        {/* Vehicle title + metadata */}
        <h1 className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold tracking-tight text-slate-900 leading-[1.15]">
          {carName}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-slate-500">
          {code ? <span className="font-bold text-slate-700">Stock {code}</span> : null}
          <span className="text-slate-400">·</span>
          <span>{freshLabel}</span>
          <span className="text-slate-400">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />{locationLabel}
          </span>
          <span className="text-slate-400">·</span>
          <span className={`font-bold uppercase tracking-widest ${soldGrace ? "text-red-600" : "text-emerald-600"}`}>
            {soldGrace ? "SOLD" : "AVAILABLE"}
          </span>
          <span className="text-slate-400">·</span>
          <span className="font-bold uppercase tracking-widest text-slate-900">
            {car.imported === false ? "LOCAL" : (() => {
              const flags = { Japan: "🇯🇵", UK: "🇬🇧", USA: "🇺🇸", UAE: "🇦🇪", Germany: "🇩🇪", "South Africa": "🇿🇦", Thailand: "🇹🇭", Singapore: "🇸🇬" };
              const flag = flags[car.importCountry] || "";
              return `IMPORTED${flag ? ` ${flag}` : ""}`;
            })()}
          </span>
          {car.carStatus && (
            <>
              <span className="text-slate-400">·</span>
              <span className={`font-bold uppercase tracking-widest text-[10px] px-1.5 py-0.5 rounded ${CAR_STATUS_COLORS[car.carStatus]}`}>
                {CAR_STATUS_LABELS[car.carStatus]}
              </span>
            </>
          )}
        </div>

        {/* ── Nikkyo-style columns: gallery | specifications | price ── */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">

          {/* Gallery column */}
          <div className="order-1 lg:order-1 xl:order-1 lg:col-span-6 xl:col-span-5 min-w-0 space-y-4">
            <div className="-mx-4 sm:-mx-6 lg:mx-0">
              <ImageGallery
                images={car.images}
                title={title}
                carId={car.id}
                sold={soldGrace}
                quickFacts={quickFacts}
              />
            </div>

            {/* Views — real engagement data */}
            <div className="flex items-center gap-2.5 px-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              <CarViewCounter initialCount={car.views || 0} carId={car.id} />
            </div>

            {/* Request & actions */}
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Get this car</p>
              <CarActionButtons carId={car.id} dealerId={car.dealerId} carTitle={carName} price={formatCarPrice(car)} whatsappHref={whatsappHref} whatsappNumber={waDigits} />
            </section>

            {/* Seller notes — real data-backed claims only */}
            {sellerNotes.length > 0 && (
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="bg-[var(--sidebar-bar)] px-4 py-2.5">
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-white">Seller notes</h2>
                </div>
                <div className="p-4">
                  <ul className="space-y-2">
                    {sellerNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-slate-600">
                        <Check className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" strokeWidth={3} />
                        <span className="leading-snug">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* More {make} cars — fills the gallery column (desktop only) */}
            <Suspense fallback={null}>
              <CarSimilarStrip car={car} />
            </Suspense>
          </div>
          <div className="order-2 lg:order-2 xl:order-2 lg:col-span-6 xl:col-span-4 min-w-0 space-y-5">
            <NikkyoSpecTable car={car} title="Specifications" />

            {/* Description */}
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="bg-[var(--sidebar-bar)] px-4 py-2.5">
                <h2 className="text-[12px] font-black uppercase tracking-widest text-white">Description</h2>
              </div>
              <div className="p-5 text-[14px] text-slate-600 leading-[1.8]">
                <p>
                  {specString ? <span className="font-bold text-slate-900">{specString}.</span> : null}{" "}
                  {car.description?.trim() ||
                    "No description yet. Message the BIDGARI team for condition, service history, and viewing times."}
                </p>
              </div>
            </section>

            {/* Reviews */}
            <Suspense fallback={<ReviewsSkeleton />}>
              <CarReviewsBlock carId={car.id} />
            </Suspense>
          </div>

          {/* Price sidebar */}
          <div className="order-3 lg:order-3 xl:order-3 lg:col-span-12 xl:col-span-3 min-w-0 space-y-5">
            {/* Price card */}
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Price</p>
              <p className="mt-1 text-[30px] xl:text-[30px] leading-none font-black tracking-tighter text-slate-900 tabular-nums">
                {formatCarPrice(car)}
              </p>
              <Suspense fallback={null}>
                <CarMarketRange car={car} />
              </Suspense>
            </section>

            {/* Contact actions */}
            <CarContactActions
              whatsappHref={whatsappHref}
              callHref={callHref}
              carId={car.id}
              dealerId={car.dealerId}
              carTitle={carName}
            />

            {/* BIDGARI trust */}
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-[13px] font-black text-slate-900">BIDGARI Verified Listing</span>
              </div>
              <p className="mt-2 text-[12px] text-slate-500 leading-relaxed">
                Sold by BIDGARI. We handle this sale for you and guide you through inspection and paperwork.
              </p>
            </section>

            {/* Buy safely */}
            <section className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-[13px] font-black text-slate-900">Don't get scammed</span>
              </div>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-start gap-1.5 text-[12px] text-slate-500 leading-relaxed">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-rose-500 shrink-0" strokeWidth={3} />
                  Never pay a deposit to a private number — pay only at handover through BIDGARI.
                </li>
                <li className="flex items-start gap-1.5 text-[12px] text-slate-500 leading-relaxed">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-rose-500 shrink-0" strokeWidth={3} />
                  We never ask for money on WhatsApp. If someone does, it isn't us.
                </li>
              </ul>
              <div className="mt-3 flex items-center gap-4">
                <Link href="/safety" className="text-[11px] font-bold text-rose-600 hover:underline">
                  Safety guide
                </Link>
                <Link href="/report" className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline">
                  Report a scam
                </Link>
              </div>
            </section>

            {/* Features */}
            {featureList.length > 0 && (
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="bg-[var(--sidebar-bar)] px-4 py-2.5">
                  <h2 className="text-[12px] font-black uppercase tracking-widest text-white">Features</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {featureList.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 text-[13px] font-medium text-slate-600">
                        <Check className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" strokeWidth={3} />
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SEO */}
            <Suspense fallback={null}>
              <CarWikiBlock car={car} />
            </Suspense>
            <CarListingRelatedSearches car={car} />

            {/* Share */}
            <section>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Share this listing</p>
              <ShareButtons
                listingUrl={listingUrl}
                browseUrl={absoluteUrl("/cars")}
                title={title}
                price={formatCarPrice(car)}
                dealerName="BIDGARI"
                location={car.location || dealer.location || "Kenya"}
                mileageLabel={positiveNum(car.mileage) ? formatMileage(car.mileage) : null}
                previewImageUrl={`/api/cars/${car.id}/og-image`}
                photoUrl={primaryImg?.url ? absoluteMediaUrl(primaryImg.url) : null}
                sold={soldGrace}
              />
            </section>

            {/* Explore links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border border-slate-200 bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500 rounded-xl">
              <span className="text-slate-500 font-black tracking-widest">Explore:</span>
              <Link href={`/cars/${slugifyCarSegment(car.make)}`} className="text-[var(--accent)] hover:underline">All {car.make}</Link>
              <span className="text-slate-400">·</span>
              <Link href={`/cars/${slugifyCarSegment(car.make)}/${slugifyCarSegment(car.model)}`} className="text-[var(--accent)] hover:underline">{car.make} {car.model}</Link>
              {car.fuelType && (<><span className="text-slate-400">·</span><Link href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("fuel", car.fuelType)}`} className="text-[var(--accent)] hover:underline">{FUEL_LABELS[car.fuelType] || car.fuelType}</Link></>)}
            </div>
          </div>
        </div>

        {/* Similar cars — full width */}
        <div className="mt-10">
          <Suspense fallback={null}>
            <CarSimilarSection car={car} />
          </Suspense>
        </div>

        {/* People who viewed this also looked at */}
        <div className="px-4 sm:px-6 max-w-6xl mx-auto"><AlsoViewed carId={car.id} /></div>
      </div>

      {/* Mobile bottom bar */}
      <CarDetailMobileBar
        whatsappHref={whatsappHref}
        callHref={callHref}
        priceLabel={formatCarPrice(car)}
        carId={car.id}
        dealerId={car.dealerId}
        carTitle={carName}
      />

      <SpecSheet car={car} />
    </div>
    </>
  );
}

function ReviewsSkeleton() {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white animate-pulse">
      <div className="bg-slate-200 px-4 py-2.5">
        <div className="h-3 w-24 bg-slate-300 rounded" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-3 w-2/3 bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 rounded" />
        <div className="h-24 w-full bg-slate-100 rounded" />
      </div>
    </section>
  );
}
