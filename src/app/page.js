// src/app/page.js
import { db } from "@/lib/db";
import { formatPrice, formatMileage, BODY_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";
import LocationSearch from "@/components/LocationSearch";

async function getData() {
  try {
    const week = new Date(); week.setDate(week.getDate() - 7);
    const [featured, newArrivals, dealers, totalCars, totalDealers] = await Promise.all([
      db.car.findMany({
        where: { available: true, featured: true },
        include: { images: { where: { isPrimary: true }, take: 1 }, dealer: { select: { name: true, location: true, verified: true } } },
        take: 6, orderBy: { createdAt: "desc" },
      }),
      db.car.findMany({
        where: { available: true, createdAt: { gte: week } },
        include: { images: { where: { isPrimary: true }, take: 1 }, dealer: { select: { name: true, location: true } } },
        take: 4, orderBy: { createdAt: "desc" },
      }),
      db.dealer.findMany({
        where: { featured: true },
        include: { _count: { select: { cars: { where: { available: true } } } } },
        take: 4,
      }),
      db.car.count({ where: { available: true } }),
      db.dealer.count(),
    ]);
    return { featured, newArrivals, dealers, totalCars, totalDealers };
  } catch {
    return { featured: [], newArrivals: [], dealers: [], totalCars: 0, totalDealers: 0 };
  }
}

// Real car photos per category from Unsplash
const BODY_TYPES = [
  { type: "SUV",       label: "SUVs",       img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Paris_Motor_Show_2018%2C_Paris_%281Y7A2057%29.jpg/640px-Paris_Motor_Show_2018%2C_Paris_%281Y7A2057%29.jpg" },
  { type: "PICKUP",    label: "Pickups",    img: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Toyota_Hilux_2.4_Xtra_cab_4_WD_-_Flickr_-_Joost_J._Bakker_IJmuiden.jpg/640px-Toyota_Hilux_2.4_Xtra_cab_4_WD_-_Flickr_-_Joost_J._Bakker_IJmuiden.jpg" },
  { type: "SEDAN",     label: "Sedans",     img: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Toyota_Corolla_E180_sedan_2_China_2016-04-01.jpg/640px-Toyota_Corolla_E180_sedan_2_China_2016-04-01.jpg" },
  { type: "HATCHBACK", label: "Hatchbacks", img: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Infiniti_Q30_rear.jpg/640px-Infiniti_Q30_rear.jpg" },
  { type: "WAGON",     label: "Wagons",     img: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Lancia_Kappa_Station_Wagon_1Y7A6135.jpg/640px-Lancia_Kappa_Station_Wagon_1Y7A6135.jpg" },
];

const PRICE_RANGES = [
  { label: "Under KSh 1M",  min: 0,       max: 1000000,  sub: "Entry level"   },
  { label: "1M – 2M",       min: 1000000, max: 2000000,  sub: "Most popular"  },
  { label: "2M – 4M",       min: 2000000, max: 4000000,  sub: "Mid range"     },
  { label: "4M – 7M",       min: 4000000, max: 7000000,  sub: "Premium"       },
  { label: "Above KSh 7M",  min: 7000000, max: 99000000, sub: "Luxury"        },
];

const COUNTIES = [
  { name: "Nairobi",     img: "https://images.unsplash.com/photo-1611348586840-ea9872a69fd4?w=200&q=80" },
  { name: "Mombasa",     img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=200&q=80" },
  { name: "Nakuru",      img: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=200&q=80" },
  { name: "Kisumu",      img: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=200&q=80" },
  { name: "Eldoret",     img: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&q=80" },
  { name: "Kiambu",      img: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200&q=80" },
  { name: "Machakos",    img: "https://images.unsplash.com/photo-1504198453885-2f6e0c7f1c07?w=200&q=80" },
  { name: "Meru",        img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&q=80" },
];

const TRENDING = ["Toyota Hilux", "Toyota Prado", "Subaru Forester", "Mazda CX-5", "Toyota Harrier", "Toyota Fielder"];

export default async function HomePage() {
  const { featured, newArrivals, dealers, totalCars, totalDealers } = await getData();

  return (
    <div style={{ background: "#F7F8FA" }}>
      <style>{`
        .mk-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .mk-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.1); }
        .mk-body:hover .mk-body-img { transform: scale(1.06); }
        .mk-body-img { transition: transform 0.35s ease; }
        .mk-county:hover { border-color: #F59E0B !important; }
        .mk-county:hover .mk-county-overlay { opacity: 1 !important; }
        .mk-range:hover { background: #1C1C1E !important; color: white !important; border-color: #1C1C1E !important; }
        .mk-trend:hover { background: #FEF3C7 !important; color: #1C1C1E !important; border-color: #F59E0B !important; }
        .mk-dealer:hover { border-color: #F59E0B !important; box-shadow: 0 4px 20px rgba(245,158,11,0.12); }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=85')", backgroundSize: "cover", backgroundPosition: "center 55%", filter: "brightness(0.22)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(28,28,30,0.95) 0%, rgba(28,28,30,0.5) 50%, transparent 100%)", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 820, margin: "0 auto", padding: "6rem 1.5rem 8rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 99, padding: "6px 16px", fontSize: 12, color: "#F59E0B", marginBottom: 28, fontWeight: 600, letterSpacing: "0.02em" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            {totalCars} cars listed · {totalDealers} dealerships
          </div>
          <h1 style={{ fontWeight: 800, fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.05, color: "white", marginBottom: 18, letterSpacing: "-0.02em" }}>
            Find your perfect car.<br />
            <span style={{ color: "#F59E0B" }}>Compare every dealer.</span>
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", maxWidth: 460, marginBottom: 40, lineHeight: 1.7 }}>
            Kenya's first platform to compare cars across multiple dealerships — search, compare prices, contact dealers.
          </p>
          <LocationSearch />
          <div style={{ marginTop: 22, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 4 }}>Trending</span>
            {TRENDING.map(t => (
              <a key={t} href={`/cars?search=${encodeURIComponent(t)}`} className="mk-trend"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 500, textDecoration: "none", transition: "all 0.15s" }}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section style={{ background: "#1C1C1E" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center" }}>
          {[
            { v: `${totalCars}+`, l: "Cars listed"         },
            { v: `${totalDealers}`, l: "Verified dealers"  },
            { v: "5",             l: "Counties"            },
            { v: "Free",          l: "For buyers"          },
          ].map(({ v, l }) => (
            <div key={l} style={{ padding: "20px 16px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontWeight: 800, fontSize: "1.6rem", color: "#F59E0B", lineHeight: 1 }}>{v}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 5, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── BROWSE BY BODY TYPE ──────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 1.5rem 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Browse by type</p>
            <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#1C1C1E", letterSpacing: "-0.01em" }}>What are you looking for?</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
          {BODY_TYPES.map(({ type, label, sub, img }) => (
            <a key={type} href={`/cars?bodyType=${type}`} className="mk-body mk-card"
              style={{ textDecoration: "none", borderRadius: 14, overflow: "hidden", background: "#fff", border: "1.5px solid #E4E4E7", display: "block" }}>
              <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#f0ede8" }}>
                <img src={img} alt={label} className="mk-body-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: "#1C1C1E" }}>{label}</p>
                <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600 }}>View all →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── BUDGET ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Shop by budget</p>
            <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#1C1C1E", letterSpacing: "-0.01em" }}>Find your price range</h2>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {PRICE_RANGES.map(({ label, sub, min, max }) => (
            <a key={label} href={`/cars?minPrice=${min}&maxPrice=${max}`} className="mk-range"
              style={{ border: "1.5px solid #E4E4E7", borderRadius: 12, padding: "16px 16px", fontSize: 14, fontWeight: 700, color: "#1C1C1E", textDecoration: "none", background: "#fff", transition: "all 0.18s", display: "block" }}>
              <p style={{ fontWeight: 800, fontSize: 14, color: "#1C1C1E", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 500 }}>{sub}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── NEW ARRIVALS ─────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 1.5rem" }}>
          <SectionHeader title="New this week" sub="Just listed in the last 7 days" href="/cars?sort=newest" linkLabel="View all" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {newArrivals.map(car => <CarCard key={car.id} car={car} badge="New" />)}
          </div>
        </section>
      )}

      {/* ── FEATURED CARS ────────────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 1.5rem" }}>
          <SectionHeader title="Featured cars" sub="Hand-picked from verified dealerships" href="/cars" linkLabel="View all" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {featured.map(car => <CarCard key={car.id} car={car} badge="Featured" badgeBg="#F59E0B" badgeColor="#1C1C1E" />)}
          </div>
        </section>
      )}

      {/* ── FIND NEAR YOU ────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 1.5rem" }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Browse by location</p>
          <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#1C1C1E", letterSpacing: "-0.01em" }}>Find cars near you</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {COUNTIES.map(({ name, img }) => (
            <a key={name} href={`/cars?county=${encodeURIComponent(name)}`} className="mk-county"
              style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "3/2", display: "block", border: "2px solid transparent", textDecoration: "none", transition: "all 0.2s" }}>
              <img src={img} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)" }} />
              <div className="mk-county-overlay" style={{ position: "absolute", inset: 0, background: "rgba(245,158,11,0.15)", opacity: 0, transition: "opacity 0.2s" }} />
              <p style={{ position: "absolute", bottom: 10, left: 12, color: "white", fontWeight: 700, fontSize: 14 }}>{name}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ background: "#1C1C1E", margin: "3.5rem 0 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "4rem 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,158,11,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Simple process</p>
            <h2 style={{ fontWeight: 800, fontSize: "1.8rem", color: "white", letterSpacing: "-0.02em" }}>How Motorke works</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }}>
            {[
              { num: "01", title: "Search & filter",  desc: "Search by make, model, budget or location across every dealership at once. Filter results to find exactly what you need.",     img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&q=80" },
              { num: "02", title: "Compare dealers",  desc: "See the same car from multiple dealers side by side. Compare prices, mileage and specs instantly before you decide.",        img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80" },
              { num: "03", title: "Contact directly", desc: "Message any dealer instantly on WhatsApp or by phone. No middlemen, no signup fees — just you and the dealer.",             img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=80" },
            ].map(({ num, title, desc, img }, i) => (
              <div key={num} style={{ position: "relative", overflow: "hidden", borderRadius: i === 0 ? "14px 0 0 14px" : i === 2 ? "0 14px 14px 0" : 0 }}>
                <img src={img} alt={title} style={{ width: "100%", height: 200, objectFit: "cover", filter: "brightness(0.35)" }} />
                <div style={{ position: "absolute", inset: 0, padding: "24px" }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#F59E0B", letterSpacing: "0.08em", marginBottom: 10 }}>STEP {num}</p>
                  <h3 style={{ fontWeight: 800, fontSize: "1.05rem", color: "white", marginBottom: 10 }}>{title}</h3>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOP DEALERSHIPS ──────────────────────────────────── */}
      {dealers.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 1.5rem 0" }}>
          <SectionHeader title="Top dealerships" sub="Verified dealers across Kenya" href="/dealers" linkLabel="All dealers" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {dealers.map(d => (
              <a key={d.id} href={`/dealers/${d.slug}`} className="mk-card mk-dealer"
                style={{ background: "#fff", border: "1.5px solid #E4E4E7", borderRadius: 12, padding: "18px 18px", textDecoration: "none", display: "flex", alignItems: "center", gap: 14, transition: "all 0.18s" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF3C7", color: "#1C1C1E", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
                  {d.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1C1C1E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name}</p>
                    {d.verified && (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6.5" fill="#10B981"/><path d="M3.5 6.5L5.5 8.5L9.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{d.location}</p>
                  <p style={{ fontSize: 12, color: "#F59E0B", fontWeight: 700, marginTop: 5 }}>{d._count.cars} cars available</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: "3.5rem auto 0", padding: "0 1.5rem" }}>
        <SectionHeader title="What buyers say" sub="Real stories from real Kenyan buyers" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { name: "James M.", county: "Nairobi",  text: "Found my Toyota Hilux in 2 days. Compared 3 dealers and saved over KSh 200,000 by choosing the right one.",        car: "2020 Toyota Hilux",   avatar: "JM" },
            { name: "Aisha K.", county: "Mombasa",  text: "The WhatsApp button made it so easy. I contacted 2 dealers and had the Harrier I wanted the same week.",          car: "2019 Toyota Harrier", avatar: "AK" },
            { name: "Peter O.", county: "Nakuru",   text: "The duty calculator was incredibly useful. I knew exactly what I'd pay before I even contacted the dealer.",       car: "2018 Mazda CX-5",    avatar: "PO" },
          ].map(({ name, county, text, car, avatar }) => (
            <div key={name} style={{ background: "#fff", border: "1.5px solid #E4E4E7", borderRadius: 14, padding: "24px" }}>
              {/* Stars */}
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="14" height="14" viewBox="0 0 14 14" fill="#F59E0B"><path d="M7 1l1.5 4H13L9.5 8l1.5 4L7 10 3.5 12 5 8 1.5 5H5.5z"/></svg>
                ))}
              </div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 20 }}>"{text}"</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #F7F8FA" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1C1C1E", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12 }}>
                    {avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#1C1C1E" }}>{name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{county}</p>
                  </div>
                </div>
                <span style={{ fontSize: 11, background: "#FEF3C7", color: "#1C1C1E", borderRadius: 99, padding: "3px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>{car}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY MOTORKE ──────────────────────────────────────── */}
      <section style={{ background: "#fff", margin: "3.5rem 0 0", borderTop: "1px solid #E4E4E7" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 1.5rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#1C1C1E", marginBottom: 32, textAlign: "center", letterSpacing: "-0.01em" }}>Why use Motorke?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: "#E4E4E7", borderRadius: 14, overflow: "hidden" }}>
            {[
              { title: "Compare prices",   desc: "See the same car across multiple dealers. Never overpay again.", icon: "⚖" },
              { title: "Verified dealers", desc: "Every dealer verified before listing. Real cars, real people.",  icon: "✓" },
              { title: "WhatsApp direct",  desc: "One tap to contact any dealer. No forms, no middlemen.",        icon: "↗" },
              { title: "Duty calculator",  desc: "Estimate full import costs before you commit.",                  icon: "=" },
            ].map(({ title, desc, icon }) => (
              <div key={title} style={{ background: "#fff", padding: "28px 24px", textAlign: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 800, fontSize: 18, color: "#1C1C1E" }}>
                  {icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1C1C1E", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEALER CTA ───────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", margin: "0" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1567818735868-e71b99932e29?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.2)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(28,28,30,0.97) 0%, rgba(28,28,30,0.7) 100%)" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "5rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(245,158,11,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>For dealerships</p>
          <h2 style={{ fontWeight: 800, fontSize: "2rem", color: "white", marginBottom: 14, letterSpacing: "-0.02em" }}>Grow your sales on Motorke</h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, marginBottom: 36, lineHeight: 1.7 }}>
            Reach thousands of buyers across Kenya. List your cars, manage enquiries, and grow your dealership — all in one place.
          </p>
          <a href="/login" style={{ background: "#F59E0B", color: "#1C1C1E", fontWeight: 800, fontSize: 14, padding: "14px 40px", borderRadius: 99, textDecoration: "none", display: "inline-block", letterSpacing: "0.01em" }}>
            List your cars free →
          </a>
        </div>
      </section>
    </div>
  );
}

// ── Reusable section header ────────────────────────────────────
function SectionHeader({ title, sub, href, linkLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{sub}</p>
        <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#1C1C1E", letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      {href && (
        <a href={href} style={{ fontSize: 13, fontWeight: 600, color: "#F59E0B", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          {linkLabel} →
        </a>
      )}
    </div>
  );
}

// ── Car card ───────────────────────────────────────────────────
function CarCard({ car, badge, badgeBg = "#1C1C1E", badgeColor = "white" }) {
  const img   = car.images[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`;
  return (
    <a href={`/cars/${car.id}`} className="mk-card"
      style={{ background: "#fff", border: "1.5px solid #E4E4E7", borderRadius: 12, overflow: "hidden", textDecoration: "none", display: "block" }}>
      <div style={{ position: "relative", aspectRatio: "16/10", background: "#F7F8FA", overflow: "hidden" }}>
        {img
          ? <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: 8 }}>
              <svg width="52" height="38" viewBox="0 0 52 38" fill="none"><rect x="4" y="16" width="44" height="16" rx="3" fill="#E4E4E7"/><path d="M10 16 L15 6 L37 6 L42 16Z" fill="#E4E4E7"/><circle cx="13" cy="32" r="5" fill="#D1D1D6"/><circle cx="39" cy="32" r="5" fill="#D1D1D6"/></svg>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>No photo yet</p>
            </div>
        }
        {badge && (
          <span style={{ position: "absolute", top: 10, left: 10, background: badgeBg, color: badgeColor, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#1C1C1E", letterSpacing: "-0.01em" }}>{title}</p>
        {car.variant && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{car.variant}</p>}
        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
          {[car.transmission, car.fuelType, car.mileage ? formatMileage(car.mileage) : null].filter(Boolean).map(tag => (
            <span key={tag} style={{ fontSize: 11, background: "#F7F8FA", color: "#6B7280", borderRadius: 5, padding: "2px 8px", border: "1px solid #E4E4E7" }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14, paddingTop: 12, borderTop: "1px solid #F7F8FA" }}>
          <p style={{ fontWeight: 800, fontSize: 17, color: "#F59E0B", letterSpacing: "-0.01em" }}>{formatPrice(car.price)}</p>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#6B7280", fontWeight: 500 }}>{car.dealer?.name}</p>
            <p style={{ fontSize: 10, color: "#9CA3AF" }}>{car.dealer?.location}</p>
          </div>
        </div>
      </div>
    </a>
  );
}