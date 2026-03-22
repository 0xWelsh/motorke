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
        include: { images: { where: { isPrimary: true }, take: 1 }, dealer: { select: { name: true, location: true, verified: true, lat: true, lng: true } } },
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

const TRENDING = ["Toyota Hilux", "Toyota Prado", "Subaru Forester", "Mazda CX-5", "Toyota Harrier", "Toyota Fielder"];
const PRICE_RANGES = [
  { label: "Under KSh 1M",   min: 0,       max: 1000000  },
  { label: "1M – 2M",        min: 1000000, max: 2000000  },
  { label: "2M – 4M",        min: 2000000, max: 4000000  },
  { label: "4M – 7M",        min: 4000000, max: 7000000  },
  { label: "Above KSh 7M",   min: 7000000, max: 99000000 },
];
const COUNTIES = ["Nairobi","Mombasa","Nakuru","Kisumu","Uasin Gishu","Kiambu","Machakos","Meru"];
const BODY_TYPES = [
  { type: "SUV",       emoji: "🚙", label: "SUVs"        },
  { type: "SEDAN",     emoji: "🚗", label: "Sedans"      },
  { type: "PICKUP",    emoji: "🛻", label: "Pickups"     },
  { type: "HATCHBACK", emoji: "🚘", label: "Hatchbacks"  },
  { type: "WAGON",     emoji: "🚐", label: "Wagons"      },
];

