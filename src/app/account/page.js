// src/app/account/page.js
export const dynamic = "force-dynamic";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import AccountTabs from "@/components/AccountTabs";
import { Heart, MessageSquare, ShieldCheck, User as UserIcon, Calendar, ArrowRight } from "lucide-react";

export const metadata = { title: "My Account — Motorke Digital Garage" };

export default async function AccountPage({ searchParams }) {
  const sp = await searchParams;
  const user = await requireAuth();
  if (user.role === "ADMIN")  redirect("/admin");
  if (user.role === "DEALER") redirect("/portal");

  const tab = sp.tab || "profile";

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
        car:    { select: { id: true, make: true, model: true, year: true, price: true, dutyPaid: true, engineCC: true, fuelType: true, available: true } },
        dealer: { select: { name: true, slug: true, phone: true, whatsapp: true } },
      },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 max-w-4xl">
        
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
            <div>
              <p className="text-[10px] uppercase font-black tracking-[0.15em] font-bold text-slate-700 uppercase tracking-widest mb-2">Personal Workspace</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-1">Your Account</h1>
              <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 font-medium">Manage your profile, saved cars, and inquiries</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-[0.15em] font-bold text-slate-700 uppercase tracking-wider">
              <Calendar size={14} className="text-slate-700" />
              Member since {new Date(user.createdAt || Date.now()).getFullYear()}
            </div>
          </div>

          {/* User Profile Card */}
          <div className="bg-[#fbfcfe] border border-[#ddd4c8] rounded-none p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 bg-[#111111] text-white rounded-none flex items-center justify-center font-bold text-3xl flex-shrink-0">
                {user.name?.[0]?.toUpperCase()}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    <ShieldCheck size={12} /> Verified
                  </span>
                </div>
                <p className="text-[11px] uppercase font-black tracking-[0.10em] text-slate-700 mb-3">{user.email}</p>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#ddd4c8] rounded text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700">
                    <Heart size={14} className="text-red-500" />
                    {savedCars.length} Saved
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#ddd4c8] rounded text-[10px] uppercase font-black tracking-[0.15em] font-semibold text-slate-700">
                    <MessageSquare size={14} className="text-#ff5a2f" />
                    {enquiries.length} Enquiries
                  </div>
                </div>
              </div>

              {/* Quick Link */}
              <a href="/cars" className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#111111] text-white rounded-none font-semibold text-[11px] uppercase font-black tracking-[0.10em] hover:bg-[#111111] transition">
                Browse Cars <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </header>

        {/* Tabbed Interface */}
        <div className="bg-white border border-[#ddd4c8] rounded-none overflow-hidden min-h-[600px]">
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
      </div>
    </div>
  );
}

