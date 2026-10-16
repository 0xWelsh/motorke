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
import { Check } from "lucide-react";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { TrackRecentView } from "@/components/CarActions";
import TrackEventOnMount from "@/components/TrackEventOnMount";
import Link from "next/link";
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
import { FUEL_LABELS } from "@/lib/constants";
import {
  buildCarListingDealerMetadata,
  buildListingSellerSchema,
} from "@/lib/seo-dealer";
import CarListingRelatedSearches from "@/components/CarListingRelatedSearches";
import AlsoViewed from "@/components/AlsoViewed";
import CarDetailMobileBar from "@/components/CarDetailMobileBar";
import MobileSection from "@/components/MobileSection";
import AdminCardControls from "@/components/AdminCardControls";
import CarActionButtons from "@/components/CarActionButtons";
import SpecSheet from "@/components/SpecSheet";
import ListingTitleBar from "@/components/detail/ListingTitleBar";
import DetailsGrid from "@/components/detail/DetailsGrid";
import FeatureChecklist from "@/components/detail/FeatureChecklist";
import DescriptionCard from "@/components/detail/DescriptionCard";
import SellerCard from "@/components/detail/SellerCard";
import CallbackRequestForm from "@/components/detail/CallbackRequestForm";
import PriceActionsCard from "@/components/detail/PriceActionsCard";
import SafetyTipsCard from "@/components/detail/SafetyTipsCard";
import RailCard from "@/components/detail/RailCard";
import CarSimilarSection from "@/components/detail/CarSimilarSection";
import CarPeopleAlsoSearch from "@/components/detail/CarPeopleAlsoSearch";
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

function prettyKenyanPhone(digits) {
  if (!digits) return "";
  const d = String(digits).replace(/\D/g, "");
  if (d.startsWith("254") && d.length === 12) {
    return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  }
  if (d.length >= 9) return `+${d}`;
  return d;
}

