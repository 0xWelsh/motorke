// src/app/account/page.js
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
        car:    { select: { id: true, make: true, model: true, year: true, price: true, available: true } },
        dealer: { select: { name: true, slug: true, phone: true, whatsapp: true } },
      },
      orderBy: { createdAt: "desc" },
      take:    20,
    }),
  ]);

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="container mx-auto px-6 max-w-4xl pt-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-2 block">Personal Dashboard</span>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Digital Garage</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold dark:text-slate-400 text-slate-600 uppercase tracking-widest">
            <Calendar size={14} className="text-amber-500" />
            Member since {new Date(user.createdAt || Date.now()).getFullYear()}
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-sm mb-12 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full group-hover:bg-amber-500/10 transition-colors" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 bg-slate-900 text-amber-500 rounded-[2rem] flex items-center justify-center font-black text-4xl shadow-2xl shadow-slate-900/10 rotate-3 group-hover:rotate-0 transition-transform">
              {user.name?.[0]?.toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h2>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mx-auto md:mx-0">
                  <ShieldCheck size={12} /> Verified Buyer
                </span>
              </div>
              <p className="dark:text-slate-500 text-slate-600 font-medium mb-6">{user.email}</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <Heart size={14} className="text-rose-500" />
                  <span className="text-xs font-black text-slate-700">{savedCars.length} Saved Cars</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl flex items-center gap-2">
                  <MessageSquare size={14} className="text-amber-500" />
                  <span className="text-xs font-black text-slate-700">{enquiries.length} Enquiries</span>
                </div>
              </div>
            </div>

            {/* Quick Link */}
            <a href="/cars" className="shrink-0 bg-slate-900 text-pureWhite px-8 py-4 rounded-2xl text-xs font-black flex items-center gap-2 hover:bg-slate-800 transition-all hover:scale-105">
              Browse Inventory <ArrowRight size={14} />
            </a>
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
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