export default async function HomePage() {
  const { featured, newArrivals, dealers, totalCars, totalDealers } = await getData();

  return (
    <div style={{ background: "#F5F5F5" }}>
      <style>{`
        .mk-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.09); }
        .mk-card { transition: transform 0.18s, box-shadow 0.18s; }
        .mk-pill:hover { background: #fff0eb !important; color: #E8490F !important; border-color: #E8490F !important; }
        .mk-type:hover { border-color: #E8490F !important; background: #fff0eb !important; }
        .mk-range:hover { border-color: #0A2640 !important; background: #e8eef4 !important; }
        .mk-county:hover { background: #0A2640 !important; color: white !important; }
        .mk-trend:hover { background: #fff0eb !important; color: #E8490F !important; }
      `}</style>

      {/* ── HERO ── */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "88vh", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1800&q=80')", backgroundSize: "cover", backgroundPosition: "center 55%", filter: "brightness(0.28)", zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(10,38,64,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 2, width: "100%", maxWidth: 900, margin: "0 auto", padding: "5rem 1.5rem 7rem" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 99, padding: "6px 16px", fontSize: 13, color: "white", marginBottom: 28 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            {totalCars} cars · {totalDealers} dealers across Kenya
          </div>

          <h1 style={{ fontWeight: 800, fontSize: "clamp(2rem,5.5vw,4rem)", lineHeight: 1.1, color: "white", marginBottom: 16 }}>
            Find your perfect car.<br />
            <span style={{ color: "#E8490F" }}>Compare every dealer.</span>
          </h1>

          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 480, marginBottom: 36, lineHeight: 1.6 }}>
            Kenya's first platform to compare cars across multiple dealerships — search, compare prices, and contact dealers in one place.
          </p>

          {/* Search with location */}
          <LocationSearch />

          {/* Trending searches */}
          <div style={{ marginTop: 20 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginRight: 10 }}>Trending:</span>
            {TRENDING.map(t => (
              <a key={t} href={`/cars?search=${encodeURIComponent(t)}`} className="mk-trend"
                style={{ display: "inline-block", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.75)", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 500, textDecoration: "none", marginRight: 6, marginBottom: 6, transition: "all 0.15s" }}>
                {t}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section style={{ background: "#0A2640" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1.5rem", display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", gap: 8 }}>
          {[
            { v: `${totalCars}+`,   l: "Cars available"   },
            { v: `${totalDealers}`, l: "Verified dealers"  },
            { v: "5",               l: "Counties covered"  },
            { v: "Free",            l: "Always free for buyers" },
          ].map(({ v, l }) => (
            <div key={l}>
              <p style={{ fontWeight: 800, fontSize: "1.5rem", color: "#E8490F" }}>{v}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICE RANGES ── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2E2E2" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
          <h2 style={{ fontWeight: 700, fontSize: "1rem", color: "#0A2640", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 12 }}>Shop by budget</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {PRICE_RANGES.map(({ label, min, max }) => (
              <a key={label} href={`/cars?minPrice=${min}&maxPrice=${max}`} className="mk-range"
                style={{ border: "1.5px solid #E2E2E2", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#0A2640", textDecoration: "none", background: "#fff", transition: "all 0.15s", whiteSpace: "nowrap" }}>
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE BY TYPE ── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E2E2E2" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 1.5rem" }}>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
            {BODY_TYPES.map(({ type, emoji, label }) => (
              <a key={type} href={`/cars?bodyType=${type}`} className="mk-type"
                style={{ display: "flex", alignItems: "center", gap: 8, background: "#F5F5F5", border: "1.5px solid #E2E2E2", borderRadius: 99, padding: "8px 18px", textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.15s", flexShrink: 0 }}>
                <span style={{ fontSize: 18 }}>{emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0A2640" }}>New this week</h2>
              <p style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Just listed in the last 7 days</p>
            </div>
            <a href="/cars?sort=newest" style={{ fontSize: 13, fontWeight: 600, color: "#E8490F", textDecoration: "none" }}>View all →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {newArrivals.map(car => <CarCard key={car.id} car={car} badge="New" badgeColor="#0A2640" />)}
          </div>
        </section>
      )}

      {/* ── FEATURED CARS ── */}
      {featured.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0A2640" }}>Featured cars</h2>
              <p style={{ fontSize: 13, color: "#666", marginTop: 3 }}>Hand-picked from verified dealerships</p>
            </div>
            <a href="/cars" style={{ fontSize: 13, fontWeight: 600, color: "#E8490F", textDecoration: "none" }}>View all →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
            {featured.map(car => <CarCard key={car.id} car={car} badge="Featured" badgeColor="#E8490F" />)}
          </div>
        </section>
      )}

      {/* ── BROWSE BY COUNTY ── */}
      <section style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 1.5rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0A2640", marginBottom: 16 }}>Find cars near you</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
          {COUNTIES.map(county => (
            <a key={county} href={`/cars?county=${encodeURIComponent(county)}`} className="mk-county"
              style={{ background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 10, padding: "12px 10px", textAlign: "center", textDecoration: "none", fontSize: 13, fontWeight: 600, color: "#0A2640", transition: "all 0.15s" }}>
              📍 {county}
            </a>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: "#0A2640", margin: "3rem 0 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3.5rem 1.5rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.5rem", color: "white", textAlign: "center", marginBottom: 8 }}>How Motorke works</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", textAlign: "center", fontSize: 14, marginBottom: 40 }}>Find your next car in 3 simple steps</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 24 }}>
            {[
              { step: "1", icon: "🔍", title: "Search & filter", desc: "Search by make, model, price range or location across all dealerships at once." },
              { step: "2", icon: "⚖️", title: "Compare dealers", desc: "See the same car from multiple dealers side by side. Compare prices, mileage and specs." },
              { step: "3", icon: "💬", title: "Contact directly", desc: "Message dealers instantly on WhatsApp or by phone — no middlemen, no signup fees." },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E8490F", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>{step}</div>
                  <span style={{ fontSize: 24 }}>{icon}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "white", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEALERS ── */}
      {dealers.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0A2640" }}>Top dealerships</h2>
            <a href="/dealers" style={{ fontSize: 13, fontWeight: 600, color: "#E8490F", textDecoration: "none" }}>All dealers →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
            {dealers.map(d => (
              <a key={d.id} href={`/dealers/${d.slug}`} className="mk-card"
                style={{ background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 12, padding: 16, textDecoration: "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "#e8eef4", color: "#0A2640", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, flexShrink: 0 }}>{d.name[0]}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: "#1A1A1A" }}>{d.name}</p>
                    {d.verified && <span style={{ fontSize: 9, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 99, padding: "1px 7px" }}>✓</span>}
                  </div>
                  <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{d.location}</p>
                  <p style={{ fontSize: 12, color: "#E8490F", fontWeight: 600, marginTop: 4 }}>{d._count.cars} cars</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section style={{ maxWidth: 1100, margin: "3rem auto 0", padding: "0 1.5rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0A2640", marginBottom: 20, textAlign: "center" }}>What buyers say</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {[
            { name: "James M.", county: "Nairobi", text: "Found my Toyota Hilux in 2 days. Compared 3 dealers and saved over KSh 200,000 by choosing the right one.", car: "2020 Toyota Hilux" },
            { name: "Aisha K.", county: "Mombasa", text: "The WhatsApp button made it so easy. I contacted 2 dealers and got the Harrier I wanted the same week.", car: "2019 Toyota Harrier" },
            { name: "Peter O.", county: "Nakuru", text: "Duty calculator was incredibly useful — I knew exactly what I'd pay before even contacting the dealer.", car: "2018 Mazda CX-5" },
          ].map(({ name, county, text, car }) => (
            <div key={name} style={{ background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 14, padding: 22 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: "#E8490F", fontSize: 14 }}>★</span>)}
              </div>
              <p style={{ fontSize: 14, color: "#333", lineHeight: 1.6, marginBottom: 16 }}>"{text}"</p>
              <div style={{ borderTop: "1px solid #F5F5F5", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#1A1A1A" }}>{name}</p>
                  <p style={{ fontSize: 11, color: "#999", marginTop: 2 }}>📍 {county}</p>
                </div>
                <span style={{ fontSize: 11, background: "#e8eef4", color: "#0A2640", borderRadius: 99, padding: "3px 10px", fontWeight: 600 }}>{car}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY MOTORKE ── */}
      <section style={{ background: "#fff", margin: "3rem 0 0", borderTop: "1px solid #E2E2E2" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#0A2640", marginBottom: 28, textAlign: "center" }}>Why use Motorke?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 20 }}>
            {[
              { icon: "⚖️", title: "Compare prices",    desc: "See the same car across multiple dealers. Never overpay again." },
              { icon: "✅", title: "Verified dealers",  desc: "Every dealer is verified before listing. Real cars, real people." },
              { icon: "💬", title: "WhatsApp direct",   desc: "One tap to contact any dealer on WhatsApp. No middlemen." },
              { icon: "🧾", title: "Duty calculator",   desc: "Estimate full import costs before you commit to any purchase." },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ textAlign: "center", padding: "20px 16px" }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0A2640", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background: "linear-gradient(135deg, #0A2640 0%, #0d3358 100%)", padding: "3.5rem 1.5rem", textAlign: "center" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.6rem", color: "white", marginBottom: 10 }}>Are you a dealership?</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginBottom: 28, maxWidth: 400, margin: "0 auto 28px" }}>
          List your cars on Motorke and reach thousands of buyers across Kenya. It's free to get started.
        </p>
        <a href="/login" style={{ background: "#E8490F", color: "white", fontWeight: 700, fontSize: 14, padding: "13px 36px", borderRadius: 99, textDecoration: "none", display: "inline-block" }}>
          List your cars free →
        </a>
      </section>
    </div>
  );
}

function CarCard({ car, badge, badgeColor }) {
  const img   = car.images[0]?.url;
  const title = `${car.year} ${car.make} ${car.model}`;
  return (
    <a href={`/cars/${car.id}`} className="mk-card"
      style={{ background: "#fff", border: "1.5px solid #E2E2E2", borderRadius: 12, overflow: "hidden", textDecoration: "none", display: "block" }}>
      <div style={{ position: "relative", aspectRatio: "16/10", background: "#f0ede8", overflow: "hidden" }}>
        {img
          ? <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 40 }}>🚗</div>
        }
        {badge && (
          <span style={{ position: "absolute", top: 10, left: 10, background: badgeColor, color: "white", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {badge}
          </span>
        )}
        <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.92)", color: "#555", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>
          {BODY_TYPE_LABELS[car.bodyType] || car.bodyType}
        </span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <p style={{ fontWeight: 700, fontSize: 15, color: "#1A1A1A" }}>{title}</p>
        {car.variant && <p style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{car.variant}</p>}
        <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
          {[car.transmission, car.fuelType, car.mileage ? formatMileage(car.mileage) : null].filter(Boolean).map(tag => (
            <span key={tag} style={{ fontSize: 11, background: "#F5F5F5", color: "#666", borderRadius: 5, padding: "2px 7px" }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: "#E8490F" }}>{formatPrice(car.price)}</p>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#666" }}>{car.dealer?.name}</p>
            <p style={{ fontSize: 10, color: "#999" }}>{car.dealer?.location}</p>
          </div>
        </div>
      </div>
    </a>
  );
}