// src/app/account/page.js
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AccountTabs from "@/components/AccountTabs";

export const metadata = { title: "My Account — Motorke" };

export default async function AccountPage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireAuth();
  if (user.role === "ADMIN")  redirect("/admin");
  if (user.role === "DEALER") redirect("/portal");

  const params = await searchParams;
  const tab    = sp.tab || "profile";

  const [savedCars, enquiries] = await Promise.all([
    db.savedCar.findMany({
      where:   { userId: user.id },
      include: {
        car: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            dealer: { select: { name: true, location: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.findMany({
      where:   { email: user.email },
      include: {
        car:    { select: { id: true, make: true, model: true, year: true, price: true, available: true } },
        dealer: { select: { name: true, slug: true, phone: true, whatsapp: true } },
      },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
  ]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem 4rem" }}>

      {/* Header card */}
      <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:28, padding:"24px 28px", background:"#fff", borderRadius:16, border:"1px solid #E2E2E2" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"#E8490F", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:26, flexShrink:0 }}>
          {user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontWeight:800, fontSize:"1.4rem", color:"#1A1A1A", marginBottom:4 }}>{user.name}</h1>
          <p style={{ color:"#666", fontSize:14 }}>{user.email}</p>
          <span style={{ fontSize:11, background:"#f0fdf4", color:"#16a34a", border:"1px solid #bbf7d0", borderRadius:99, padding:"2px 10px", display:"inline-block", marginTop:6 }}>Buyer account</span>
        </div>
        <div style={{ marginLeft:"auto", display:"flex", gap:12, flexWrap:"wrap" }}>
          {[{v:savedCars.length,l:"Saved cars"},{v:enquiries.length,l:"Enquiries"}].map(({v,l}) => (
            <div key={l} style={{ textAlign:"center", background:"#F5F5F5", borderRadius:12, padding:"10px 20px", minWidth:80 }}>
              <p style={{ fontWeight:800, fontSize:"1.4rem", color:"#E8490F" }}>{v}</p>
              <p style={{ fontSize:11, color:"#666", marginTop:2 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      <AccountTabs
        tab={tab}
        user={{ id: user.id, name: user.name, email: user.email }}
        savedCars={savedCars.map(sc => ({
          savedId:   sc.id,
          savedAt:   sc.createdAt.toISOString(),
          id:        sc.car.id,
          make:      sc.car.make,
          model:     sc.car.model,
          year:      sc.car.year,
          price:     sc.car.price,
          mileage:   sc.car.mileage,
          available: sc.car.available,
          image:     sc.car.images[0]?.url || null,
          dealer:    sc.car.dealer,
        }))}
        enquiries={enquiries.map(e => ({
          id:        e.id,
          message:   e.message,
          channel:   e.channel,
          createdAt: e.createdAt.toISOString(),
          car:       e.car,
          dealer:    e.dealer,
        }))}
      />
    </div>
  );
}
