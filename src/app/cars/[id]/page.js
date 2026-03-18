// src/app/cars/[id]/page.js
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, formatMileage, estimateDuty,
         BODY_TYPE_LABELS, FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/utils";
import EnquiryForm from "@/components/EnquiryForm";
import ImageGallery from "@/components/ImageGallery";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const car = await db.car.findUnique({ where: { id: params.id } });
  if (!car) return {};
  return { title: `${car.year} ${car.make} ${car.model} — Motorke Kenya` };
}

export default async function CarDetailPage({ params }) {
  const [carData] = await Promise.all([
    db.car.findUnique({
      where:   { id: params.id },
      include: {
        images: { orderBy: { order: "asc" } },
        dealer: true,
      },
    }),
  ]);

  if (!carData) notFound();

  const { car, dealer } = { car: carData, dealer: carData.dealer };

  const similar = await db.car.findMany({
    where: {
      available: true,
      id:        { not: car.id },
      OR: [{ dealerId: car.dealerId }, { make: car.make }],
    },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      dealer: { select: { name: true, location: true } },
    },
    take: 3,
  });

  const title    = `${car.year} ${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
  const duty     = estimateDuty(car.price, car.year);
  const primaryImg = car.images.find((i) => i.isPrimary) || car.images[0];

  const specs = [
    { label: "Year",          value: car.year },
    { label: "Mileage",       value: formatMileage(car.mileage) },
    { label: "Fuel",          value: FUEL_LABELS[car.fuelType] },
    { label: "Transmission",  value: TRANSMISSION_LABELS[car.transmission] },
    { label: "Body type",     value: BODY_TYPE_LABELS[car.bodyType] },
    { label: "Engine",        value: car.engineCC ? `${car.engineCC}cc` : "N/A" },
    { label: "Drive",         value: car.driveType },
    { label: "Seats",         value: car.seats || "N/A" },
    { label: "Color",         value: car.color || "N/A" },
    { label: "Condition",     value: car.condition },
    { label: "Import country",value: car.importCountry || "N/A" },
    { label: "Duty paid",     value: car.dutyPaid ? "Yes" : "No" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-white/30 mb-6 flex gap-2">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/cars" className="hover:text-white transition-colors">Cars</Link>
        <span>/</span>
        <span className="text-white/60">{title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: images + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery with lightbox */}
          <ImageGallery images={car.images} title={title} />

          {/* Title + price */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black">{title}</h1>
              <p className="text-white/40 mt-1">{BODY_TYPE_LABELS[car.bodyType]} · {car.year} · {formatMileage(car.mileage)}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-[#f97316]">{formatPrice(car.price)}</p>
              {car.negotiable && <p className="text-xs text-white/40 mt-1">Negotiable</p>}
            </div>
          </div>

          {/* Share */}
          <ShareButtons title={title} price={formatPrice(car.price)} />

          {/* Feature badges */}
          {car.features?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">Features</h3>
              <div className="flex flex-wrap gap-2">
                {car.features.map((f) => (
                  <span key={f} className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white/70">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {car.description && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">About this car</h3>
              <p className="text-white/70 leading-relaxed text-sm">{car.description}</p>
            </div>
          )}

          {/* Spec grid */}
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">Specifications</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {specs.map(({ label, value }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Duty estimate */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-amber-400 mb-1">🧾 Estimated import duty</h3>
            <p className="text-2xl font-black text-amber-300">{formatPrice(duty)}</p>
            <p className="text-xs text-amber-400/60 mt-1">
              Rough KRA estimate based on car age and value. Verify with a clearing agent before purchase.
            </p>
          </div>
        </div>

        {/* Right: dealer card + enquiry */}
        <div className="space-y-5">
          {/* Dealer card */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#f97316]/20 flex items-center justify-center text-[#f97316] font-black text-lg">
                {dealer.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{dealer.name}</p>
                  {dealer.verified && (
                    <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-1.5 py-0.5">✓</span>
                  )}
                </div>
                <p className="text-xs text-white/40">{dealer.location}</p>
              </div>
            </div>
            <Link href={`/dealers/${dealer.slug}`}
              className="block text-center text-xs text-[#f97316] border border-[#f97316]/30 rounded-xl py-2 hover:bg-[#f97316]/10 transition-colors">
              View all cars from this dealer
            </Link>
          </div>

          {/* Enquiry form with WhatsApp */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold mb-4">Contact dealer</h3>
            <EnquiryForm
              carId={car.id}
              dealerId={dealer.id}
              carTitle={title}
              dealer={dealer}
            />
          </div>

          {/* Compare CTA */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-xs text-white/40 mb-2">Want to compare this car?</p>
            <Link href={`/compare?a=${car.id}`}
              className="text-sm text-[#f97316] font-semibold hover:text-orange-400 transition-colors">
              Add to comparison →
            </Link>
          </div>
        </div>
      </div>

      {/* Similar cars */}
      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-black mb-6">Similar cars</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {similar.map((c) => {
              const img = c.images[0]?.url;
              return (
                <Link key={c.id} href={`/cars/${c.id}`}
                  className="card-hover block bg-[#1a1a1a] border border-white/10 hover:border-[#f97316]/30 rounded-2xl overflow-hidden transition-all">
                  <div className="aspect-[16/10] bg-white/5">
                    {img ? <img src={img} alt={c.model} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-3xl">🚗</div>}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm">{c.year} {c.make} {c.model}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[#f97316] font-black text-base">{formatPrice(c.price)}</p>
                      <p className="text-[10px] text-white/30">{c.dealer?.name}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Similar cars section is the last thing rendered above ──
