// src/app/cars/[id]/page.js
export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { computeComparisonInsights } from "@/lib/comparison";
import { formatPrice, formatCarPrice, formatMileage, estimateDuty, whatsappLink,
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
  const description = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} in ${car.location || car.dealer?.location || "Kenya"} at ${formatCarPrice(car)}.${car.mileage ? ` ${formatMileage(car.mileage)}.` : ""} Contact ${car.dealer?.name || "the dealer"} on Motorke.`;
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

  const seoDescription = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""} in ${car.location || car.dealer?.location || "Kenya"} at ${formatCarPrice(car)}.${car.mileage ? ` ${formatMileage(car.mileage)}.` : ""} Contact ${car.dealer?.name || "the dealer"} on Motorke.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: seoDescription,
    image: car.images[0]?.url || "https://motorke.co.ke/headerlogo.png",
    brand: { "@type": "Brand", name: car.make },
    offers: {
      "@type": "Offer",
      price: car.price,
      priceCurrency: "KES",
      availability: car.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "AutoDealer", name: car.dealer?.name || "Motorske Dealer" }
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div className="container mx-auto px-6 max-w-7xl pt-32 sm:pt-40 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-12">
          <Link href="/" className="hover:text-[#1A202C] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/cars" className="hover:text-[#1A202C] transition-colors">Inventory</Link>
          <span>/</span>
          <span className="text-[#1A202C] truncate max-w-[200px]">{car.make} {car.model}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Visuals & Core Specs */}
          <div className="lg:col-span-8 space-y-16">
            <div className="overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
               <ImageGallery images={car.images} title={title} />
            </div>

            {/* Title & Core Meta */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                 <span className="bg-[#38A169] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>
                    {car.available ? "VERIFIED LISTING" : "RESERVED"}
                 </span>
                 {car.dutyPaid && (
                   <span className="bg-[#1A202C] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>
                     LOCAL UNIT
                   </span>
                 )}
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-bold text-[#1A202C] tracking-tight leading-[1.1] mb-6">
                {car.year} <span className="editorial-heading text-[#718096]">{car.make} {car.model}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-1">List Price</span>
                    <span className="text-3xl font-bold text-[#1A202C]">{formatCarPrice(car)}</span>
                 </div>
                 <div className="w-px h-10 bg-[#EDF2F7] hidden sm:block"></div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-1">Mileage</span>
                    <span className="text-lg font-bold text-[#1A202C]">{formatMileage(car.mileage) || "N/A"}</span>
                 </div>
                 <div className="w-px h-10 bg-[#EDF2F7] hidden sm:block"></div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096] mb-1">Transmission</span>
                    <span className="text-lg font-bold text-[#1A202C]">{TRANSMISSION_LABELS[car.transmission] || "N/A"}</span>
                 </div>
              </div>
            </div>

            {/* Narrative / About */}
            <div className="pt-16 border-t border-[#EDF2F7]">
               <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-8">Vehicle Overview</h2>
               <div className="text-xl text-[#1A202C] leading-relaxed font-medium editorial-heading">
                  {car.description || "Representing excellence in engineering, this unit undergoes a rigorous 150-point inspection before listing. Our network ensures every vehicle meets stringent quality and performance benchmarks."}
               </div>
            </div>

            {/* Video Section */}
            {car.videoUrl && (
              <div className="pt-16 border-t border-[#EDF2F7]">
                 <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-8">Listing Video</h2>
                 <div className="aspect-video bg-[#F7FAFC] overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                    <iframe 
                        className="w-full h-full"
                        src={(() => {
                            const url = car.videoUrl;
                            if (url.includes("youtube.com/watch?v=")) return url.replace("watch?v=", "embed/");
                            if (url.includes("youtu.be/")) return `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
                            if (url.includes("vimeo.com/")) return `https://player.vimeo.com/video/${url.split("vimeo.com/")[1]}`;
                            return url;
                        })()}
                        title="Listing video"
                        allowFullScreen
                    />
                 </div>
              </div>
            )}

            {/* Detailed Specs Grid */}
            <div className="pt-16 border-t border-[#EDF2F7]">
               <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-10">Technical Specifications</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                  {visibleSpecs.map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-4 border-b border-[#EDF2F7]">
                       <span className="text-sm font-bold text-[#718096]">{item.label}</span>
                       <span className="text-sm font-bold text-[#1A202C]">{item.value}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* Support / Trust Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
               <div className="bg-[#F7FAFC] p-8" style={{ borderRadius: 'var(--radius)' }}>
                  <ShieldCheck className="w-6 h-6 text-[#38A169] mb-4" />
                  <h3 className="text-sm font-bold text-[#1A202C] uppercase tracking-widest mb-3">Certified Dealer</h3>
                  <p className="text-sm text-[#718096] leading-relaxed font-medium">
                     This unit is listed by {dealer.name}, a verified partner with a track record of transparency and reliable logistics.
                  </p>
               </div>
               <div className="bg-[#F7FAFC] p-8" style={{ borderRadius: 'var(--radius)' }}>
                  <Wallet className="w-6 h-6 text-[#38A169] mb-4" />
                  <h3 className="text-sm font-bold text-[#1A202C] uppercase tracking-widest mb-3">Finance Eligible</h3>
                  <p className="text-sm text-[#718096] leading-relaxed font-medium">
                     Flexible asset financing available via our partner banks. Standard asset age limits apply.
                  </p>
               </div>
            </div>
          </div>

          {/* Right Column: Sticky Enquiry Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit">
            <div className="bg-white border border-[#E2E8F0] p-8 lg:p-10 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex items-center gap-3 mb-10 pb-8 border-b border-[#EDF2F7]">
                 <div className="w-12 h-12 bg-[#F7FAFC] flex items-center justify-center overflow-hidden shrink-0" style={{ borderRadius: 'var(--radius)' }}>
                    {dealer.logoUrl ? <img src={dealer.logoUrl} className="w-full h-full object-cover" /> : <span className="text-[#1A202C] font-bold">{dealer.name[0]}</span>}
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-[#1A202C]">{dealer.name}</h4>
                    <p className="text-[10px] text-[#718096] font-bold uppercase tracking-widest">Verified Multi-Asset Dealer</p>
                 </div>
              </div>

              <div className="space-y-8">
                 <h3 className="text-lg font-bold text-[#1A202C]">Interest Enquiry</h3>
                 <EnquiryForm
                    carId={car.id}
                    dealerId={dealer.id}
                    carTitle={title}
                    dealer={dealer}
                    userName={session?.user?.name || ""}
                    userEmail={session?.user?.email || ""}
                  />
              </div>

              <div className="mt-10 pt-8 border-t border-[#EDF2F7] flex flex-col gap-4">
                 <div className="flex items-center justify-between text-xs font-bold text-[#718096] uppercase tracking-widest">
                    <span>Reference ID</span>
                    <span className="text-[#1A202C]">{car.id.slice(-8).toUpperCase()}</span>
                 </div>
                 <div className="py-2">
                   <ShareButtons title={title} price={formatCarPrice(car)} />
                 </div>
              </div>
            </div>

            {/* Comparison Tool Shortcut */}
            <div className="mt-8 flex items-center justify-between px-6 py-4 border border-[#E2E8F0]" style={{ borderRadius: 'var(--radius)' }}>
               <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096]">Add to comparison</span>
               <div className="flex items-center gap-4">
                  <CompareButton car={compareCar} className="w-5 h-5 text-[#718096] hover:text-[#1A202C]" />
               </div>
            </div>
          </div>
        </div>

        {/* Similar Cars Section */}
        {similar.length > 0 && (
          <div className="mt-32 pt-32 border-t border-[#EDF2F7]">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-16">Recommendation Engine</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
               {similar.map((sc) => (
                 <Link key={sc.id} href={`/cars/${sc.id}`} className="group block">
                    <div className="relative aspect-[4/3] bg-[#EDF2F7] overflow-hidden mb-6" style={{ borderRadius: 'var(--radius)' }}>
                       {sc.images?.[0]?.url && <Image src={sc.images[0].url} alt={sc.model} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />}
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-lg font-bold text-[#1A202C] group-hover:text-[#38A169] transition-colors">{sc.year} {sc.make} {sc.model}</h3>
                       <p className="text-sm font-bold text-[#718096]">{formatCarPrice(sc)}</p>
                    </div>
                 </Link>
               ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-32 pt-32 border-t border-[#EDF2F7]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
             <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] mb-6">User Feedback</h2>
                <h3 className="text-3xl sm:text-4xl font-bold text-[#1A202C]">Experience Shared.</h3>
             </div>
             {reviewsData.avgRating && (
                <div className="flex items-center gap-4 px-6 py-4 bg-[#F7FAFC]" style={{ borderRadius: 'var(--radius)' }}>
                   <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(parseFloat(reviewsData.avgRating)) ? 'fill-current' : 'text-[#CBD5E0]'}`} />)}
                   </div>
                   <span className="text-lg font-bold text-[#1A202C]">{reviewsData.avgRating} / 5.0</span>
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
                    <div key={r.id} className="pb-8 border-b border-[#EDF2F7]">
                       <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-[#EDF2F7] flex items-center justify-center overflow-hidden">
                                {r.user.avatarUrl ? <img src={r.user.avatarUrl} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{r.user.name[0]}</span>}
                             </div>
                             <span className="text-sm font-bold text-[#1A202C]">{r.user.name}</span>
                          </div>
                          <div className="flex text-amber-400">
                             {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-current' : 'text-[#CBD5E0]'}`} />)}
                          </div>
                       </div>
                       <p className="text-base text-[#718096] leading-relaxed font-medium">{r.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[#718096] font-medium italic">No reviews yet for this unit.</p>
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Persistent Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-[#EDF2F7] px-6 py-5 flex items-center gap-4">
         <div className="flex-1">
            <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">List Price</p>
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
