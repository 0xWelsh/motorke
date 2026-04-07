// src/app/cars/[id]/page.js
export const revalidate = 600; // Revalidate every 10 minutes
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { formatPrice, formatMileage, estimateDuty, whatsappLink,
         BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, DRIVETRAIN_LABELS } from "@/lib/utils";
import { MessageCircle, ChevronRight, MapPin, Wallet, ShieldCheck, Phone } from "lucide-react";
import EnquiryForm from "@/components/EnquiryForm";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import { SaveButton, TrackRecentView } from "@/components/CarActions";
import { CompareButton } from "@/components/CompareSelector";
import PrintButton from "@/components/PrintButton";
import SpecSheet from "@/components/SpecSheet";
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
  const image = car.images[0]?.url || "/favicon.png";
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

  const title    = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 pb-24 sm:pb-16">
      {/* Breadcrumb */}
      <nav className="text-sm font-medium text-slate-400 mb-8 sm:mb-10 flex gap-2 sm:gap-3 items-center flex-wrap">
        <Link href="/" className="hover:text-brand transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/cars" className="hover:text-brand transition-colors">Inventory</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-900 font-extrabold truncate max-w-full">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left: images + details */}
        <div className="lg:col-span-2 space-y-8 sm:space-y-10 lg:space-y-12">
          {/* Image gallery with lightbox */}
          <ImageGallery images={car.images} title={title} />

          {/* Title + price */}
          <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6 pb-6 sm:pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-brand-light text-brand text-xs font-extrabold">{car.year}</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{car.make}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
              <p className="text-lg text-slate-500 font-medium">
                {BODY_TYPE_LABELS[car.bodyType] || "Body type N/A"} · {formatMileage(car.mileage)} · {car.location || dealer.location || "Location on request"}
              </p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand tracking-tight">{formatPrice(car.price)}</p>
              {car.imported && !car.dutyPaid && (
                <p className="text-sm font-extrabold text-emerald-600 uppercase tracking-widest">
                  Est. {formatPrice(car.price + duty)} Total Landed
                </p>
              )}
              {car.negotiable && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-slate-200 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                  Negotiable Price
                </div>
              )}
            </div>

            <div className="w-full flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              {dealer.whatsapp && (
                <a
                  href={whatsappLink(dealer.whatsapp, title, dealer.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold uppercase tracking-widest transition-colors"
                >
                  <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp Dealer
                </a>
              )}
              <CompareButton car={compareCar} />
              <SaveButton carId={car.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} />
            </div>
          </div>

          {/* Share + Save */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <ShareButtons title={title} price={formatPrice(car.price)} />
            <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block" />
            <PrintButton carId={car.id} />
          </div>
          <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />

          {/* Mobile sticky quick actions */}
          <div className="lg:hidden sticky bottom-3 z-30">
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
                className="h-12 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-[10px] font-extrabold uppercase tracking-[0.12em] inline-flex items-center justify-center"
              >
                Dealer
              </Link>
            </div>
          </div>

          {/* Feature badges */}
          {car.features?.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em]">Key Features</h3>
              <div className="flex flex-wrap gap-3">
                {car.features.map((f) => (
                  <span key={f} className="text-sm bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-700 font-bold">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {car.description && (
            <div className="space-y-6">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em]">Dealer Description</h3>
              <p className="text-slate-600 leading-relaxed text-lg font-medium max-w-3xl whitespace-pre-line">{car.description}</p>
            </div>
          )}

          {/* Spec grid */}
          <div className="space-y-8">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em]">Detailed Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {specs.map(({ label, value }) => (
                <div key={label} className="bg-slate-50/50 border border-slate-100 rounded-lg p-4 sm:p-5 group hover:bg-white hover:border-brand-accent/20 transition-all">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                  <p className="text-base font-extrabold text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Duty estimate */}
          {car.imported && !car.dutyPaid && (
            <div className="bg-emerald-900 rounded-xl p-6 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800/50 blur-3xl -mr-32 -mt-32 rounded-full" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 text-emerald-400 font-extrabold text-xs uppercase tracking-widest">
                  <Wallet className="w-4 h-4" /> Estimated Import Duty
                </div>
                <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{formatPrice(duty)}</p>
                <p className="text-sm text-emerald-100/60 max-w-md font-medium">
                  This is a rough KRA estimate based on age and market value. Always verify with a licensed clearing agent.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: dealer card + enquiry */}
        <div className="space-y-6 sm:space-y-8">
          {/* Dealer card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 sm:space-y-8 lg:sticky lg:top-28">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center text-brand font-extrabold text-2xl overflow-hidden">
                {dealerBrandImage ? (
                  <img src={dealerBrandImage} alt={dealer.name} className="w-full h-full object-cover" />
                ) : (
                  dealer.name[0]
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-lg text-slate-900">{dealer.name}</p>
                  {dealer.verified && (
                    <div className="p-1 rounded-full bg-emerald-50 text-emerald-500">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {dealer.location || "Location on request"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Link href={`/dealers/${dealer.slug}`}
                className="flex items-center justify-center gap-2 w-full text-xs font-extrabold uppercase tracking-widest text-brand border border-brand-light rounded-lg py-4 hover:bg-brand-light transition-all">
                Browse Dealer Inventory
              </Link>
              {dealer.phone && (
                <a
                  href={`tel:${dealer.phone}`}
                  className="flex items-center justify-center gap-2 w-full text-xs font-extrabold uppercase tracking-widest text-slate-900 border border-slate-200 rounded-lg py-4 hover:bg-slate-50 transition-all"
                >
                  <Phone className="w-4 h-4" /> Call Dealer
                </a>
              )}
              {dealer.whatsapp && (
                <a href={whatsappLink(dealer.whatsapp, title, dealer.name)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-xs font-extrabold uppercase tracking-widest text-white bg-emerald-500 rounded-lg py-4 hover:bg-emerald-600 transition-all">
                  <MessageCircle className="w-4 h-4 fill-current" /> WhatsApp Dealer
                </a>
              )}
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-6">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs">Direct Enquiry</h3>
              <p className="text-[11px] font-semibold text-slate-500">
                Quick tip: WhatsApp usually gets the fastest response.
              </p>
              <EnquiryForm
                carId={car.id}
                dealerId={dealer.id}
                carTitle={title}
                dealer={dealer}
                userName={session?.user?.name || ""}
                userEmail={session?.user?.email || ""}
              />
            </div>
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
                  className="group block bg-white border border-slate-200 hover:border-brand-accent/40 overflow-hidden transition-all duration-500 rounded-xl">
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

      {/* Hidden Spec Sheet for Printing */}
      <SpecSheet car={car} dealer={dealer} />
    </div>
  );
}

// ── Similar cars section is the last thing rendered above ──
