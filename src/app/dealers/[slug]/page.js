import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe, ShieldCheck, MessageCircle, Star, CalendarDays, Activity } from "lucide-react";
import { SiInstagram, SiFacebook, SiTiktok } from "react-icons/si";
import { getSession } from "@/lib/auth";
import { absoluteUrl, BRAND_OG_IMAGE } from "@/lib/site-url";

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
    : absoluteUrl(BRAND_OG_IMAGE);

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
  const soldCarsCount = await db.lead.count({
    where: { dealerId: dealer.id, status: "SOLD" },
  });

  const session = await getSession();
  const viewer = session?.user;

  const totalReviews = dealer.reviews.length;
  const averageRating = totalReviews > 0
    ? dealer.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
    : 0;
  const startedYear = new Date(dealer.createdAt).getFullYear();
  const mapsQuery = encodeURIComponent(
    [dealer.address || dealer.location, dealer.county, "Kenya"].filter(Boolean).join(", ")
  );
  const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  
  const latestInventoryUpdate =
    dealer.cars.length > 0
      ? new Date(Math.max(...dealer.cars.map((car) => new Date(car.updatedAt).getTime())))
      : null;
  const inventoryFreshnessDays = latestInventoryUpdate
    ? Math.max(0, Math.floor((Date.now() - latestInventoryUpdate.getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const inventoryFreshnessLabel =
    inventoryFreshnessDays == null ? null : `${inventoryFreshnessDays} day${inventoryFreshnessDays === 1 ? "" : "s"} ago`;
  const yearsActive = Math.max(1, new Date().getFullYear() - startedYear + 1);
  const isActiveToday = inventoryFreshnessDays != null && inventoryFreshnessDays <= 0;
  const lastActiveLabel = isActiveToday
    ? "Active today"
    : inventoryFreshnessDays == null
      ? "Activity unavailable"
      : `Active ${inventoryFreshnessLabel}`;
  const dealerSummary =
    dealer.description?.trim()?.split(".")?.[0]?.trim()
      ? `${dealer.description.trim().split(".")[0].trim()}.`
      : `${dealer.name} specializes in inspected cars with transparent pricing and direct buyer support in ${dealer.location || dealer.county || "Kenya"}.`;
  const openingHours = [
    "Mon - Sat: 8:00 AM - 6:00 PM",
    "Sun: 10:00 AM - 4:00 PM",
  ];

  const whatsappNumber = dealer.whatsapp?.replace(/\D/g, "") || "";
  const whatsappPrefill = encodeURIComponent(
    `Hi, I'm viewing your showroom on Welsh Motorhub and I'd like to ask about your available cars.`
  );
  const whatsappChatHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${whatsappPrefill}`
    : null;

  const socialLinks = [
    { key: "instagram", label: "Instagram", href: withProtocol(dealer.instagramUrl), icon: <SiInstagram className="w-3.5 h-3.5" style={{ color: "#E4405F" }} /> },
    { key: "facebook", label: "Facebook", href: withProtocol(dealer.facebookUrl), icon: <SiFacebook className="w-3.5 h-3.5" style={{ color: "#1877F2" }} /> },
    { key: "tiktok", label: "TikTok", href: withProtocol(dealer.tiktokUrl), icon: <SiTiktok className="w-3.5 h-3.5 text-slate-900 dark:text-white" /> },
  ].filter((item) => Boolean(item.href));

  // Generate the gallery for the hero section
  const dealerGallery = dealer.cars
    .flatMap(c => c.images.map(i => ({ image: i.url, title: `${c.make} ${c.model}` })))
    .slice(0, 3);
  const recentShowcaseCars = dealer.cars
    .filter((car) => Boolean(car.images?.[0]?.url))
    .slice(0, 4)
    .map((car) => ({
      id: car.id,
      title: `${car.year} ${car.make} ${car.model}`.trim(),
      image: car.images[0].url,
      price: car.price,
    }));

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
    <div className="bg-white dark:bg-slate-950 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      {/* Hero Banner Section */}
      <div className="w-full h-[280px] sm:h-[340px] lg:h-[380px] relative bg-gradient-to-r from-slate-800 to-slate-900 overflow-hidden">
         {dealer.bannerUrl ? (
           <img
             src={dealer.bannerUrl}
             alt={dealer.name}
             className="absolute inset-0 w-full h-full object-cover opacity-70 sm:opacity-60"
           />
         ) : (
           <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4 opacity-50 sm:opacity-30">
              {dealerGallery.slice(0, 3).map((car, i) => (
                <div key={i} className="relative h-full w-full rounded-lg overflow-hidden">
                  <Image src={car.image} alt={car.title} fill className="object-cover" />
                </div>
              ))}
           </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px] pb-20">
        
        {/* Dealer Header Card - Positioned over hero */}
        <div className="-mt-20 sm:-mt-24 lg:-mt-28 relative z-20 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                
                {/* Logo & Name Section */}
                <div className="lg:col-span-8 flex flex-col">
                  <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                    {/* Logo Box */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl border-4 border-white dark:border-slate-700 shadow-lg p-2 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {dealer.logoUrl ? (
                        <img src={dealer.logoUrl} alt={dealer.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-4xl sm:text-5xl font-black text-slate-300 dark:text-slate-600">{dealer.name[0]}</span>
                      )}
                    </div>
                    
                    {/* Name & Details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">{dealer.name}</h1>
                        {dealer.verified && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Dealer
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-5">
                        <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" /> {dealer.location || dealer.county}</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" /> Member since {startedYear}</span>
                        <span className={`inline-flex items-center gap-1.5 ${isActiveToday ? "text-emerald-600 dark:text-emerald-500" : ""}`}>
                          <Activity className={`w-3.5 h-3.5 ${isActiveToday ? "text-emerald-600 dark:text-emerald-500" : "text-slate-400"}`} /> {lastActiveLabel}
                        </span>
                      </div>
                      
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium mb-6 max-w-2xl">{dealerSummary}</p>
                      
                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{dealer.cars.length}+</p>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mt-1">Vehicles in stock</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{yearsActive}+</p>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mt-1">Years active</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{averageRating > 0 ? averageRating.toFixed(1) : "—"}</p>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mt-1">{totalReviews} reviews</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                          <p className="text-lg font-black text-slate-900 dark:text-white">{dealer.verified ? "100%" : "—"}</p>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mt-1">Verified</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right CTA Box */}
                <div className="lg:col-span-4">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-900 rounded-xl p-6 border border-amber-200 dark:border-slate-700">
                    <p className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">Get in touch</p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Find your perfect car</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">We're here to help you find your dream car. Contact us today.</p>
                    
                    <div className="space-y-2.5">
                      {dealer.whatsapp && (
                        <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-sm transition-colors">
                          <MessageCircle className="w-4 h-4" /> Start Live Enquiry
                        </a>
                      )}
                      {dealer.phone && (
                        <a href={`tel:${dealer.phone}`} className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold py-3 rounded-lg text-sm transition-colors">
                          <Phone className="w-4 h-4" /> Call Dealer
                        </a>
                      )}
                      {dealer.whatsapp && (
                        <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 font-bold py-2.5 rounded-lg text-sm border border-slate-200 dark:border-slate-600 transition-colors">
                          WhatsApp
                        </a>
                      )}
                      {dealer.website && (
                        <a href={withProtocol(dealer.website)} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 font-bold py-2.5 rounded-lg text-sm border border-slate-200 dark:border-slate-600 transition-colors">
                          <Globe className="w-4 h-4" /> Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Vehicles Section */}
        <section id="inventory" className="mb-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Available now</p>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">Featured Vehicles</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {dealer.cars.slice(0, 4).map((car) => (
              <Link key={car.id} href={`/cars/${car.id}`} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl transition-shadow">
                {/* Car Image */}
                <div className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {car.images?.[0]?.url ? (
                    <Image src={car.images[0].url} alt={`${car.make} ${car.model}`} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">No image</div>
                  )}
                  {car.featured && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">Featured</div>
                  )}
                </div>
                
                {/* Car Details */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm sm:text-base line-clamp-1">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    {car.mileage ? `${(car.mileage/1000).toFixed(0)}k km` : "—"} • {car.transmissionassembly || "—"}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
                    KSh {car.price?.toLocaleString("en-KE") || "TBD"}
                  </p>
                  
                  {/* Specs */}
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {car.transmission && <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">{car.transmission}</span>}
                    {car.fuelType && <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">{car.fuelType}</span>}
                    {car.engineCC && <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">{car.engineCC}cc</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {dealer.cars.length > 4 && (
            <div className="mt-6 text-center">
              <Link href={`/dealers/${dealer.slug}#full-inventory`} className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold text-sm hover:underline">
                View all {dealer.cars.length} vehicles <span>→</span>
              </Link>
            </div>
          )}
        </section>

        {/* Two Column Layout: Main Content + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* About Section */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
              <div className="p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">About</p>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-6">Why Buy From {dealer.name}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Text Content */}
                  <div>
                    <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
                      {dealer.description || dealerSummary}
                    </p>
                    
                    {/* Features List */}
                    <div className="space-y-3">
                      {[
                        "Thoroughly inspected vehicles",
                        "Best prices in the market",
                        "Flexible financing options",
                        "After-sales support",
                        "Trade-in accepted",
                        "Import specialists",
                      ].map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          <span className="font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Image */}
                  <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800">
                    {recentShowcaseCars[0] ? (
                      <Image src={recentShowcaseCars[0].image} alt="Dealership" fill className="object-cover" />
                    ) : dealerGallery[0] ? (
                      <Image src={dealerGallery[0].image} alt="Dealership" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400"></div>
                    )}
                  </div>
                </div>
              </div>
            </section>
            
            {/* Reviews/Testimonials Section */}
            <section id="reviews" className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Customer reviews</p>
                    <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">What Our Customers Say</h2>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700"}`} />
                    ))}
                  </div>
                </div>
                
                <div className="mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    {averageRating.toFixed(1)} / 5
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Based on {totalReviews} verified buyer reviews</p>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {dealer.reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-3 mb-3">
                        {review.user?.avatarUrl ? (
                          <img src={review.user.avatarUrl} alt={review.user?.name} className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {review.user?.name?.[0] || "U"}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{review.user?.name || "Anonymous"}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                              ))}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
                
                {totalReviews > 3 && (
                  <button className="mt-6 w-full py-2 text-emerald-600 dark:text-emerald-500 font-bold text-sm hover:underline">
                    View all {totalReviews} reviews
                  </button>
                )}
              </div>
            </section>
          </div>
          
          {/* Right Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Dealer Info Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
              <div className="p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Dealer info</p>
                
                <div className="space-y-3 text-sm mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Type</span>
                    <span className="font-bold text-slate-900 dark:text-white">Dealership</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Location</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right">{dealer.location || dealer.county || "Kenya"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Member since</span>
                    <span className="font-bold text-slate-900 dark:text-white">{startedYear}</span>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  {dealer.phone && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-1">Phone</p>
                      <a href={`tel:${dealer.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline break-all">{dealer.phone}</a>
                    </div>
                  )}
                  {dealer.email && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-1">Email</p>
                      <a href={`mailto:${dealer.email}`} className="text-blue-600 dark:text-blue-400 hover:underline break-all text-xs">{dealer.email}</a>
                    </div>
                  )}
                  {dealer.website && (
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-1">Website</p>
                      <a href={withProtocol(dealer.website)} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all text-xs">{dealer.website}</a>
                    </div>
                  )}
                </div>
                
                <div className="mb-6">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide mb-2">Opening hours</p>
                  <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    {openingHours.map((hours, idx) => (
                      <p key={idx}>{hours}</p>
                    ))}
                  </div>
                </div>
                
                <a href={googleMapsHref} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-2.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 transition-colors">
                  <MapPin className="w-4 h-4" /> Get Directions
                </a>
              </div>
            </div>
            
            {/* Service Metrics Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-slate-900 rounded-xl border border-emerald-200 dark:border-slate-700 overflow-hidden shadow-md">
              <div className="p-6 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-4">Service metrics</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Stock</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{dealer.cars.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Rating</span>
                    <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{averageRating.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Response</span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 text-right">{dealer.whatsapp ? "WhatsApp" : "Call/Email"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Updated</span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{inventoryFreshnessLabel || "Recently"}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Social Media Section */}
            {socialLinks.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
                <div className="p-6 sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Follow Us</p>
                  <div className="space-y-2.5">
                    {socialLinks.map((link) => (
                      <a
                        key={link.key}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-white">
                          {link.icon} {link.label}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Photo Gallery Section */}
            {recentShowcaseCars.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
                <div className="p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Photos from {dealer.name.split(" ")[0]}</p>
                    <a href="#inventory" className="text-xs font-bold text-emerald-600 dark:text-emerald-500 hover:underline">View all</a>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {recentShowcaseCars.slice(0, 6).map((car) => (
                      <Link key={car.id} href={`/cars/${car.id}`} className="relative aspect-square rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 hover:opacity-80 transition-opacity">
                        <Image src={car.image} alt={car.title} fill className="object-cover" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Persistent Mobile Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-3 shadow-2xl">
         <div className="flex items-center gap-2">
           {dealer.phone && (
             <a href={`tel:${dealer.phone}`} className="flex-1 bg-slate-900 dark:bg-white text-white dark:!text-slate-900 py-3 text-center text-xs font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                📞 Call
             </a>
           )}
           {dealer.whatsapp && (
             <a href={whatsappChatHref} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-600 text-white py-3 text-center text-xs font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                💬 WhatsApp
             </a>
           )}
           {(!dealer.phone && !dealer.whatsapp) && (
             <a href="#reviews" className="flex-1 bg-slate-900 dark:bg-white text-white dark:!text-slate-900 py-3 text-center text-xs font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
                Let's Connect
             </a>
           )}
         </div>
      </div>

    </div>
  );
}
