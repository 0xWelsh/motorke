// src/app/cars/[id]/page.js
export const revalidate = 600; // Revalidate every 10 minutes
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import { formatPrice, formatMileage, estimateDuty,
         BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, STEERING_LABELS, DRIVETRAIN_LABELS } from "@/lib/utils";
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
  const car = await db.car.findUnique({ where: { id: id } });
  if (!car) return {};
  return { title: `${car.year} ${car.make} ${car.model} — Motorke Kenya` };
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
    return db.car.findUnique({
      where:   { id: id },
      include: {
        images: { orderBy: { order: "asc" } },
        dealer: true,
      },
    });
  },
  ["car-detail"],
  { revalidate: 600, tags: ["cars"] }
);

const getSimilarCars = unstable_cache(
  async (carId, make, dealerId) => {
    return db.car.findMany({
      where: {
        available: true,
        id:        { not: carId },
        OR: [{ dealerId: dealerId }, { make: make }],
      },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        dealer: { select: { name: true, location: true } },
      },
      take: 3,
    });
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

  
  const similar = await getSimilarCars(car.id, car.make, car.dealerId);

  const title    = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const duty     = estimateDuty(car.price, car.year);
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];

  const specs = [
    { label: "Year",          value: car.year },
    { label: "Mileage",       value: formatMileage(car.mileage) },
    { label: "Fuel",          value: FUEL_LABELS[car.fuelType] },
    { label: "Transmission",  value: TRANSMISSION_LABELS[car.transmission] },
    { label: "Drivetrain",    value: DRIVETRAIN_LABELS[car.drivetrain] || "N/A" },
    { label: "Steering",      value: STEERING_LABELS[car.steering] || "N/A" },
    { label: "Body type",     value: BODY_TYPE_LABELS[car.bodyType] },
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
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-white mb-6 flex gap-2">
        <Link href="/" className="hover:text-[var(--brand)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/cars" className="hover:text-[var(--brand)] transition-colors">Cars</Link>
        <span>/</span>
        <span className="text-black font-bold">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: images + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery with lightbox */}
          <ImageGallery images={car.images} title={title} />

          {/* Title + price */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-black">{title}</h1>
              <p className="text-black mt-1">{BODY_TYPE_LABELS[car.bodyType]} · {car.year} · {formatMileage(car.mileage)}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-[var(--brand)]">{formatPrice(car.price)}</p>
              {car.negotiable && <p className="text-xs text-white mt-1">Negotiable</p>}
            </div>
          </div>

          {/* Share + Save */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <ShareButtons title={title} price={formatPrice(car.price)} />
            <SaveButton carId={car.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} />
            <PrintButton carId={car.id} />
          </div>
          <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />

          {/* Feature badges */}
          {car.features?.length > 0 && (
            <div>
              <h3 className="text-[11px] font-black text-white mb-3 uppercase tracking-[0.15em]">Features</h3>
              <div className="flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <span key={f} className="text-xs bg-slate-50 border border-slate-100 rounded-full px-3 py-1.5 text-black font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {car.description && (
            <div>
              <h3 className="text-[11px] font-black text-white mb-3 uppercase tracking-[0.15em]">About this car</h3>
              <p className="text-black leading-relaxed text-sm">{car.description}</p>
            </div>
          )}

          {/* Spec grid */}
          <div>
            <h3 className="text-[11px] font-black text-white mb-4 uppercase tracking-[0.15em]">Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {specs.map(({ label, value }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-[10px] text-white uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm font-bold text-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Duty estimate */}
          <div className="bg-[var(--brand-light)] border border-[var(--brand-accent)]/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[var(--brand)] mb-1">🧾 Estimated import duty</h3>
            <p className="text-2xl font-black text-[var(--brand)]">{formatPrice(duty)}</p>
            <p className="text-xs text-[var(--brand)]/60 mt-1">
              Rough KRA estimate based on car age and value. Verify with a clearing agent before purchase.
            </p>
          </div>
        </div>

        {/* Right: dealer card + enquiry */}
        <div className="space-y-5">
          {/* Dealer card */}
          <div className="bg-surface border border-white/5 shadow-2xl rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-light)] flex items-center justify-center text-[var(--brand)] font-black text-lg">
                {dealer.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{dealer.name}</p>
                  {dealer.verified && (
                    <span className="text-[9px] bg-green-500/20 text-white border border-green-500/30 rounded-full px-1.5 py-0.5">✓</span>
                  )}
                </div>
                <p className="text-xs text-white">{dealer.location}</p>
              </div>
            </div>
            <Link href={`/dealers/${dealer.slug}`}
              className="block text-center text-xs text-[var(--brand)] border border-[var(--brand-accent)]/20 rounded-xl py-2 hover:bg-[var(--brand-light)] transition-colors">
              View all cars from this dealer
            </Link>
          </div>

          {/* Enquiry form with WhatsApp */}
          <div className="bg-white border border-slate-100 shadow-2xl rounded-2xl p-5">
            <h3 className="font-black text-black mb-4 uppercase tracking-widest text-xs">Contact dealer</h3>
            <EnquiryForm
              carId={car.id}
              dealerId={dealer.id}
              carTitle={title}
              dealer={dealer}
            />
          </div>

          {/* Compare CTA */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center space-y-4 shadow-sm">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-[var(--brand-light)] flex items-center justify-center text-xl">⚖️</div>
            </div>
            <div>
              <p className="text-sm font-bold text-black mb-1">Want to compare this car?</p>
              <p className="text-xs text-white">Add it to your selection and see how it stacks up side-by-side.</p>
            </div>
            <div className="flex justify-center">
              <CompareButton car={car} />
            </div>
          </div>
        </div>
      </div>

      {/* Similar cars */}
      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-black mb-6 text-black tracking-tight">Similar cars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {similar.map((c) => {
              const img = c.images[0]?.url;
              const title = `${c.make} ${c.model}`;
              return (
                <Link key={c.id} href={`/cars/${c.id}`}
                  className="group block bg-white border border-slate-100 hover:border-[var(--brand-accent)]/30 overflow-hidden transition-all duration-500 rounded-2xl shadow-sm hover:shadow-lg">
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
                      <div className="flex items-center justify-center h-full text-white text-[10px] font-bold uppercase tracking-widest">No Image</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-black bg-[var(--brand-light)] text-[var(--brand)] px-2 py-0.5 uppercase tracking-wider shrink-0 rounded-md">{c.year}</span>
                      <h3 className="font-bold text-black text-sm leading-tight truncate group-hover:text-[var(--brand-accent)] transition-colors">{title}</h3>
                    </div>
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-50">
                      <p className="text-base font-black text-black">{formatPrice(c.price)}</p>
                      <span className="text-[10px] text-white">{c.dealer?.name}</span>
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
