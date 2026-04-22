import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, ShieldCheck, MessageCircle } from "lucide-react";
import { getSession } from "@/lib/auth";
import DealerReviews from "@/components/DealerReviews";
import DealerInventory from "@/components/DealerInventory";
import DealerLocationMap from "@/components/DealerLocationMap";

// Force dynamic and no-cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
  });

  if (!dealer) return { title: "Dealer Not Found" };

  return {
    title: `${dealer.name} | Verified Dealer`,
    description: `View inventory and reviews for ${dealer.name} on our platform.`,
  };
}

export default async function DealerPage(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
    include: {
      cars: {
        where: { available: true },
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      reviews: {
        include: { user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!dealer) {
    notFound();
  }

  const session = await getSession();
  const viewer = session?.user;

  // Check if viewing user has already reviewed
  const viewerReview = viewer ? dealer.reviews.find(r => r.userId === viewer.id) : null;

  const totalReviews = dealer.reviews.length;
  const averageRating = totalReviews > 0
    ? dealer.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
    : 0;
  const startedYear = new Date(dealer.createdAt).getFullYear();
  const mapsQuery = encodeURIComponent(
    [dealer.address || dealer.location, dealer.county, "Kenya"].filter(Boolean).join(", ")
  );
  const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const dealerRatingTags = [];
  if (totalReviews >= 8 && averageRating >= 4.5) {
    dealerRatingTags.push("Fair Pricing", "Clean Logbooks", "Good After-sales");
  } else if (totalReviews >= 3 && averageRating >= 4) {
    dealerRatingTags.push("Fair Pricing", "Smooth Process");
  } else if (totalReviews > 0) {
    dealerRatingTags.push("Rated by Buyers");
  }

  const whatsappNumber = dealer.whatsapp?.replace(/\D/g, "") || "";
  const whatsappPrefill = encodeURIComponent(
    `Hi, I'm viewing your showroom on MotorKE and I'd like to ask about your available cars.`
  );
  const whatsappChatHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappPrefill}`
    : null;

  // Contact links array
  const contactLinks = [];
  if (dealer.phone) {
    contactLinks.push({
      icon: <Phone className="w-4 h-4" />,
      label: "Call Us",
      href: `tel:${dealer.phone}`,
    });
  }
  if (dealer.whatsapp) {
    contactLinks.push({
      icon: <MessageCircle className="w-4 h-4" />,
      label: "WhatsApp",
      href: whatsappChatHref,
      external: true,
    });
  }
  if (dealer.website) {
    contactLinks.push({
      icon: <Globe className="w-4 h-4" />,
      label: "Website",
      href: dealer.website.startsWith('http') ? dealer.website : `https://${dealer.website}`,
      external: true,
    });
  }
  if (dealer.email) {
    contactLinks.push({
      icon: <Mail className="w-4 h-4" />,
      label: "Email",
      href: `mailto:${dealer.email}`,
    });
  }

  // Generate the gallery for the hero section
  const dealerGallery = dealer.cars
    .flatMap(c => c.images.map(i => ({ image: i.url, title: `${c.make} ${c.model}` })))
    .slice(0, 3);
  const hasHeroBanner = Boolean(dealer.bannerUrl) || dealerGallery.length >= 3;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.name,
    image: dealer.logoUrl || "https://motorke.co.ke/headerlogo.png",
    address: {
      "@type": "PostalAddress",
      addressLocality: dealer.location,
      addressRegion: dealer.county,
      addressCountry: "KE"
    },
    telephone: dealer.phone || dealer.whatsapp || undefined,
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Banner */}
      <div className="w-full h-[40vh] sm:h-[50vh] relative bg-[#111827] overflow-hidden">
         {dealer.bannerUrl ? (
           <img src={dealer.bannerUrl} alt={dealer.name} className="absolute inset-0 w-full h-full object-cover opacity-60" />
         ) : (
           <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-40">
              {dealerGallery.map((car, i) => (
                <div key={i} className="relative h-full w-full">
                  <Image src={car.image} alt={car.title} fill className="object-cover" />
                </div>
              ))}
           </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 max-w-7xl -mt-32 relative z-10 pb-20">
        
        {/* Dealership Info Card */}
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-8 sm:p-12 shadow-2xl mb-16" style={{ borderRadius: 'var(--radius)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Logo & Identity */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center">
               <div className="w-32 h-32 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-4 flex items-center justify-center shrink-0 overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                  {dealer.logoUrl ? <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-[#CBD5E0] dark:text-slate-700">{dealer.name[0]}</span>}
               </div>
               <div>
                  <div className="flex items-center gap-4 mb-4">
                     <h1 className="text-4xl sm:text-5xl font-bold text-[#111827] dark:text-white leading-tight tracking-tight">{dealer.name}</h1>
                     {dealer.verified && <span className="bg-[#38A169] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>VERIFIED STATION</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400">
                     <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#38A169]" /> {dealer.location || dealer.county}</span>
                     <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-[#38A169]" /> Member since {startedYear}</span>
                  </div>
               </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-4 flex flex-col gap-4">
               {dealer.whatsapp && (
                 <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="bg-[#38A169] text-white py-4 text-center text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                    Start Live Enquiry
                 </a>
               )}
               <div className="grid grid-cols-2 gap-4">
                  {dealer.phone && <a href={`tel:${dealer.phone}`} className="bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-3 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700" style={{ borderRadius: 'var(--radius)' }}>Call Direct</a>}
                  {dealer.website && <a href={dealer.website.startsWith('http') ? dealer.website : `https://${dealer.website}`} target="_blank" rel="noopener noreferrer" className="bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-3 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700" style={{ borderRadius: 'var(--radius)' }}>Visit Site</a>}
               </div>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800">
             <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-6">About the Station</h2>
             <div className="text-lg text-[#111827] dark:text-white leading-relaxed font-medium max-w-4xl editorial-heading">
                {dealer.description || `${dealer.name} is a cornerstone of our verified network, committed to operational excellence and transparency in asset logistics.`}
             </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-20">
            {/* Inventory */}
            <section>
              <div className="flex items-end justify-between mb-12">
                 <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-4">Showroom Inventory</h2>
                    <h3 className="text-3xl font-bold text-[#111827] dark:text-white uppercase tracking-tight">Live Listings.</h3>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400">{dealer.cars.length} Units Available</span>
              </div>
              <DealerInventory cars={dealer.cars} dealerSlug={dealer.slug} />
            </section>

            {/* Reviews Section */}
            <section id="reviews" className="pt-20 border-t border-[#EDF2F7]">
              <DealerReviews
                dealerSlug={dealer.slug}
                dealerName={dealer.name}
                averageRating={averageRating}
                totalReviews={totalReviews}
                reviews={dealer.reviews}
                viewer={viewer}
                viewerReview={viewerReview}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            {/* Map */}
            <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-1 overflow-hidden shadow-xl" style={{ borderRadius: 'var(--radius)' }}>
               <div className="h-[320px] bg-slate-50 dark:bg-slate-900">
                  <DealerLocationMap dealer={dealer} />
               </div>
               <div className="p-6">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-2">Station Address</h4>
                  <p className="text-sm font-bold text-[#111827] dark:text-white leading-relaxed">{dealer.address || dealer.location || "Nairobi, Kenya"}</p>
               </div>
            </div>

            {/* Stats / Badges */}
            <div className="bg-[#F7FAFC] dark:bg-[#111111] border border-slate-100 dark:border-slate-800 p-8 space-y-8" style={{ borderRadius: 'var(--radius)' }}>
               <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500 mb-4">Service Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                        <p className="text-2xl font-bold text-[#111827] dark:text-white">{dealer.cars.length}</p>
                        <p className="text-[9px] font-bold text-[#718096] dark:text-slate-400 uppercase tracking-widest mt-1">Stock</p>
                     </div>
                     <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800" style={{ borderRadius: 'var(--radius)' }}>
                        <p className="text-2xl font-bold text-[#111827] dark:text-white">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</p>
                        <p className="text-[9px] font-bold text-[#718096] dark:text-slate-400 uppercase tracking-widest mt-1">Rating</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  {[
                    "Verified Assets",
                    "Direct Logistics",
                    "Bank Finance Ready"
                  ].map((tag) => (
                    <div key={tag} className="flex items-center gap-3 text-xs font-bold text-[#111827] dark:text-white uppercase tracking-widest">
                       <ShieldCheck className="w-4 h-4 text-[#38A169]" /> {tag}
                    </div>
                  ))}
               </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Persistent Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-5 flex items-center gap-4 shadow-2xl">
         {dealer.phone && (
           <a href={`tel:${dealer.phone}`} className="flex-1 bg-[#111827] dark:bg-white text-white dark:!text-black py-4 text-center text-xs font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
              Call
           </a>
         )}
         {dealer.whatsapp && (
           <a href={whatsappChatHref} className="flex-1 bg-[#38A169] text-white py-4 text-center text-xs font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
              WhatsApp
           </a>
         )}
      </div>

    </div>
  );
}
