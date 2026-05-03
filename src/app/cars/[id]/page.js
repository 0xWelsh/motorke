// src/app/cars/[id]/page.js
export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { formatPrice, formatCarPrice, formatMileage, whatsappLink } from "@/lib/utils";
import { BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, DRIVETRAIN_LABELS } from "@/lib/constants";
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
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { absoluteUrl, BRAND_MARK_SQUARE, getSiteOrigin } from "@/lib/site-url";
import { PUBLIC_ONLY_VERIFIED_DEALERS } from "@/lib/feature-flags";

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
  const description = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} in ${car.location || car.dealer?.location || "Kenya"} at ${formatCarPrice(car)}.${car.mileage ? ` ${formatMileage(car.mileage)}.` : ""} Contact ${car.dealer?.name || "the dealer"} on Welsh Motorhub.`;
  const image = car.images[0]?.url || BRAND_MARK_SQUARE;
  const origin = getSiteOrigin();
  const url = `${origin}/cars/${id}`;

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
      images: [{ url: image.startsWith?.("http") ? image : absoluteUrl(image.startsWith("/") ? image : `/${image}`) }],
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
  const yearLabel = car.year;
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];
  const dealerBrandImage = dealer.logoUrl || dealer.users?.[0]?.avatarUrl || null;
  const specItems = [
    car.horsepower ? `${car.horsepower} HP` : null,
    car.torque ? `${car.torque} Nm` : null,
    car.engineCC ? `${(car.engineCC / 1000).toFixed(1)}L V${car.cylinders || 8} Twin Turbo` : null,
    car.transmission ? (car.transmission === "AUTOMATIC" ? "AT" : "MT") : null,
    car.drivetrain || null,
    car.fuelType ? (FUEL_LABELS[car.fuelType] || car.fuelType) : null,
    car.sunroof ? "Panoramic glass roof" : null,
    car.description?.toLowerCase().includes("leather") ? "Leather interior" : null,
  ].filter(Boolean);
  const specString = specItems.join(" • ");

  const compareCar = {
    id: car.id,
    year: car.year,
    make: car.make,
    model: `${car.make} ${car.model}`,
    price: car.price,
    image: primaryImg?.url,
  };

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
    { label: "Registration",  value: car.registered === false ? "Not registered" : "Registered (Kenya)" },
    { label: "Import country",value: car.importCountry || "N/A" },
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
    <div className="bg-white min-h-screen">
      <Script
        id="car-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container mx-auto px-6 max-w-7xl pt-32 sm:pt-40 pb-20">
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
                
                <h1 className="text-4xl sm:text-5xl font-extrabold font-sans text-[#111827] dark:text-white tracking-tight leading-[1.1] mb-6">
                  {car.make} {car.model} {car.variant ? `( ${car.variant} )` : ""}
                </h1>

                <div className="flex items-center gap-3 mb-8">
                  <span className="text-2xl font-extrabold text-[#111827] dark:text-white">
                    {formatCarPrice(car)}
                  </span>
                  <div 
                    className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[11px] text-slate-400 font-bold cursor-help"
                    title="Final listed price"
                  >
                     i
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-zinc-900 mt-8">
                   <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-6">Description</h2>
                   <div className="text-[15px] text-[#4A5568] dark:text-slate-400 leading-[1.8] font-medium">
                      {specString && <span className="text-[#111827] dark:text-white font-bold">{specString}</span>}
                      {specString && " • "}
                      {car.description || "Representing excellence in engineering, this unit undergoes a rigorous 150-point inspection before listing. Our network ensures every vehicle meets stringent quality and performance benchmarks."}
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100 dark:border-zinc-900">
                   <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-6">Vehicle Details</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-0 text-[13px]">
                      {specs.map((item, idx) => (
                        <div key={item.label} className={`flex justify-between items-center py-4 border-b border-slate-50 dark:border-zinc-900/50 ${idx < 2 ? 'border-t' : ''}`}>
                           <span className="font-bold text-slate-400 dark:text-slate-600">{item.label}</span>
                           <span className="font-extrabold text-[#111827] dark:text-white">{item.value || "N/A"}</span>
                        </div>
                      ))}
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
                        <ShareButtons title={title} price={formatCarPrice(car)} />
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

      {/* Persistent Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#EDF2F7] px-6 py-5 flex items-center gap-4">
         <div className="flex-1">
            <p className="text-[10px] font-bold text-[#38A169] uppercase tracking-widest mb-1">List Price</p>
            <p className="text-lg font-bold text-[#1A202C]">{formatCarPrice(car)}</p>
         </div>
         {dealer.whatsapp && (
           <a href={whatsappLink(dealer.whatsapp, title, dealer.name)} className="bg-[#38A169] text-white px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
              WhatsApp
           </a>
         )}
      </div>

      <SpecSheet car={car} dealer={dealer} />
      <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />
    </div>
  );
}

// ── Similar cars section is the last thing rendered above ──
