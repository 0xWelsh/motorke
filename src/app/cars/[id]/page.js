// src/app/cars/[id]/page.js
export const revalidate = 600; // Revalidate every 10 minutes
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { computeComparisonInsights } from "@/lib/comparison";
import { formatPrice, formatMileage, estimateDuty, whatsappLink,
         BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, DRIVETRAIN_LABELS } from "@/lib/utils";
import { MessageCircle, ChevronRight, MapPin, Wallet, ShieldCheck, Phone, Star } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { SaveButton, TrackRecentView } from "@/components/CarActions";
import { CompareButton } from "@/components/CompareSelector";
import PrintButton from "@/components/PrintButton";
import SpecSheet from "@/components/SpecSheet";
import CarReviewForm from "@/components/CarReviewForm";
import Link from "next/link";
import Image from "next/image";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const car = await db.car.findFirst({
    where: { id, available: true },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      dealer: { select: { name: true, location: true } },
    },
  });
  if (!car) return {};

  const title = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} - Motorke Kenya`;
  const description = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} in ${car.location || car.dealer?.location || "Kenya"} at ${formatPrice(car.price)}.${car.mileage ? ` ${formatMileage(car.mileage)}.` : ""} Contact ${car.dealer?.name || "the dealer"} on Motorke.`;
  const image = car.images[0]?.url || "/headerlogo.png";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://motorke.co.ke";
  const url = `${baseUrl}/cars/${id}`;

  return {
    title,
    description,
    alternates: { canonical: `/cars/${id}` },
    openGraph: {
      title,
      description,
      url,
      siteName: "Motorke",
      images: [{ url: image }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// Pre-render top 100 most recent cars at build time
export async function generateStaticParams() {
  const cars = await db.car.findMany({
    where: { available: true },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true },
  });

  return cars.map((car) => ({
    id: car.id,
  }));
}

const getCarData = unstable_cache(
  async (id) => {
    return db.car.findFirst({
      where:   { id, available: true },
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

function batteryTechLabel(value) {
  if (!value) return null;
  if (value === "NIMH") return "NiMH";
  if (value === "LI_ION") return "Li-ion";
  if (value === "NA") return "N/A";
  return value;
}

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
  const yearLabel = car.year;
  const duty     = estimateDuty(car.price, car.year);
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const dealerBrandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl || null;
  const compareCar = {
    id: car.id,
    year: car.year,
    make: car.make,
    model: `${car.make} ${car.model}`,
    price: car.price,
    image: primaryImg?.url,
  };

  const insight = computeComparisonInsights(car);

  const trustBadges = [
    dealer.verified ? "Verified Dealer" : null,
    car.dutyPaid ? "Import Docs Present" : null,
    insight.importEligibility === true ? "Import Age Eligible" : null,
    car.fuelType === "HYBRID" && car.hybridBatteryTech
      ? `${batteryTechLabel(car.hybridBatteryTech)} Battery`
      : null,
  ].filter(Boolean);

  const specs = [
    { label: "Year",          value: car.year },
    { label: "Mileage",       value: formatMileage(car.mileage) },
    { label: "Fuel",          value: FUEL_LABELS[car.fuelType] || "N/A" },
    { label: "Transmission",  value: TRANSMISSION_LABELS[car.transmission] || "N/A" },
    { label: "Drivetrain",    value: DRIVETRAIN_LABELS[car.drivetrain] || "N/A" },
    { label: "Steering",      value: STEERING_LABELS[car.steering] || "N/A" },
    { label: "Body type",     value: BODY_TYPE_LABELS[car.bodyType] || "N/A" },
    { label: "Engine size",   value: car.engineCC ? `${car.engineCC}cc` : "N/A" },
    { label: "Cylinders",     value: car.cylinders || "N/A" },
    { label: "Horsepower",    value: car.horsepower ? `${car.horsepower} hp` : "N/A" },
    { label: "Torque",        value: car.torque ? `${car.torque} Nm` : "N/A" },
    { label: "Turbocharged",  value: car.turbo ? "Yes" : "No" },
    { label: "Seats",         value: car.seats || "N/A" },
    { label: "Airbags",       value: car.airbags || "0" },
    { label: "Sunroof",       value: car.sunroof ? "Yes" : "No" },
    { label: "Color",         value: car.color || "N/A" },
    { label: "Condition",     value: car.condition },
    { label: "Import country",value: car.importCountry || "N/A" },
    { label: "Duty paid",     value: car.dutyPaid ? "Yes" : "No" },
  ];

  const descriptionBullets = (car.description || "")
    .split(/\r?\n|[.!?]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 8)
    .slice(0, 4);

  const visibleSpecs = specs.filter((entry) => entry.value && entry.value !== "N/A").slice(0, 14);
  const specRows = [];
  for (let i = 0; i < visibleSpecs.length; i += 2) {
    specRows.push([visibleSpecs[i], visibleSpecs[i + 1] || null]);
  }

  return (
    <div className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-7 lg:px-10 py-6 sm:py-10 lg:py-12 pb-36 sm:pb-28 lg:pb-16">
        {/* Breadcrumb */}
        <nav className="hidden sm:flex text-sm font-medium text-slate-500 mb-8 sm:mb-10 gap-2 sm:gap-3 items-center flex-wrap">
          <Link href="/" className="hover:text-brand transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/cars" className="hover:text-brand transition-colors">Vehicles</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-extrabold truncate max-w-full">{title}</span>
        </nav>

        <div className="space-y-8">
          <ImageGallery images={car.images} title={title} />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-12 items-start">
            {/* Left: Main Content */}
            <div className="space-y-8">
              {/* Title & Price Section */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-extrabold uppercase tracking-widest">
                      {car.available ? "Available" : "On Hold"}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-serif font-semibold text-slate-500 tracking-tight">{yearLabel}</span>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900 tracking-tight leading-snug">{titleWithoutYear}</h1>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1 tracking-wider">Price</p>
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">{formatPrice(car.price)}</p>
                  <p className="text-xs text-slate-500 font-medium mt-2 tracking-wider">Shipping included to major ports</p>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-base font-serif font-bold uppercase tracking-wider text-slate-900 mb-4">Description</h2>
                <p className="text-[15px] text-slate-700 leading-relaxed font-medium">
                  {descriptionBullets.length > 0 ? descriptionBullets.join(" • ") : "High-spec unit with verified dealer profile and direct enquiry support."}
                </p>
              </div>

              {/* Vehicle Details */}
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-base font-serif font-bold uppercase tracking-wider text-slate-900 mb-6">Vehicle Details</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                  {visibleSpecs.map((item) => (
                    <div key={item.label}>
                      <p className="text-[13px] text-slate-600 font-medium mb-1.5 tracking-wider">{item.label}</p>
                      <p className="text-[15px] font-semibold text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust Badges */}
              {trustBadges.length > 0 && (
                <div className="border-t border-slate-200 pt-6 flex flex-wrap gap-3">
                  {trustBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-widest"
                    >
                      <ShieldCheck className="w-4 h-4" /> {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Links */}
              <div className="border-t border-slate-200 pt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/dealers/${dealer.slug}#dealer-gallery`}
                  className="px-5 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs font-extrabold uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  View Dealer Gallery
                </Link>
                <div className="[&>button]:px-5 [&>button]:py-3">
                  <CompareButton car={compareCar} />
                </div>
                <div className="[&>button]:px-5 [&>button]:py-3">
                  <SaveButton carId={car.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} />
                </div>
                <PrintButton carId={car.id} />
              </div>

              <ShareButtons title={title} price={formatPrice(car.price)} />

              {/* Duty estimate */}
              {car.imported && !car.dutyPaid && (
                <div className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/50 blur-3xl -mr-32 -mt-32 rounded-full" />
                  <div className="relative z-10 space-y-3">
                    <div className="flex items-center gap-3 text-emerald-300 font-extrabold text-xs uppercase tracking-widest">
                      <Wallet className="w-4 h-4" /> Estimated Import Duty
                    </div>
                    <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{formatPrice(duty)}</p>
                    <p className="text-sm text-emerald-100/80 max-w-xl font-medium">
                      This is a rough KRA estimate based on age and market value. Always verify with a licensed clearing agent.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Sidebar Form */}
            <aside className="bg-slate-50 border border-slate-200 rounded-2xl p-6 lg:sticky lg:top-24 space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1 tracking-wider">Price</p>
                <p className="text-3xl font-serif font-bold text-slate-900 tracking-tight">{formatPrice(car.price)}</p>
                <p className="text-xs text-slate-500 font-medium mt-2 tracking-wider">Shipping included to major ports</p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                <div className="w-12 h-12 rounded-lg bg-brand-light flex items-center justify-center text-brand font-extrabold text-lg overflow-hidden shrink-0">
                  {dealerBrandImage ? (
                    <img src={dealerBrandImage} alt={dealer.name} className="w-full h-full object-cover" />
                  ) : (
                    dealer.name[0]
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">{dealer.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5" /> {car.location || dealer.location || "Location on request"}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-slate-200">
                <h3 className="text-base font-serif font-bold uppercase tracking-wider text-slate-900">Send an Enquiry</h3>
                <EnquiryForm
                  carId={car.id}
                  dealerId={dealer.id}
                  carTitle={title}
                  dealer={dealer}
                  userName={session?.user?.name || ""}
                  userEmail={session?.user?.email || ""}
                  whatsAppFirst={false}
                  showQuickMessages={false}
                  showSafetyBadge={false}
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <Link
                  href={`/dealers/${dealer.slug}`}
                  className="flex items-center justify-center gap-2 w-full text-xs font-extrabold uppercase tracking-widest text-slate-900 border border-slate-300 rounded-lg py-3 hover:bg-slate-100 transition-all"
                >
                  Browse Dealer Inventory
                </Link>
              </div>
            </aside>
          </div>

          <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />

          {/* Mobile sticky quick actions */}
          <div className="lg:hidden fixed bottom-3 inset-x-0 z-40 px-3 sm:px-6">
            <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur p-2 shadow-[0_14px_30px_rgba(15,23,42,0.16)] flex items-center gap-2">
              {dealer.whatsapp && (
                <a
                  href={whatsappLink(dealer.whatsapp, title, dealer.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-12 rounded-xl bg-emerald-500 text-white text-[11px] font-extrabold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp
                </a>
              )}
              {dealer.phone && (
                <a
                  href={`tel:${dealer.phone}`}
                  className="flex-1 h-12 rounded-xl bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-[0.12em] flex items-center justify-center gap-1.5"
                >
                  <Phone className="w-4 h-4" /> Call
                </a>
              )}
              <Link
                href={`/dealers/${dealer.slug}`}
                className="hidden sm:inline-flex h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] font-extrabold uppercase tracking-[0.12em] items-center justify-center"
              >
                Dealer
              </Link>
            </div>
          </div>
        </div>

        {/* Similar cars */}
      {similar.length > 0 && (
        <div className="mt-16 sm:mt-24 lg:mt-32 space-y-8 sm:space-y-12">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Similar units you might like</h2>
              <p className="text-base sm:text-lg text-slate-500 font-medium">Hand-picked alternatives from our verified inventory.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {similar.map((c) => {
              const img = c.images[0]?.url;
              const title = `${c.make} ${c.model}`;
              return (
                <Link key={c.id} href={`/cars/${c.id}`}
                  className="group block bg-white border border-slate-200 hover:border-brand-accent/40 overflow-hidden transition-all duration-500">
                  <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                    {img ? (
                      <Image 
                        src={img} 
                        alt={title} 
                        fill 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-300 text-xs font-bold uppercase tracking-widest">No Image</div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-extrabold bg-brand-light text-brand px-2 py-0.5 rounded-md tracking-tight">{c.year}</span>
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight truncate group-hover:text-brand transition-colors">{title}</h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <p className="text-xl font-extrabold text-slate-900">{formatPrice(c.price)}</p>
                      <span className="text-xs font-bold text-slate-400">{c.dealer?.name}</span>
                  </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="mt-16 sm:mt-24 lg:mt-32 space-y-8 sm:space-y-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Customer reviews</h2>
            {reviewsData.avgRating && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(parseFloat(reviewsData.avgRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-extrabold text-slate-900">{reviewsData.avgRating} <span className="text-slate-500 font-semibold">({reviewsData.count})</span></p>
              </div>
            )}
          </div>
          <p className="text-base sm:text-lg text-slate-500 font-medium">Real feedback from verified buyers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Review Form */}
          <div>
            <CarReviewForm carId={car.id} />
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((review) => (
                <div key={review.id} className="border border-slate-200 rounded-lg p-5 bg-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {review.user.avatarUrl ? (
                        <img src={review.user.avatarUrl} alt={review.user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                          {review.user.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm">{review.user.name}</p>
                        <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="border border-slate-200 rounded-lg p-8 bg-slate-50 text-center">
                <p className="text-sm text-slate-500 font-medium">No reviews yet. Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Spec Sheet for Printing */}
      <SpecSheet car={car} dealer={dealer} />
    </div>
    </div>
  );
}

// ── Similar cars section is the last thing rendered above ──