export default async function CarDetailPage({ params }) {
  const { id: ref } = await params;
  const carData = await getCarData(ref);

  if (!carData || !carData.dealer) notFound();

  if (carData.publicSlug && ref === carData.id) {
    permanentRedirect(carListingPath(carData));
  }

  const { car, dealer } = { car: carData, dealer: carData.dealer };
  const soldGrace = isInSoldGracePeriod(car);
  daysRemainingOnSite(car);

  const { title } = buildCarListingDealerMetadata(car, dealer);
  const carName = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} ${car.year}${car.color ? ` ${car.color}` : ""}`;
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const specItems = buildCarSpecSummaryItems(car);
  const specString = specItems.join(", ");
  // Used only to decide whether the Features section renders at all; the list
// itself is built inside FeatureChecklist.
const hasFeatures = meaningfulFeatureList(car.features).length > 0;

  const freshLabel = freshnessLabel(daysSince(car.createdAt));
  // "Price negotiable" is omitted: the title bar already labels the price as
  // negotiable, and Negotiable repeats again in the Details grid.
  const sellerNotes = Array.isArray(car.badges)
    ? [...new Set(car.badges.map((b) => String(b).trim()).filter((b) => b && !SYSTEM_BADGES.has(b.toUpperCase())))]
    : [];

  const salesmanNumbers = await getSalesmanWhatsappNumbers();
  const waDigits = pickSalesmanWhatsapp(salesmanNumbers, car.id);
  const whatsappHref = whatsappLink(waDigits, title, "BIDGARI");
  const callHref = telHrefFromMsisdn(waDigits);
  const prettyPhone = prettyKenyanPhone(waDigits);
  const locationLabel = car.location || dealer.location || dealer.county || "Kenya";
  const priceLabel = formatCarPrice(car);

  const quickFacts = [
    car.year ? { icon: "calendar", value: String(car.year) } : null,
    car.transmission
      ? {
          icon: "settings",
          value:
            car.transmission === "AUTOMATIC"
              ? "Automatic"
              : car.transmission === "MANUAL"
                ? "Manual"
                : car.transmission,
        }
      : null,
    car.fuelType ? { icon: "fuel", value: FUEL_LABELS[car.fuelType] || car.fuelType } : null,
    positiveNum(car.mileage) ? { icon: "mileage", value: formatMileage(car.mileage) } : null,
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
      <div className="min-h-screen bg-[var(--bg)] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-20">
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
        {/* Plain <script>, not next/script: JSON-LD must be present in the
            initial server-rendered HTML. next/script injects it client-side,
            which puts the Vehicle/Offer schema outside what crawlers and
            link-preview scrapers read without executing JS. */}
        <script
          id="car-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          id="car-breadcrumb-json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />

        <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />

        {/* Gallery first — a buyer decides whether to keep reading from the photo,
            not the headline. Sits outside the padded container so it is truly
            edge-to-edge on a phone, then re-enters the container at lg where
            the two-column layout starts. */}
        <div className="lg:mx-auto lg:max-w-[1475px] lg:px-6">
          <ImageGallery
            images={car.images}
            title={title}
            carId={car.id}
            sold={soldGrace}
          />
        </div>

        <div className="container mx-auto max-w-[1475px] px-4 pb-24 pt-4 sm:px-6 sm:pt-5 lg:pb-16">
          {/* Name + price + meta. The breadcrumb trail and its back button are
              gone — the gallery's own overlay arrow handles "back", and the
              structured data below still ships the BreadcrumbList for search
              engines. The stock code lives in the Details grid. */}
          <ListingTitleBar
            car={car}
            dealer={dealer}
            carName={carName}
            priceLabel={priceLabel}
            locationLabel={locationLabel}
            freshLabel={freshLabel}
            soldGrace={soldGrace}
            quickFacts={quickFacts}
          />

          {soldGrace ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] font-medium text-red-700">
              This vehicle has been sold. Message the BIDGARI team if you would like
              something similar — we usually have fresh stock moving weekly.
            </div>
          ) : null}

          {/* Two-column body: content + sticky rail */}
          <div className="mt-5 grid grid-cols-1 gap-6 lg:mt-6 lg:grid-cols-12 lg:gap-8">

            {/* ── Content column ── */}
            <div className="order-1 min-w-0 space-y-5 lg:order-1 lg:col-span-8 xl:col-span-8">

              {/* Mobile CTAs — the rail is below the fold on phones, and the
                  sticky bottom bar only carries WhatsApp + call. */}
              <div className="lg:hidden">
                <PriceActionsCard
                  carId={car.id}
                  dealerId={car.dealerId}
                  carTitle={carName}
                  prettyPhone={prettyPhone}
                  whatsappHref={whatsappHref}
                  callHref={callHref}
                />
              </div>

              {/* Seller notes */}
              {sellerNotes.length > 0 && (
                <section className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {sellerNotes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] font-medium text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={3} aria-hidden />
                        <span className="leading-snug">{note}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Details */}
              <DetailsGrid car={car} title="Details" />

              {/* Features */}
              {hasFeatures && <FeatureChecklist car={car} title="Features" />}

              {/* Description */}
              <DescriptionCard car={car} specString={specString} />

              {/* Reviews */}
              <Suspense fallback={<ReviewsSkeleton />}>
                <CarReviewsBlock carId={car.id} />
              </Suspense>

              {/* SEO depth — folded on mobile */}
              <div className="min-w-0">
                <MobileSection summary="More about this car">
                  <Suspense fallback={null}>
                    <CarWikiBlock car={car} />
                  </Suspense>
                  <CarListingRelatedSearches car={car} />
                </MobileSection>
              </div>

              {/* Share */}
              <section className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Share this listing
                </p>
                <div className="flex items-center justify-between gap-4">
                  <ShareButtons
                    listingUrl={listingUrl}
                    browseUrl={absoluteUrl("/cars")}
                    title={title}
                    price={priceLabel}
                    dealerName="BIDGARI"
                    location={locationLabel}
                    mileageLabel={positiveNum(car.mileage) ? formatMileage(car.mileage) : null}
                    previewImageUrl={`/api/cars/${car.id}/og-image`}
                    photoUrl={primaryImg?.url ? absoluteMediaUrl(primaryImg.url) : null}
                    sold={soldGrace}
                  />
                  <Link
                    href={`/cars/${slugifyCarSegment(car.make)}`}
                    className="hidden shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-slate-700 sm:block"
                  >
                    More {car.make}
                  </Link>
                </div>
              </section>

              {/* Explore links */}
              <nav
                aria-label="Explore related listings"
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
              >
                <span className="font-black tracking-widest text-slate-500">Explore:</span>
                <Link href={`/cars/${slugifyCarSegment(car.make)}`} className="text-[var(--accent)] hover:underline">
                  All {car.make}
                </Link>
                <span className="text-slate-300">·</span>
                <Link href={`/cars/${slugifyCarSegment(car.make)}/${slugifyCarSegment(car.model)}`} className="text-[var(--accent)] hover:underline">
                  {car.make} {car.model}
                </Link>
                {car.fuelType ? (
                  <>
                    <span className="text-slate-300">·</span>
                    <Link href={`/cars/${slugifyCarSegment(car.make)}/${facetPathSegment("fuel", car.fuelType)}`} className="text-[var(--accent)] hover:underline">
                      {FUEL_LABELS[car.fuelType] || car.fuelType}
                    </Link>
                  </>
                ) : null}
              </nav>
            </div>

            {/* ── Contact rail ── */}
            <aside className="order-2 min-w-0 space-y-4 lg:order-2 lg:col-span-4 xl:col-span-4">
              <div className="space-y-4 lg:sticky lg:top-4">
                {/* Desktop CTAs */}
                <div className="hidden lg:block">
                  <PriceActionsCard
                    carId={car.id}
                    dealerId={car.dealerId}
                    carTitle={carName}
                    prettyPhone={prettyPhone}
                    whatsappHref={whatsappHref}
                    callHref={callHref}
                  />
                </div>

                <SellerCard
                  dealer={dealer}
                  carId={car.id}
                  carTitle={carName}
                  locationLabel={locationLabel}
                  whatsappHref={whatsappHref}
                  callHref={callHref}
                  prettyPhone={prettyPhone}
                  count={dealer._count?.cars}
                />

                {/* Structured requests — finance, inspection, offer */}
                <RailCard title="Make a request">
                  <CarActionButtons
                    carId={car.id}
                    dealerId={car.dealerId}
                    carTitle={carName}
                    price={priceLabel}
                    whatsappHref={whatsappHref}
                    whatsappNumber={waDigits}
                    showWhatsapp={false}
                  />
                </RailCard>

                <RailCard title="Request a callback">
                  <CallbackRequestForm
                    carId={car.id}
                    dealerId={car.dealerId}
                    carTitle={carName}
                  />
                </RailCard>

                <Suspense fallback={null}>
                  <CarMarketRange car={car} />
                </Suspense>

                <SafetyTipsCard />

                {/* Admin quick actions */}
                <div className="flex justify-end">
                  <AdminCardControls car={car} inline />
                </div>
              </div>
            </aside>
          </div>

          {/* People also search for — cross-inventory shortlist with a reason
              on every card. Ahead of the same-make strip because it is the
              better answer to "what else should I look at?". */}
          <Suspense fallback={null}>
            <CarPeopleAlsoSearch car={car} />
          </Suspense>

          {/* Similar cars — same make, full width */}
          <div className="mt-10">
            <Suspense fallback={null}>
              <CarSimilarSection car={car} />
            </Suspense>
          </div>

          {/* People who viewed this also looked at */}
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <AlsoViewed carId={car.id} />
          </div>
        </div>

        {/* Mobile bottom bar */}
        <CarDetailMobileBar
          whatsappHref={whatsappHref}
          callHref={callHref}
          priceLabel={priceLabel}
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
    <section className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="bg-slate-200 px-4 py-2.5">
        <div className="h-3 w-24 rounded bg-slate-300" />
      </div>
      <div className="space-y-3 p-4">
        <div className="h-3 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-24 w-full rounded bg-slate-100" />
      </div>
    </section>
  );
}
