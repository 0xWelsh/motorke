// src/app/page.js
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatPrice, formatCarPrice } from "@/lib/utils";
import Link from "next/link";
import NewsRibbon from "@/components/NewsRibbon";
import HeroReviews from "@/components/HeroReviews";
import BrowsePanel from "@/components/BrowsePanel";
import {
  ArrowUpRight, ChevronRight, MapPin, ShieldCheck, Star, BadgeCheck, Compass
} from "lucide-react";
import Image from "next/image";
import { unstable_cache } from "next/cache";

const HERO_BACKGROUND = "/images/mercedes.jpg";


const getCachedData = unstable_cache(
  async () => {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [featured, hotThisWeek, newArrivals, dealers, newsItems] = await Promise.all([
      db.car.findMany({
        where: { available: true, featured: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.car.findMany({
        where: { available: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, verified: true, slug: true } },
          _count: { select: { carViews: true } },
        },
        take: 100, // Get more to sort by views in memory
      }),
      db.car.findMany({
        where: { available: true, createdAt: { gte: week } },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          dealer: { select: { id: true, name: true, location: true, slug: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      db.dealer.findMany({
        where: { OR: [{ featured: true }, { verified: true }] },
        include: {
          _count: { select: { cars: { where: { available: true } } } },
          users: { select: { avatarUrl: true }, take: 1 },
        },
        take: 8,
        orderBy: [{ featured: "desc" }, { verified: "desc" }, { createdAt: "desc" }],
      }),
      db.article.findMany({
        orderBy: { publishedAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          url: true,
          sourceName: true,
          publishedAt: true,
        },
      }),
    ]);
    return { featured, hotThisWeek, newArrivals, dealers, newsItems };
  },
  ["homepage-minimal-v5"],
  { revalidate: 900, tags: ["homepage"] }
);


export default async function HomePage() {
  const { featured, hotThisWeek, newArrivals, dealers, newsItems } = await getCachedData();
  
  // Sort hot cars by view count and take top 8
  const hotSorted = (hotThisWeek || [])
    .filter(car => car && car._count?.carViews > 0)
    .sort((a, b) => (b._count?.carViews || 0) - (a._count?.carViews || 0))
    .slice(0, 8);
  
  // Priority: Hot This Week (with views) > Featured > New Arrivals
  const spotlight = hotSorted.length > 0 ? hotSorted : (featured && featured.length > 0) ? featured : newArrivals;
  const heroPrimary = spotlight?.[0] || null;

  return (
    <div className="min-h-screen pb-20 bg-white">
      {/* Dynamic Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-gray-100">
        <div className="container mx-auto px-6 max-w-7xl relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-[#111827] dark:text-[#b9c5e0] leading-[0.95] tracking-tight mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Moving the world<br />
              <span className="editorial-heading text-[#38A169]">with transparency.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[#2D3748] leading-relaxed max-w-2xl font-medium mb-12">
              Experience a minimalist approach to car buying. We connect verified dealerships 
              directly to savvy buyers, removing the noise and clutter of traditional marketplaces.
            </p>

            <div className="w-full max-w-2xl">
              <BrowsePanel />
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-12">
              <Link href="/cars" className="bg-[#1A202C] text-white px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all hover:scale-[0.98] active:scale-95" style={{ borderRadius: 'var(--radius)' }}>
                Explore Inventory
              </Link>
              <Link href="/signup?role=DEALER" className="text-[#1A202C] text-xs font-bold uppercase tracking-widest border border-[#1A202C] px-8 py-4 transition-all hover:bg-[#1A202C] hover:text-white" style={{ borderRadius: 'var(--radius)' }}>
                Partner With Us
              </Link>
            </div>
          </div>
        </div>

        {/* Mercedes Brand Background Texture */}
        <div className="absolute inset-0 -z-0 overflow-hidden pointer-events-none">
          <Image 
            src={HERO_BACKGROUND} 
            fill 
            className="object-cover" 
            style={{ opacity: 0.06 }}
            alt="" 
            priority
          />
          {/* Subtle gradient overlay to ensure text contrast on mobile if needed */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent lg:hidden" />
        </div>
      </section>


      {/* Spotlight / Trending Section */}
      {hotSorted.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
               <div className="max-w-xl">
                 <h2 className="text-3xl sm:text-5xl font-bold text-[#1A202C] mb-4">Spotlight</h2>
                 <p className="text-[#718096] text-lg font-medium">Verified listings currently receiving the most interest from our network.</p>
               </div>
               <Link href="/cars?sort=popular" className="text-[#1A202C] text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity">
                 View Trending <ArrowUpRight className="w-4 h-4" />
               </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {hotSorted.slice(0, 4).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Dealerships */}
      {dealers.length > 0 && (
        <section className="py-24 sm:py-32 bg-[#F7FAFC]">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="mb-20 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-5xl font-bold text-[#1A202C] mb-6">Partner Dealerships</h2>
              <p className="text-[#718096] text-lg font-medium leading-relaxed">
                We work exclusively with certified dealerships that meet our strict standards for 
                pricing transparency and vehicle verification.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {dealers.slice(0, 6).map((dealer) => (
                <Link
                  key={dealer.id}
                  href={`/dealers/${dealer.slug}`}
                  className="group block bg-white border border-[#E2E8F0] p-8 transition-all hover:shadow-xl"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 shrink-0 border border-[#EDF2F7] overflow-hidden flex items-center justify-center p-2" style={{ borderRadius: 'var(--radius)' }}>
                      {dealer.logoUrl ? (
                         <img src={dealer.logoUrl} className="w-full h-full object-contain" alt="" />
                      ) : (
                         <span className="text-xl font-bold text-[#1A202C]">{dealer.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1A202C] text-lg mb-1 group-hover:text-[#38A169] transition-colors">{dealer.name}</h3>
                      <p className="text-xs font-bold text-[#718096] uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {dealer.location}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-[#4A5568] leading-relaxed mb-10 line-clamp-2">
                    {dealer.description || "Partnering with Motorske to provide premium verified vehicles."}
                  </p>
                  <div className="pt-6 border-t border-[#EDF2F7] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A202C] uppercase tracking-widest">{dealer._count?.cars || 0} Units</span>
                    <span className="text-xs font-bold text-[#38A169] uppercase tracking-widest">Visit Showroom ›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial Information Block */}
      <section className="py-24 sm:py-48 bg-[#1A202C] text-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div>
               <p className="text-[#38A169] text-xs font-bold uppercase tracking-[0.4em] mb-8">The Difference</p>
               <h2 className="text-4xl sm:text-6xl font-bold leading-[1.1] mb-10">
                 Marketplace purity<br />
                 <span className="editorial-heading text-[#718096]">without the hassle.</span>
               </h2>
               <p className="text-lg text-[#A0AEC0] leading-relaxed max-w-xl font-medium">
                 Tired of recycled listings and unverified sellers? Motorske provides a direct link 
                 to the actual stock sitting on dealership floors. No middlemen, no scraped data, 
                 just high-fidelity inventory.
               </p>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
               {[
                 { title: "Dealer Verified", icon: <ShieldCheck />, desc: "Every unit is hand-uploaded by real businesses." },
                 { title: "Duty Analysis", icon: <BadgeCheck />, desc: "Transparent breakdown of KRA duties and fees." },
                 { title: "Direct Contact", icon: <Star />, desc: "Communicate directly via WhatsApp or Phone." },
                 { title: "Fresh Stock", icon: <Compass />, desc: "Listings are removed the second they sell." },
               ].map((item, i) => (
                 <div key={i} className="flex flex-col gap-4">
                   <div className="text-[#38A169]">{item.icon}</div>
                   <h3 className="font-bold text-lg">{item.title}</h3>
                   <p className="text-sm text-[#A0AEC0] leading-relaxed font-medium">{item.desc}</p>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Fresh Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="text-3xl sm:text-5xl font-bold text-[#1A202C] mb-4">Fresh Arrivals</h2>
                <p className="text-[#718096] text-lg font-medium">The latest units added to our network within the last 7 days.</p>
              </div>
              <Link href="/cars?sort=newest" className="hidden sm:block text-xs font-bold uppercase tracking-widest bg-[#EDF2F7] text-[#1A202C] px-8 py-4 transition-all hover:bg-[#E2E8F0]" style={{ borderRadius: 'var(--radius)' }}>
                See All Arrivals
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {newArrivals.slice(0, 8).map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

function CarCard({ car }) {
  const img = car.images?.[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`;
  
  return (
    <article className="group flex flex-col h-full transition-all">
      <Link href={`/cars/${car.id}`} className="relative aspect-[4/3] bg-[#EDF2F7] overflow-hidden mb-6 block" style={{ borderRadius: 'var(--radius)' }}>
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#718096] text-[10px] font-bold uppercase tracking-widest">No Image Available</div>
        )}
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-md text-[#1A202C] text-[9px] font-bold px-2 py-1 uppercase tracking-widest shadow-sm" style={{ borderRadius: '2px' }}>
            {car.condition || "VERIFIED"}
          </span>
        </div>
      </Link>

      <div className="flex flex-col flex-1">
        <div className="mb-4">
          <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1">{car.dealer?.name || "Verified Dealer"}</p>
          <Link href={`/cars/${car.id}`}>
            <h3 className="text-base font-bold text-[#1A202C] group-hover:text-[#38A169] transition-colors line-clamp-1">{title}</h3>
          </Link>
        </div>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#EDF2F7]">
          <div>
            <p className="text-lg font-bold text-[#1A202C]">{formatCarPrice(car)}</p>
          </div>
          <Link href={`/cars/${car.id}`} className="text-[#38A169] text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:opacity-70 transition-opacity">
            Details <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
