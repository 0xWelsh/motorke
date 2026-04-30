import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, ShieldCheck, MessageCircle } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { getSession } from "@/lib/auth";
import DealerReviews from "@/components/DealerReviews";
import DealerInventory from "@/components/DealerInventory";
import { calculateDistance } from "@/lib/geolocation";
import { absoluteUrl } from "@/lib/site-url";

// Force dynamic and no-cache
export const dynamic = "force-dynamic";
export const revalidate = 0;

function withProtocol(url) {
  if (!url) return null;
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

export async function generateMetadata(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      description: true,
      county: true,
      location: true,
      bannerUrl: true,
      logoUrl: true,
    },
  });

  if (!dealer) return { title: "Dealer Not Found" };

  const place = dealer.location || dealer.county || "Kenya";
  const title = `${dealer.name} — dealer showroom in ${place}`;
  const description =
    (dealer.description && dealer.description.trim().slice(0, 158)) ||
    `View live inventory and reviews for ${dealer.name} in ${place}. Contact the dealer on Welsh Motorhub.`;

  const ogCand = dealer.bannerUrl || dealer.logoUrl;
  const ogImage = ogCand
    ? /^https?:\/\//i.test(ogCand)
      ? ogCand
      : absoluteUrl(ogCand.startsWith("/") ? ogCand : `/${ogCand}`)
    : absoluteUrl("/newlogo.jpeg");

  const canonical = `/dealers/${dealer.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: "Welsh Motorhub",
      locale: "en_KE",
      images: [{ url: ogImage }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function DealerPage(props) {
  const params = await props.params;
  const dealer = await db.dealer.findUnique({
    where: { slug: params.slug },
    include: {
      cars: {
        where: { available: true },
        select: {
          id: true,
          make: true,
          model: true,
          variant: true,
          year: true,
          price: true,
          engineCC: true,
          mileage: true,
          bodyType: true,
          fuelType: true,
          transmission: true,
          featured: true,
          badges: true,
          description: true,
          available: true,
          steering: true,
          horsepower: true,
          torque: true,
          cylinders: true,
          turbo: true,
          updatedAt: true,
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
  const userLat = Number.isFinite(viewer?.lat) ? viewer.lat : null;
  const userLng = Number.isFinite(viewer?.lng) ? viewer.lng : null;
  const dealerLat = Number.isFinite(dealer?.lat) ? dealer.lat : null;
  const dealerLng = Number.isFinite(dealer?.lng) ? dealer.lng : null;
  const dealerDistanceKm =
    userLat != null && userLng != null && dealerLat != null && dealerLng != null
      ? calculateDistance(userLat, userLng, dealerLat, dealerLng)
      : null;
  const dealerDistanceLabel =
    dealerDistanceKm == null
      ? null
      : dealerDistanceKm < 1
        ? `${Math.round(dealerDistanceKm * 1000)} m away`
        : `${dealerDistanceKm.toFixed(1)} km away`;
  const inventoryWithDistance = dealer.cars.map((car) => ({
    ...car,
    distance: dealerDistanceKm,
  }));
  const latestInventoryUpdate =
    dealer.cars.length > 0
      ? new Date(Math.max(...dealer.cars.map((car) => new Date(car.updatedAt).getTime())))
      : null;
  const inventoryFreshnessDays = latestInventoryUpdate
    ? Math.max(0, Math.floor((Date.now() - latestInventoryUpdate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const inventoryFreshnessLabel =
    inventoryFreshnessDays == null ? null : `${inventoryFreshnessDays} day${inventoryFreshnessDays === 1 ? "" : "s"} ago`;
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
      href: withProtocol(dealer.website),
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

  const socialLinks = [
    { key: "instagram", label: "Instagram", href: withProtocol(dealer.instagramUrl), icon: <SiInstagram className="w-3.5 h-3.5" style={{ color: "#E4405F" }} /> },
    { key: "facebook", label: "Facebook", href: withProtocol(dealer.facebookUrl), icon: <SiFacebook className="w-3.5 h-3.5" style={{ color: "#1877F2" }} /> },
    { key: "tiktok", label: "TikTok", href: withProtocol(dealer.tiktokUrl), icon: <SiTiktok className="w-3.5 h-3.5 text-slate-900 dark:text-white" /> },
  ].filter((item) => Boolean(item.href));

  // Generate the gallery for the hero section
  const dealerGallery = dealer.cars
    .flatMap(c => c.images.map(i => ({ image: i.url, title: `${c.make} ${c.model}` })))
    .slice(0, 3);
  const hasHeroBanner = Boolean(dealer.bannerUrl) || dealerGallery.length >= 3;

  const absAsset = (u) => {
    if (!u) return absoluteUrl("/headerlogo.png");
    if (/^https?:\/\//i.test(u)) return u;
    return absoluteUrl(u.startsWith("/") ? u : `/${u}`);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealer.name,
    url: absoluteUrl(`/dealers/${dealer.slug}`),
    image: absAsset(dealer.logoUrl),
    address: {
      "@type": "PostalAddress",
      addressLocality: dealer.location,
      addressRegion: dealer.county,
      addressCountry: "KE",
    },
    telephone: dealer.phone || dealer.whatsapp || undefined,
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Banner */}
      <div className="w-full h-[32vh] sm:h-[42vh] lg:h-[50vh] relative bg-[#111827] overflow-hidden">
         {dealer.bannerUrl ? (
           <img
             src={dealer.bannerUrl}
             alt={dealer.name}
             className="absolute inset-0 w-full h-full object-cover opacity-[0.86] sm:opacity-65"
           />
         ) : (
           <div className="absolute inset-0 grid grid-cols-3 gap-1 opacity-72 sm:opacity-40">
              {dealerGallery.map((car, i) => (
                <div key={i} className="relative h-full w-full">
                  <Image src={car.image} alt={car.title} fill className="object-cover" />
                </div>
              ))}
           </div>
         )}
         <div
           className="absolute inset-0 bg-gradient-to-t to-transparent from-white/50 dark:from-[#0a0a0a]/55 via-white/5 dark:via-[#0a0a0a]/10 sm:from-white/90 sm:dark:from-[#0a0a0a]/85 sm:via-transparent"
         />
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl -mt-20 sm:-mt-28 lg:-mt-32 relative z-10 pb-20">
        
        {/* Dealership Info Card */}
        <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-8 lg:p-12 shadow-2xl mb-12 sm:mb-16" style={{ borderRadius: 'var(--radius)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-10 lg:gap-12 items-start">
            
            {/* Logo & Identity */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row gap-5 sm:gap-7 items-start sm:items-center">
               <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 p-3 sm:p-4 flex items-center justify-center shrink-0 overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                  {dealer.logoUrl ? <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-[#CBD5E0] dark:text-slate-700">{dealer.name[0]}</span>}
               </div>
               <div>
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mb-3 sm:mb-4">
                     <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-[#111827] dark:text-white leading-tight tracking-tight">{dealer.name}</h1>
                     {dealer.verified && <span className="bg-[#38A169] text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest" style={{ borderRadius: '2px' }}>VERIFIED DEALER</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400">
                     <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#38A169]" /> {dealer.location || dealer.county}</span>
                     {dealerDistanceLabel && (
                       <span className="flex items-center gap-2 text-[#38A169]"><MapPin className="w-3 h-3" /> {dealerDistanceLabel}</span>
                     )}
                     <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-[#38A169]" /> Member since {startedYear}</span>
                  </div>
               </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4 w-full">
               {dealer.whatsapp && (
                 <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="w-full bg-[#38A169] text-white py-3.5 text-center text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-transform hover:scale-[0.98]" style={{ borderRadius: 'var(--radius)' }}>
                    Start Live Enquiry
                 </a>
               )}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {dealer.phone && <a href={`tel:${dealer.phone}`} className="w-full bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-3 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700" style={{ borderRadius: 'var(--radius)' }}>Call Direct</a>}
                  {dealer.website && <a href={withProtocol(dealer.website)} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-3 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700" style={{ borderRadius: 'var(--radius)' }}>Visit Site</a>}
               </div>
               {socialLinks.length > 0 && (
                 <div className="space-y-2">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400">
                     Socials
                   </p>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                   {socialLinks.map((item) => (
                     <a
                       key={item.key}
                       href={item.href}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-3 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center gap-2"
                       style={{ borderRadius: "var(--radius)" }}
                     >
                       {item.icon}
                       {item.label}
                     </a>
                   ))}
                   </div>
                 </div>
               )}
            </div>
          </div>

          <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-slate-100 dark:border-slate-800">
             <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-6">About the Station</h2>
             <div className="text-base sm:text-lg text-[#111827] dark:text-white leading-relaxed font-medium font-sans max-w-4xl">
                {dealer.description || `${dealer.name} is a cornerstone of our verified network, committed to operational excellence and transparency in asset logistics.`}
             </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 lg:gap-16">
          
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-14 sm:space-y-20">
            {/* Inventory */}
            <section>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-3">
                 <div>
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#718096] dark:text-slate-500 mb-4">Showroom Inventory</h2>
                    <h3 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white uppercase tracking-tight">Live Listings.</h3>
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-400">{dealer.cars.length} Units Available</span>
              </div>
              <DealerInventory cars={inventoryWithDistance} dealerSlug={dealer.slug} />
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
          <aside className="lg:col-span-4 space-y-8 sm:space-y-12">
            {/* Google Maps Link */}
            <div className="bg-white dark:bg-[#111111] border border-[#E2E8F0] dark:border-slate-800 p-5 sm:p-6 overflow-hidden shadow-xl" style={{ borderRadius: 'var(--radius)' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#718096] dark:text-slate-500">Dealer Address</h4>
                {dealerDistanceLabel && (
                  <span className="text-[10px] font-bold text-[#38A169] uppercase tracking-[0.12em]">{dealerDistanceLabel}</span>
                )}
              </div>
              <p className="text-sm font-bold text-[#111827] dark:text-white leading-relaxed">
                {dealer.address || dealer.location || "Nairobi, Kenya"}
              </p>
              <a
                href={googleMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                style={{ borderRadius: "var(--radius)" }}
              >
                Open in Google Maps
              </a>
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
                  <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800 space-y-2" style={{ borderRadius: 'var(--radius)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#718096] dark:text-slate-400">Response cue</p>
                    <p className="text-sm font-bold text-[#111827] dark:text-white">
                      {dealer.whatsapp ? "Fastest response on WhatsApp" : dealer.phone ? "Best reached via direct call" : "Use enquiry form for replies"}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-4 border border-[#E2E8F0] dark:border-slate-800 space-y-2" style={{ borderRadius: 'var(--radius)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#718096] dark:text-slate-400">Inventory freshness</p>
                    <p className="text-sm font-bold text-[#111827] dark:text-white">
                      {inventoryFreshnessLabel ? `Updated ${inventoryFreshnessLabel}` : "No recent inventory updates"}
                    </p>
                  </div>
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-4 py-4 shadow-2xl">
         <div className="flex items-center gap-3">
           {dealer.phone && (
             <a href={`tel:${dealer.phone}`} className="flex-1 bg-[#111827] dark:bg-white text-white dark:!text-black py-3.5 text-center text-[11px] font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                Call
             </a>
           )}
           {dealer.whatsapp && (
             <a href={whatsappChatHref} className="flex-1 bg-[#38A169] text-white py-3.5 text-center text-[11px] font-bold uppercase tracking-widest" style={{ borderRadius: 'var(--radius)' }}>
                WhatsApp
             </a>
           )}
         </div>
         {socialLinks.length > 0 && (
           <div className="mt-3 grid grid-cols-3 gap-3">
             {socialLinks.map((item) => (
               <a
                 key={`mobile-${item.key}`}
                 href={item.href}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-white py-2.5 text-center text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center gap-1.5"
                 style={{ borderRadius: "var(--radius)" }}
               >
                 {item.icon}
                 {item.label}
               </a>
             ))}
           </div>
         )}
      </div>

    </div>
  );
}
