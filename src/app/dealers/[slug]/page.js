// src/app/dealers/[slug]/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatPrice, formatMileage, FUEL_LABELS, BADGE_OPTIONS } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronRight, Globe, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { CompareButton } from "@/components/CompareSelector";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const dealer = await db.dealer.findUnique({ where: { slug } });
  if (!dealer) return {};
  return { title: `${dealer.name} — Motorke Kenya` };
}

export default async function DealerPage({ params }) {
  const { slug } = await params;

  const dealer = await db.dealer.findUnique({
    where:   { slug },
    include: {
      cars: {
        where:   { available: true },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!dealer) notFound();

  const makes = [...new Set(dealer.cars.map((c) => c.make))];
  const contactLinks = [
    dealer.phone ? { href: `tel:${dealer.phone}`, label: "Call", icon: <Phone className="w-4 h-4" /> } : null,
    dealer.whatsapp ? { href: `https://wa.me/${dealer.whatsapp}`, label: "WhatsApp", icon: <MessageCircle className="w-4 h-4" />, external: true } : null,
    dealer.email ? { href: `mailto:${dealer.email}`, label: "Email", icon: <Mail className="w-4 h-4" /> } : null,
    dealer.website ? { href: dealer.website, label: "Website", icon: <Globe className="w-4 h-4" />, external: true } : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <section className="bg-white border border-[#e8e2d9] shadow-sm rounded-[2rem] p-8 md:p-10 mb-12 relative overflow-hidden">
          <div className="absolute -top-10 -right-8 w-56 h-56 bg-[#ff5a2f]/10 rounded-full blur-3xl" />

          <div className="relative flex flex-col lg:flex-row items-start gap-8">
            <div className="w-28 h-28 rounded-3xl bg-[#faf7f2] border border-[#ece6dd] text-slate-900 flex items-center justify-center font-black text-5xl shrink-0 shadow-sm overflow-hidden">
            {dealer.logoUrl ? (
                <Image src={dealer.logoUrl} alt={dealer.name} width={112} height={112} className="w-full h-full object-cover" />
            ) : (
              dealer.name[0]
            )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-4xl md:text-5xl text-slate-900 tracking-tight">{dealer.name}</h1>
                {dealer.verified && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
              </div>

              <p className="text-slate-500 font-bold text-xs mb-4 flex items-center gap-2 uppercase tracking-[0.12em]">
                <MapPin className="w-3.5 h-3.5" /> {dealer.address || dealer.location}
              </p>

              <p className="text-slate-600 text-base leading-relaxed max-w-3xl mb-6">
                {dealer.description || `${dealer.name} maintains a curated selection of vehicles for buyers who want trusted listings, clear pricing, and direct contact with a real dealership team.`}
              </p>

              <div className="flex flex-wrap gap-2.5">
                {contactLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="mk-pill-btn inline-flex items-center gap-2 bg-white border border-[#e7e1d8] text-slate-700 hover:text-black hover:bg-[#faf7f2] px-4 py-2.5 text-[10px] uppercase tracking-[0.14em] transition-all"
                  >
                    {item.icon} {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
              {[
                { label: "Live Cars", value: dealer.cars.length },
                { label: "Brands", value: makes.length },
                { label: "County", value: dealer.county || "N/A" },
              ].map((item) => (
                <div key={item.label} className="text-center bg-[#faf7f2] border border-[#ece6dd] rounded-2xl px-5 py-4 min-w-[120px]">
                  <p className="text-2xl font-bold text-slate-900 leading-none">{item.value}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-extrabold mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

        </section>

      {makes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {makes.map(make => (
            <span key={make} className="text-[10px] bg-white border border-[#e7e1d8] rounded-full px-4 py-2 text-slate-600 font-extrabold uppercase tracking-[0.14em] shadow-sm">
              {make}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500 mb-2">Inventory</p>
          <h2 className="text-3xl md:text-4xl text-slate-900 tracking-tight">Current Listings</h2>
        </div>
        <Link href="/cars" className="hidden sm:inline-flex mk-pill-btn items-center gap-2 border border-[#e7e1d8] bg-white px-4 py-2.5 text-[10px] uppercase text-slate-700 hover:bg-[#faf7f2]">
          View All Cars <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {dealer.cars.length === 0 ? (
        <div className="bg-white border border-[#e7e1d8] rounded-[2rem] p-20 text-center shadow-sm">
          <p className="text-slate-400 text-sm font-extrabold uppercase tracking-[0.14em]">No active listings yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dealer.cars.map((car) => {
            const img   = car.images[0]?.url;
            const title = `${car.make} ${car.model}${car.variant ? ` ${car.variant}` : ""}`;
            const specs = [
              car.fuelType && FUEL_LABELS[car.fuelType],
              car.transmission === "AUTOMATIC" ? "Auto" : car.transmission === "MANUAL" ? "Manual" : car.transmission,
              car.mileage ? `${Math.round(car.mileage / 1000)}k km` : null,
            ].filter(Boolean);

            const compareCar = {
              ...car,
              image: img,
              model: `${car.make} ${car.model}`,
            };

            return (
              <article key={car.id} className="group bg-white border border-[#e8e2d9] hover:border-[#d8cec1] overflow-hidden transition-all duration-500 rounded-3xl shadow-sm hover:shadow-xl flex flex-col">
                <Link href={`/cars/${car.id}`} className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                  {img ? (
                    <Image src={img} alt={title} fill className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No Image</div>
                  )}
                  {car.badges?.length > 0 && (
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {car.badges.slice(0, 2).map((b) => (
                        <span key={b} className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border ${BADGE_OPTIONS[b]?.color || "bg-white/90 text-slate-700 border-white"}`}>
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <Link href={`/cars/${car.id}`} className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2 group-hover:text-black transition-colors">{title}</h3>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">{car.year}</p>
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    {specs.map((s) => (
                      <span key={s} className="text-[10px] font-semibold text-slate-600 bg-[#faf7f2] border border-[#efe8df] px-2 py-1 rounded-full">{s}</span>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-[#efe8df] space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-slate-900">{formatPrice(car.price)}</p>
                      <Link href={`/cars/${car.id}`} className="mk-pill-btn inline-flex items-center gap-1.5 border border-[#e7e1d8] px-3 py-2 text-[10px] uppercase text-slate-700 hover:bg-[#faf7f2]">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <CompareButton car={compareCar} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
