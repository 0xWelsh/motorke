import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MessageCircle, Phone } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { getSession } from "@/lib/auth";
import DealerReviews from "@/components/DealerReviews";
import DealerInventory from "@/components/DealerInventory";
import DealerLocationMap from "@/components/DealerLocationMap";
import TrackEventOnMount from "@/components/TrackEventOnMount";
import DealerShowroomShare from "@/components/DealerShowroomShare";
import DealerProfileHeroPanel from "@/components/DealerProfileHeroPanel";
import { calculateDistance } from "@/lib/geolocation";
import { absoluteUrl, BRAND_OG_IMAGE } from "@/lib/site-url";
import { carListingPath } from "@/lib/car-listing-url";
import { PUBLIC_SUPPORT_WHATSAPP, PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
import { whatsappLink } from "@/lib/utils";
import { telHrefFromMsisdn } from "@/lib/phone-hints";
import {
  buildDealerAutoDealerSchema,
  buildDealerBreadcrumbSchema,
  buildDealerFaqSchema,
  buildDealerInventoryItemList,
  buildDealerMetadata,
  buildDealerSeoParagraph,
  buildDealerWebPageSchema,
  dealerShowroomUrl,
} from "@/lib/seo-dealer";

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
      verified: true,
      _count: { select: { cars: { where: { available: true } } } },
    },
  });

  if (!dealer) return { title: "Dealer Not Found" };

  const meta = buildDealerMetadata(dealer, { stockCount: dealer._count?.cars ?? 0 });

  const ogCand = dealer.logoUrl || dealer.bannerUrl;
  const ogImage = ogCand
    ? /^https?:\/\//i.test(ogCand)
      ? ogCand
      : absoluteUrl(ogCand.startsWith("/") ? ogCand : `/${ogCand}`)
    : absoluteUrl(BRAND_OG_IMAGE);

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: [{ url: ogImage, alt: `${dealer.name} showroom` }],
    },
    twitter: {
      ...meta.twitter,
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
          publicSlug: true,
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
          images: { take: 8, orderBy: { order: "asc" } },
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
  const responseTimeLabel = dealer.responseTime || "Replies via enquiry";

  const teamWhatsapp = PUBLIC_SUPPORT_WHATSAPP;
  const teamWhatsappHref = teamWhatsapp
    ? `https://wa.me/${teamWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi, I'm interested in a car I saw on WELSH.")}`
    : null;
  const teamTelHref = PUBLIC_SUPPORT_PHONE ? telHrefFromMsisdn(PUBLIC_SUPPORT_PHONE) : "";

  const socialLinks = [
    { key: "instagram", label: "Instagram", href: withProtocol(dealer.instagramUrl), icon: <SiInstagram className="w-3.5 h-3.5" style={{ color: "#E4405F" }} /> },
    { key: "facebook", label: "Facebook", href: withProtocol(dealer.facebookUrl), icon: <SiFacebook className="w-3.5 h-3.5" style={{ color: "#1877F2" }} /> },
    { key: "tiktok", label: "TikTok", href: withProtocol(dealer.tiktokUrl), icon: <SiTiktok className="w-3.5 h-3.5 text-slate-900 dark:text-white" /> },
  ].filter((item) => Boolean(item.href));

  // Generate the gallery for the hero section
  const dealerGallery = dealer.cars
    .flatMap(c => c.images.map(i => ({ image: i.url, title: `${c.make} ${c.model}` })))
    .slice(0, 6);
  const recentShowcaseCars = dealer.cars
    .filter((car) => Boolean(car.images?.[0]?.url))
    .slice(0, 4)
    .map((car) => ({
      id: car.id,
      publicSlug: car.publicSlug,
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

  const showroomPublicUrl = dealerShowroomUrl(dealer.slug);

  const makeCounts = {};
  for (const car of dealer.cars) {
    if (car.make) makeCounts[car.make] = (makeCounts[car.make] || 0) + 1;
  }
  const topMakes = Object.entries(makeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([make]) => make);

  const dealerSeoParagraph = buildDealerSeoParagraph(dealer, {
    stockCount: dealer.cars.length,
    topMakes,
  });

  const prices = dealer.cars.map((c) => Number(c.price)).filter((p) => Number.isFinite(p) && p > 0);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const priceRange =
    minPrice && maxPrice
      ? `KES ${minPrice.toLocaleString("en-KE")} - KES ${maxPrice.toLocaleString("en-KE")}`
      : undefined;

  const jsonLd = buildDealerAutoDealerSchema(dealer, {
    stockCount: dealer.cars.length,
    averageRating,
    totalReviews,
    priceRange,
    absAsset,
    dealerSummary,
  });
  const dealerBreadcrumbLd = buildDealerBreadcrumbSchema(dealer);
  const dealerWebPageLd = buildDealerWebPageSchema(dealer, jsonLd);
  const dealerFaqLd = buildDealerFaqSchema(dealer, { stockCount: dealer.cars.length });
  const dealerInventoryLd = buildDealerInventoryItemList(dealer, dealer.cars);

  return (
    <div className="bg-gradient-to-b from-[#f8fafc] via-white to-white dark:from-[#0a0a0a] dark:via-[#0b0b0b] dark:to-[#0a0a0a] min-h-screen">
      <TrackEventOnMount
        name="dealer_page_view"
        payload={{
          dealer_id: dealer.id,
          dealer_slug: dealer.slug,
          active_cars: dealer.cars.length,
          verified: Boolean(dealer.verified),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerBreadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerWebPageLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerFaqLd) }} />
      {dealerInventoryLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerInventoryLd) }} />
      ) : null}

      <div className="relative w-full overflow-x-hidden">
        {/* Banner — taller on lg+ so the entire dealer card (about
            + contact) can live inside it without bleeding into the
            navbar above or the inventory section below. Mobile/tablet
            keep the original "card overlaps bottom of banner" pattern
            because forcing everything inside on small screens would
            cramp the layout. */}
        <div className="relative h-[min(72vw,300px)] min-h-[248px] sm:min-h-[280px] lg:h-[460px] xl:h-[500px] w-full overflow-hidden bg-[#0b0f17]">
          {dealer.bannerUrl ? (
            <img src={dealer.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-70">
              {dealerGallery.slice(0, 3).map((car, i) => (
                <div key={i} className="relative h-full w-full">
                  <Image src={car.image} alt={car.title} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
          {/* Mobile: vertical fade for in-banner dealer details */}
          <div
            className="pointer-events-none absolute inset-0 lg:hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.9) 100%)",
            }}
            aria-hidden
          />
          {/* Desktop overlays */}
          <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/85 via-black/55 to-black/15 lg:from-black/90 lg:via-black/55 lg:to-black/10" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none hidden lg:block" />
          <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(34,197,94,0.18),transparent_60%)] pointer-events-none" />

          {/* Mobile: dealer details squeezed inside the banner */}
          <div className="lg:hidden absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5 pt-10">
            <DealerProfileHeroPanel
              variant="mobile"
              dealer={dealer}
              dealerSummary={dealerSummary}
              startedYear={startedYear}
              lastActiveLabel={lastActiveLabel}
              isActiveToday={isActiveToday}
              averageRating={averageRating}
              totalReviews={totalReviews}
              responseTimeLabel={responseTimeLabel}
              yearsActive={yearsActive}
              stockCount={dealer.cars.length}
            />
          </div>
          {/* Tiny scanline / grid texture for editorial feel — barely visible but adds depth on dark photos */}
          <div
            className="hidden lg:block absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
            aria-hidden
          />
        </div>

        {/* Hero card — relative + negative-top-margin on mobile/tablet
            (overlap the banner edge), absolute at the bottom of the
            banner on lg+ (squeezed inside the banner for a single
            cinematic block above the inventory). */}
        <div className="relative z-[2] mx-auto w-full max-w-[1380px] px-4 pb-0 sm:px-6 xl:px-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:pb-6 hidden lg:block">
          <div className="lg:mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-end">
              <section
                className="lg:col-span-8 bg-black/40 dark:bg-black/55 backdrop-blur-md p-4 sm:p-5 shadow-2xl min-w-0 border border-white/10 ring-1 ring-white/5"
                style={{ borderRadius: "14px" }}
              >
                <DealerProfileHeroPanel
                  variant="desktop"
                  dealer={dealer}
                  dealerSummary={dealerSummary}
                  startedYear={startedYear}
                  lastActiveLabel={lastActiveLabel}
                  isActiveToday={isActiveToday}
                  averageRating={averageRating}
                  totalReviews={totalReviews}
                  responseTimeLabel={responseTimeLabel}
                  yearsActive={yearsActive}
                  stockCount={dealer.cars.length}
                />
                <div className="hidden lg:block h-[2px] w-10 bg-gradient-to-r from-[#22c55e] to-transparent mt-2" aria-hidden />
              </section>

              <aside className="lg:col-span-4 hidden lg:block">
                <div
                  className="bg-white/95 dark:bg-[#141414]/95 backdrop-blur-md p-4 shadow-2xl border border-white/40 dark:border-white/10 ring-1 ring-black/5"
                  style={{ borderRadius: "14px" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#22c55e]">Contact BIDGARI</p>
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                      Our team
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                    Interested in a vehicle? Our team will help you through the process.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {teamTelHref ? (
                      <a
                        href={teamTelHref}
                        className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors"
                        style={{ borderRadius: "10px" }}
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    ) : null}
                    {teamWhatsappHref ? (
                      <a
                        href={teamWhatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-[#38A169] hover:bg-emerald-700 text-white px-3 py-2.5 text-[11px] font-black uppercase tracking-[0.14em] transition-colors"
                        style={{ borderRadius: "10px" }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    ) : null}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <DealerShowroomShare
                      showroomUrl={showroomPublicUrl}
                      dealerName={dealer.name}
                      stockCount={dealer.cars.length}
                      location={dealer.location || dealer.county || undefined}
                      previewImageUrl={`/api/dealers/${dealer.slug}/og-image`}
                    />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 xl:px-10 2xl:px-12 max-w-[1880px] mt-4 sm:mt-5 lg:mt-5 relative z-10 pb-28 lg:pb-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 space-y-6">
            <section id="inventory" className="bg-white dark:bg-[#111111] p-4 sm:p-6 shadow-xl" style={{ borderRadius: "14px" }}>
              <DealerInventory cars={inventoryWithDistance} dealerSlug={dealer.slug} />
            </section>

            <section
              className="bg-white dark:bg-[#111111] p-5 sm:p-6 shadow-xl"
              style={{ borderRadius: "14px" }}
              aria-labelledby="dealer-about-heading"
            >
              <h2
                id="dealer-about-heading"
                className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-4"
              >
                About {dealer.name} in Kenya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{dealerSeoParagraph}</p>
                  {dealer.description?.trim() && dealer.description.trim() !== dealerSummary ? (
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{dealer.description.trim()}</p>
                  ) : null}
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
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed mb-3">{dealer.address || dealer.location || "Nairobi, Kenya"}</p>
              <DealerLocationMap dealer={dealer} />
            </section>

              <section className="bg-[#F8FAFC] dark:bg-[#111111] p-5 sm:p-6 shadow-xl" style={{ borderRadius: "14px" }}>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-3">Social & Media</h4>
                {socialLinks.length > 0 ? (
                  <div className="space-y-2">
                    {socialLinks.map((item) => (
                      <a key={item.key} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-start gap-2 w-full text-[12px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-2.5" style={{ borderRadius: "10px" }}>
                        {item.icon}{item.label}
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
                      <Link key={`media-${car.id}`} href={carListingPath(car)} className="relative aspect-square overflow-hidden" style={{ borderRadius: "8px" }}>
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
         <div className="mb-3">
           <DealerShowroomShare
             layout="mobileBar"
             showroomUrl={showroomPublicUrl}
             dealerName={dealer.name}
             stockCount={dealer.cars.length}
             location={dealer.location || dealer.county || undefined}
             previewImageUrl={`/api/dealers/${dealer.slug}/og-image`}
           />
         </div>
         <div className="flex items-center gap-3">
            {teamTelHref ? (
              <a href={teamTelHref} className="flex-1 bg-[#111827] dark:bg-white text-white dark:!text-black py-3.5 text-center text-[11px] font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                 Call BIDGARI
              </a>
            ) : null}
            {teamWhatsappHref ? (
              <a href={teamWhatsappHref} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#38A169] text-white py-3.5 text-center text-[11px] font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                 WhatsApp
              </a>
            ) : null}
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
