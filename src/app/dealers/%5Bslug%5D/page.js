import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, BODY_TYPE_LABELS, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { 
  Phone, 
  MessageSquare, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Package,
  Clock
} from "lucide-react";
import { CompareButton } from "@/components/CompareSelector";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dealer = await db.dealer.findUnique({ where: { slug } });
  if (!dealer) return {};
  return { title: `${dealer.name} — Motorke Showroom` };
}

export default async function DealerShowcasePage({ params }) {
  const { slug } = await params;
  const dealer = await db.dealer.findUnique({
    where: { slug },
    include: {
      cars: {
        where: { available: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dealer) notFound();

  const stats = [
    { label: "Live Listings", value: dealer.cars.length, icon: <Package className="text-orange-500" /> },
    { label: "Verified Since", value: new Date(dealer.createdAt).getFullYear(), icon: <ShieldCheck className="text-emerald-500" /> },
    { label: "Location", value: dealer.county, icon: <MapPin className="text-blue-500" /> },
  ];

  return (
    <div className="bg-[#0a0a0a] min-h-screen pb-24">
      {/* ── DEALER HERO ── */}
      <div className="relative border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="container mx-auto px-6 py-20 max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-12 lg:items-center">
            {/* Logo / Brand Mark */}
            <div className="w-32 h-32 rounded-[3rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl font-black text-orange-500 relative shrink-0 shadow-2xl">
              {dealer.logoUrl ? (
                <Image src={dealer.logoUrl} alt={dealer.name} fill className="object-cover p-4" />
              ) : (
                dealer.name[0]
              )}
              {dealer.verified && (
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-black w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0a0a0a] shadow-lg shadow-emerald-500/20">
                  <ShieldCheck size={20} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Official Dealer Partner</span>
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">{dealer.name}</h1>
                <p className="text-white/40 max-w-2xl text-lg font-medium leading-relaxed">
                  {dealer.description || `Welcome to ${dealer.name}. Explore our handpicked selection of premium automotive units, verified for quality and performance in ${dealer.county}.`}
                </p>
              </div>

              {/* Quick Metadata */}
              <div className="flex flex-wrap gap-8">
                {stats.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-white font-black text-sm">{s.value}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA / Contact Panel */}
            <div className="lg:w-80 space-y-3">
               <div className="p-6 bg-white/[0.02] border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
                    <TrendingUp size={12} className="text-orange-500" /> Connect Direct
                  </h3>
                  <div className="space-y-2">
                    <a href={`tel:${dealer.phone}`} className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                       <span className="text-xs font-black text-white/60 group-hover:text-white uppercase tracking-widest">Voice Call</span>
                       <Phone size={16} className="text-orange-500" />
                    </a>
                    {dealer.whatsapp && (
                      <a href={`https://wa.me/${dealer.whatsapp}`} className="flex items-center justify-between w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 transition-all group">
                         <span className="text-xs font-black text-emerald-500/60 group-hover:text-emerald-500 uppercase tracking-widest">WhatsApp</span>
                         <MessageSquare size={16} className="text-emerald-500" />
                      </a>
                    )}
                    {dealer.website && (
                      <a href={dealer.website} target="_blank" className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                         <span className="text-xs font-black text-white/60 group-hover:text-white uppercase tracking-widest">Website</span>
                         <Globe size={16} className="text-blue-400" />
                      </a>
                    )}
                  </div>
               </div>
               <div className="flex items-center gap-2 px-6 py-4 bg-orange-600/5 border border-orange-500/10 rounded-2xl">
                 <MapPin size={14} className="text-orange-500 shrink-0" />
                 <p className="text-[10px] font-black text-orange-500/80 uppercase tracking-widest">{dealer.location}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INVENTORY FEED ── */}
      <div className="container mx-auto px-6 py-20 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
           <div>
              <h2 className="text-3xl font-black text-white tracking-tight mb-2">Showcase Inventory</h2>
              <p className="text-white/30 text-sm font-medium">Currently viewing {dealer.cars.length} verified units from {dealer.name}.</p>
           </div>
           {/* Add a simple internal search/filter later if needed */}
        </div>

        {dealer.cars.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <p className="text-white/20 font-black uppercase tracking-widest text-xs">Inventory currently in preparation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {dealer.cars.map((car) => (
              <InventoryCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InventoryCard({ car }) {
  const img   = car.images[0]?.url;
  const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;

  return (
    <Link href={`/cars/${car.id}`} className="group block bg-white/[0.02] border border-white/5 hover:border-orange-500/30 overflow-hidden transition-all duration-300">
      <div className="relative aspect-[16/10] bg-white/5 overflow-hidden">
        {img ? (
            <Image 
              src={img} 
              alt={title} 
              fill 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] font-bold uppercase tracking-widest font-black">No Image</div>
        )}
        
        {/* Badges Overlay */}
        {car.badges?.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1">
            {car.badges.map((b) => (
              <span key={b} className={`text-[8px] font-black px-2 py-0.5 border uppercase tracking-tighter ${BADGE_OPTIONS[b]?.color || "bg-white/10 text-white/60 border-white/10"}`}>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[9px] font-black bg-white/10 text-orange-400 px-2 py-0.5 uppercase tracking-wider shrink-0">
            {car.year}
          </span>
          <h3 className="font-bold text-white text-sm leading-tight truncate group-hover:text-orange-500 transition-colors">
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
           {[FUEL_LABELS[car.fuelType], car.transmission, car.bodyType].map(s => (
             <span key={s} className="text-[9px] font-black uppercase tracking-tighter border border-white/10 px-1.5 py-0.5">{s}</span>
           ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <p className="text-base font-black text-orange-500">{formatPrice(car.price)}</p>
          <div className="flex items-center gap-2">
             <CompareButton car={car} />
             <ArrowRight size={14} className="text-white/20 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  );
}
