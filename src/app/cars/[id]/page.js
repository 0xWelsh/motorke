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
import { Search, ChevronRight, MapPin, ShieldCheck, TrendingUp, Banknote } from "lucide-react";

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
    <div className="bg-[#FCFCFD] min-h-screen pb-32">
      {/* ── BREADCRUMBS ── */}
      <div className="container mx-auto px-6 pt-10 max-w-7xl">
        <nav className="flex items-center gap-3 mb-12 overflow-x-auto pb-2 no-scrollbar">
          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight size={10} className="text-slate-200" />
          <Link href="/cars" className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-colors">Inventory</Link>
          <ChevronRight size={10} className="text-slate-200" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 whitespace-nowrap">{title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* ── MAIN CONTENT (Left) ── */}
          <div className="flex-1 space-y-16">
            
            {/* Header: Title & Pricing */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-slate-100">
               <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-2">
                     <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 uppercase tracking-widest rounded-lg">{car.year}</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Available Units</span>
                  </div>
                  <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[1.1]">{title}</h1>
                  <p className="text-slate-400 font-bold text-lg">{car.variant || "Standard Edition"}</p>
               </div>
               <div className="text-left md:text-right">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-2 block">Price Guide</span>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">
                    <span className="text-xl font-bold text-slate-300 mr-2">KES</span>
                    {formatPrice(car.price, true)}
                  </p>
                  {car.negotiable && <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-3">Negotiable Terms</p>}
               </div>
            </div>

            {/* Gallery Section */}
            <div className="rounded-[3.5rem] overflow-hidden shadow-2xl shadow-slate-900/5">
               <ImageGallery images={car.images} title={title} />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center gap-4 py-8 border-y border-slate-50">
               <ShareButtons title={title} price={formatPrice(car.price)} />
               <div className="w-px h-8 bg-slate-100 mx-2" />
               <SaveButton carId={car.id} initialSaved={isSaved} isLoggedIn={isLoggedIn} />
               <CompareButton car={car} />
               <PrintButton carId={car.id} />
               <TrackRecentView car={{ id: car.id, year: car.year, make: car.make, model: car.model, price: car.price, image: primaryImg?.url }} />
            </div>

            {/* About & Features section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
               {car.description && (
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Vehicle Narrative</h3>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed italic border-l-4 border-slate-100 pl-8 capitalize">
                      {car.description}
                    </p>
                 </div>
               )}
               {car.features?.length > 0 && (
                 <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Premium Features</h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                       {car.features.map(f => (
                         <div key={f} className="flex items-center gap-3 group">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform" />
                            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors capitalize">{f}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            {/* Technical Specifications Grid */}
            <div className="pt-16 border-t border-slate-100">
               <div className="flex items-center justify-between mb-12">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Technical Specifications</h3>
                  <div className="h-px flex-1 bg-slate-50 mx-8" />
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10">
                  {specs.map(({ label, value }) => (
                    <div key={label} className="group">
                       <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2.5 group-hover:text-emerald-500 transition-colors">{label}</p>
                       <p className="text-sm font-black text-slate-900 tracking-tight">{value}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Duty Estimate Section - Promoted */}
            <div className="bg-slate-50 rounded-[3rem] p-12 relative overflow-hidden group border border-slate-100">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32" />
               <div className="relative">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Kenya Revenue Authority</h3>
                  <p className="text-lg font-bold text-slate-900 mb-2">Indicative Import Duty</p>
                  <p className="text-5xl font-black text-slate-950 tracking-tighter">
                     <span className="text-xl font-bold text-slate-300 mr-3">Est. KES</span>
                     {formatPrice(duty, true)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-6 max-w-sm italic leading-relaxed">
                    * The duty mentioned is a raw estimate based on the vehicle year and value. 
                    Please consult our import desk or a licensed clearing agent for exact valuation.
                  </p>
               </div>
            </div>

          </div>

          {/* ── SIDEBAR STATS (Right) ── */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-8">
              
              {/* Vital Stats Card */}
              <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-2xl shadow-slate-900/5">
                 <div className="flex items-center gap-3 mb-10">
                    <TrendingUp size={16} className="text-emerald-500" />
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Vehicle Pulse</h3>
                 </div>
                 
                 <div className="space-y-8">
                    {[
                      { label: "Condition", value: car.condition },
                      { label: "Odometer",  value: formatMileage(car.mileage) },
                      { label: "Gearbox",   value: TRANSMISSION_LABELS[car.transmission] },
                      { label: "Fuel Cell",  value: FUEL_LABELS[car.fuelType] },
                      { label: "Unit ID",     value: car.id.slice(-8).toUpperCase() }
                    ].map(stat => (
                      <div key={stat.label} className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5">{stat.label}</span>
                        <span className="text-sm font-black text-slate-900">{stat.value}</span>
                      </div>
                    ))}
                 </div>

                 <div className="mt-12 pt-10 border-t border-slate-50">
                    <CompareButton car={car} variant="full" />
                 </div>
              </div>

              {/* Dealer & Action Card */}
              <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-2xl shadow-slate-900/5 overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
                 
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-900 text-xl border border-slate-100 uppercase">
                       {dealer.name[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-black text-sm text-slate-900 leading-none">{dealer.name}</p>
                          {dealer.verified && <ShieldCheck size={14} className="text-emerald-500" />}
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{dealer.location}</p>
                    </div>
                 </div>

                 <EnquiryForm
                    carId={car.id}
                    dealerId={dealer.id}
                    carTitle={title}
                    dealer={dealer}
                 />

                 <div className="mt-8 pt-8 border-t border-slate-50">
                    <Link href={`/dealers/${dealer.slug}`} className="flex items-center justify-between group">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[var(--brand)] transition-colors">View Showroom Inventory</span>
                       <ChevronRight size={14} className="text-slate-200 group-hover:text-[var(--brand)] transition-all transform group-hover:translate-x-1" />
                    </Link>
                 </div>
              </div>

            </div>
          </aside>

        </div>

        {/* Similar Inventory Section */}
        {similar.length > 0 && (
          <div className="mt-32 pt-24 border-t border-slate-100">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
               <div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-3 block">Recommendation Engine</span>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Similar Inventory</h2>
               </div>
               <Link href="/cars" className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 flex items-center gap-2">
                 Explore All Units <ChevronRight size={14} />
               </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
              {similar.map((c) => {
                const simImg = c.images[0]?.url;
                const simTitle = `${c.make} ${c.model}`;
                return (
                  <Link key={c.id} href={`/cars/${c.id}`} className="group block bg-white border border-slate-50 hover:border-slate-200 rounded-[3rem] overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-slate-900/5">
                    <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden border-b border-slate-50">
                      {simImg ? (
                        <Image 
                          src={simImg} 
                          alt={simTitle} 
                          fill 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" 
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-200 text-[10px] font-black uppercase tracking-widest">No Image</div>
                      )}
                      <div className="absolute top-6 left-6">
                         <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 border border-white/20 shadow-sm">{c.year}</span>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-[var(--brand)] transition-colors">{simTitle}</h3>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{c.dealer?.name}</p>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <p className="text-xl font-black text-slate-900">
                          <span className="text-xs font-bold text-slate-300 mr-1.5">KES</span>
                          {formatPrice(c.price, true)}
                        </p>
                        <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-slate-900 text-slate-200 group-hover:text-white flex items-center justify-center transition-all duration-500 border border-slate-100">
                           <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <SpecSheet car={car} dealer={dealer} />
    </div>
  );
}

// ── Similar cars section is the last thing rendered above ──
