// src/app/portal/page.js
export const dynamic = "force-dynamic";
import { requireDealer } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCarPrice, formatMileage } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { carListingPath } from "@/lib/car-listing-url";
import { 
  Plus, 
  Car, 
  EyeOff, 
  MessageSquare, 
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2, 
  Edit3,
  ExternalLink,
  Eye,
  ShieldCheck,
  CalendarDays,
  CircleDot,
  BadgeCheck,
  Crown,
  Rocket
} from "lucide-react";

export const metadata = { title: "Dashboard — Welsh Motorhub Dealer Portal" };

function pctChange(current, previous) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

function formatLeadAge(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function PortalPage({ searchParams }) {
  const user = await requireDealer();
  const sp = await searchParams;
  const created = sp?.created === "1";
  const createdCarId = sp?.car || "";

  if (!user.dealerId || !user.dealer) {
    redirect("/portal/profile?error=missing_dealer");
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfPrevMonth = new Date(startOfMonth);
  startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);

  const [cars, totalLeads, leadsThisMonth, leadsPrevMonth, viewsThisMonth, viewsPrevMonth, soldThisMonth, soldPrevMonth, recentLeads, dealerSubscription] = await Promise.all([
    db.car.findMany({
      where:   { dealerId: user.dealerId },
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.count({ where: { dealerId: user.dealerId } }),
    db.lead.count({ where: { dealerId: user.dealerId, createdAt: { gte: startOfMonth } } }),
    db.lead.count({ where: { dealerId: user.dealerId, createdAt: { gte: startOfPrevMonth, lt: startOfMonth } } }),
    db.carView.count({ where: { car: { dealerId: user.dealerId }, viewedAt: { gte: startOfMonth } } }),
    db.carView.count({ where: { car: { dealerId: user.dealerId }, viewedAt: { gte: startOfPrevMonth, lt: startOfMonth } } }),
    db.lead.count({ where: { dealerId: user.dealerId, status: "SOLD", createdAt: { gte: startOfMonth } } }),
    db.lead.count({ where: { dealerId: user.dealerId, status: "SOLD", createdAt: { gte: startOfPrevMonth, lt: startOfMonth } } }),
    db.lead.findMany({
      where: { dealerId: user.dealerId },
      include: { car: { select: { make: true, model: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.subscription.findUnique({
      where: { dealerId: user.dealerId },
      select: { plan: true, status: true, endDate: true },
    }),
  ]);

  const live   = cars.filter((c) => c.available).length;
  const hidden = cars.filter((c) => !c.available).length;

  const nowMs = Date.now();
  const freshCutoffMs = nowMs - 72 * 60 * 60 * 1000; // 72h
  const agingCutoffMs = nowMs - 14 * 24 * 60 * 60 * 1000; // 14d
  const freshCount = cars.filter((c) => new Date(c.updatedAt).getTime() >= freshCutoffMs).length;
  const agingCount = cars.filter((c) => {
    const t = new Date(c.updatedAt).getTime();
    return t < freshCutoffMs && t >= agingCutoffMs;
  }).length;
  const staleCount = cars.filter((c) => new Date(c.updatedAt).getTime() < agingCutoffMs).length;

  const totalUnits = live + hidden;
  const liveRate = totalUnits > 0 ? Math.round((live / totalUnits) * 100) : 0;
  const viewsTrend = pctChange(viewsThisMonth, viewsPrevMonth);
  const leadsTrend = pctChange(leadsThisMonth, leadsPrevMonth);
  const soldTrend = pctChange(soldThisMonth, soldPrevMonth);
  const profileChecks = [
    !!user.dealer.logoUrl,
    !!user.dealer.bannerUrl,
    !!user.dealer.description,
    !!user.dealer.phone,
    !!user.dealer.whatsapp,
    !!user.dealer.address,
    !!user.dealer.website,
    !!user.dealer.instagramUrl,
    !!user.dealer.facebookUrl || !!user.dealer.tiktokUrl,
    user.dealer.lat != null && user.dealer.lng != null,
    cars.length > 0,
    user.dealer.verified,
  ];
  const profileStrength = Math.round((profileChecks.filter(Boolean).length / profileChecks.length) * 100);
  const todayLabel = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
  const statCards = [
    {
      label: "Live inventory",
      value: live,
      sub: `${hidden} draft${hidden === 1 ? "" : "s"}`,
      trend: null,
      icon: CheckCircle2,
      iconClass: "text-[#2F855A]",
    },
    {
      label: "Views (this month)",
      value: viewsThisMonth.toLocaleString(),
      sub: `${viewsPrevMonth.toLocaleString()} last month`,
      trend: viewsTrend,
      icon: Eye,
      iconClass: "text-violet-500",
    },
    {
      label: "Leads / enquiries",
      value: leadsThisMonth,
      sub: `${totalLeads} total leads`,
      trend: leadsTrend,
      icon: MessageSquare,
      iconClass: "text-amber-500",
    },
    {
      label: "Cars sold",
      value: soldThisMonth,
      sub: `${soldPrevMonth} last month`,
      trend: soldTrend,
      icon: BadgeCheck,
      iconClass: "text-blue-500",
    },
  ];
  const recentCars = cars.slice(0, 6);

  let publishedListingHref = "/portal/inventory";
  if (created && createdCarId) {
    const row = await db.car.findFirst({
      where: { id: createdCarId, dealerId: user.dealerId },
      select: { id: true, publicSlug: true },
    });
    if (row) publishedListingHref = carListingPath(row);
  }

  return (
    <div className="animate-in fade-in duration-700">
      {user.dealer && !user.dealer.verified && (
        <div className="mb-8 sm:mb-10 p-4 sm:p-6 bg-amber-50 rounded-none flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-none bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} className="sm:block hidden" />
              <ShieldCheck size={16} className="sm:hidden" />
            </div>
            <div>
              <h3 className="text-[11px] uppercase font-black tracking-[0.10em] text-amber-800 mb-1">Account Under Review</h3>
              <p className="text-[11px] font-semibold normal-case tracking-normal text-amber-800/90 leading-snug">
                Your dealer profile is pending admin verification. Listings can still appear on the marketplace while we review; the{" "}
                <span className="font-bold">verified dealer</span> badge is added after approval.
              </p>
            </div>
        </div>
      )}
      
      <div className="flex flex-col gap-3 sm:gap-6 mb-5 sm:mb-8">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2F855A] mb-1 block">Dealer cockpit</span>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome back, {user.dealer.name}</h1>
            <p className="text-[11px] sm:text-[12px] text-slate-500 mt-1">Here is what is happening in your dealership today.</p>
          </div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 border border-slate-200 bg-white text-[10px] sm:text-[11px] font-bold text-slate-700">
            <CalendarDays className="w-4 h-4 text-slate-500" />
            {todayLabel}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link href="/portal/cars/bulk"
            className="flex items-center justify-center sm:justify-start gap-2 bg-slate-50 hover:bg-slate-100 dark:bg-[#111111] text-slate-700 dark:text-white text-xs font-bold uppercase tracking-wider px-4 sm:px-4 py-2.5 sm:py-3 rounded-none transition-all">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> Bulk Upload
          </Link>
          <Link href="/portal/cars/new"
            className="flex items-center justify-center sm:justify-start gap-2 bg-[#111111] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 sm:px-6 py-2.5 sm:py-3 rounded-none shadow-sm transition-all">
            <Plus size={16} className="sm:block hidden" />
            <Plus size={14} className="sm:hidden" /> New Listing
          </Link>
        </div>
      </div>

      {created && (
        <div className="mb-8 rounded-none border-l-4 border-l-[#2F855A] bg-emerald-50 px-6 py-5">
          <h2 className="text-[11px] uppercase font-black tracking-[0.10em] font-black uppercase tracking-[0.12em] text-[#2F855A]">Listing Published</h2>
          <p className="mt-2 text-[11px] uppercase font-black tracking-[0.10em] font-semibold text-emerald-800">
            Great work. Complete these quick actions to boost enquiries.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Link href={publishedListingHref} className="rounded-none bg-white px-3 py-2 text-[11px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-[#2F855A] hover:bg-emerald-100">View Live Listing</Link>
            <Link href="/portal/inventory" className="rounded-none bg-white px-3 py-2 text-[11px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-[#2F855A] hover:bg-emerald-100">Share To Buyer Groups</Link>
            <Link href="/portal/leads" className="rounded-none bg-white px-3 py-2 text-[11px] uppercase font-black tracking-[0.15em] font-black uppercase tracking-wider text-[#2F855A] hover:bg-emerald-100">Watch Incoming Leads</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <section className="lg:col-span-9">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-5">
            {statCards.map((stat) => {
              const StatIcon = stat.icon;
              const hasTrend = typeof stat.trend === "number";
              const trendUp = (stat.trend || 0) >= 0;
              return (
                <div key={stat.label} className="bg-white border border-slate-200 p-2.5 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-50 ${stat.iconClass}`}>
                      <StatIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </span>
                    {hasTrend && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase ${trendUp ? "text-[#2F855A]" : "text-rose-600"}`}>
                        {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(stat.trend)}%
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.11em] sm:tracking-[0.13em] text-slate-500">{stat.label}</p>
                  <p className="mt-0.5 text-xl sm:text-3xl font-black tracking-tight text-slate-900">{stat.value}</p>
                  <p className="mt-0.5 text-[10px] sm:text-[11px] font-semibold text-slate-500">{stat.sub}</p>
                </div>
              );
            })}
            <div className="bg-white border border-slate-200 p-2.5 sm:p-4 col-span-2 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-700">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase text-[#2F855A]">Excellent</span>
              </div>
              <p className="mt-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.11em] sm:tracking-[0.13em] text-slate-500">Profile strength</p>
              <p className="mt-0.5 text-xl sm:text-3xl font-black tracking-tight text-slate-900">{profileStrength}%</p>
              <div className="mt-2 h-2 bg-slate-100">
                <div className="h-2 bg-[#2F855A]" style={{ width: `${profileStrength}%` }} />
              </div>
              <Link href="/portal/profile" className="mt-2 inline-flex text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 hover:text-[#2F855A]">
                Improve profile
              </Link>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white dark:bg-[#111111] rounded-none shadow-sm overflow-hidden mb-4 sm:mb-6">
            <div className="px-3 py-3 sm:px-5 sm:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#111111]">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-none bg-[#2F855A]" />
                Recent Inventory
              </h2>
              <Link href="/portal/inventory" className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 hover:text-[#2F855A] transition-colors">
                View all inventory →
              </Link>
            </div>
            {cars.length === 0 ? (
              <div className="text-center py-16 sm:py-24 px-6 sm:px-8">
                <div className="w-16 h-16 bg-slate-50 dark:bg-[#111111] rounded-none flex items-center justify-center mx-auto mb-6">
                  <Car className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No cars listed yet</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 font-medium">
                  Your inventory is currently empty. Start reaching buyers by adding your first car.
                </p>
                <Link href="/portal/cars/new"
                  className="inline-flex items-center gap-2 bg-[#2F855A] hover:bg-[#38A169] text-white font-bold px-6 py-3 rounded-none transition-all">
                  Add Your First Car
                </Link>
              </div>
            ) : (
              <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#151515]">
                      <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3">Vehicle</th>
                      <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3">Price</th>
                      <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3">Views</th>
                      <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3">Leads</th>
                      <th className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3">Status</th>
                      <th className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentCars.map((car) => {
                      const carLeads = recentLeads.filter((lead) => lead.carId === car.id).length;
                      return (
                        <tr key={car.id} className="hover:bg-slate-50 dark:bg-[#111111] dark:hover:bg-[#111111]/50 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-9 rounded-none bg-slate-100 dark:bg-[#111111] overflow-hidden shrink-0">
                                {car.images[0]
                                  ? <Image src={car.images[0].url} alt={`${car.make} ${car.model}`} width={96} height={72} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  : <div className="flex items-center justify-center h-full text-slate-400 text-[10px] font-bold uppercase">No Pic</div>
                                }
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{car.year} {car.make} {car.model}</p>
                                <p className="text-[11px] font-semibold text-slate-500 truncate">{formatMileage(car.mileage)} · {car.transmission}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{formatCarPrice(car)}</p>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">{car.views.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">{carLeads}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-none uppercase tracking-widest ${
                              car.available
                                ? "bg-emerald-50 dark:bg-[#2F855A]/10 text-[#2F855A] dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-slate-300"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-none ${car.available ? "bg-[#2F855A] animate-pulse" : "bg-slate-400"}`} />
                              {car.available ? "Live" : "Draft"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/portal/cars/${car.id}/edit`}
                                className="p-1.5 bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white rounded-none hover:bg-slate-800 dark:hover:bg-slate-600 transition-all">
                                <Edit3 size={13} />
                              </Link>
                              <Link href={carListingPath(car)} target="_blank"
                                className="p-1.5 bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white rounded-none hover:bg-slate-800 dark:hover:bg-slate-600 transition-all">
                                <ExternalLink size={13} />
                              </Link>
                              <form action={`/api/admin/cars/${car.id}/toggle`} method="POST">
                                <button type="submit"
                                  className="p-1.5 bg-slate-100 dark:bg-[#222222] text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white rounded-none hover:bg-slate-800 dark:hover:bg-slate-600 transition-all">
                                  {car.available ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y divide-slate-100">
                {recentCars.map((car) => {
                  const carLeads = recentLeads.filter((lead) => lead.carId === car.id).length;
                  return (
                    <div key={`mobile-${car.id}`} className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-12 h-9 rounded-none bg-slate-100 overflow-hidden shrink-0">
                          {car.images[0]
                            ? <Image src={car.images[0].url} alt={`${car.make} ${car.model}`} width={96} height={72} className="w-full h-full object-cover" />
                            : <div className="flex items-center justify-center h-full text-slate-400 text-[9px] font-bold uppercase">No Pic</div>
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-slate-900 truncate">{car.year} {car.make} {car.model}</p>
                          <p className="text-[10px] font-semibold text-slate-500 truncate">{formatCarPrice(car)} · {car.views.toLocaleString()} views · {carLeads} leads</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-1 uppercase tracking-[0.1em] ${
                          car.available ? "bg-emerald-50 text-[#2F855A]" : "bg-slate-100 text-slate-600"
                        }`}>
                          {car.available ? "Live" : "Draft"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-2 border border-emerald-200/80 bg-emerald-50 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <CircleDot className="w-3.5 h-3.5 text-[#2F855A]" />
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">Fresh ({freshCount})</span>
            </div>
            <div className="inline-flex items-center gap-2 border border-amber-200/80 bg-amber-50 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <CircleDot className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-amber-800">Aging ({agingCount})</span>
            </div>
            <div className="inline-flex items-center gap-2 border border-rose-200/80 bg-rose-50 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <CircleDot className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-rose-800">Stale ({staleCount})</span>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-3 space-y-3 sm:space-y-4">
          <div className="bg-white border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">Leads overview</h3>
              <Link href="/portal/leads" className="text-[10px] font-black uppercase tracking-[0.12em] text-sky-600 hover:text-sky-700">View all leads →</Link>
            </div>
            <div className="mt-3 space-y-2">
              {recentLeads.length === 0 && (
                <p className="text-[12px] font-semibold text-slate-500">No leads yet.</p>
              )}
              {recentLeads.map((lead) => (
                <div key={lead.id} className="border border-slate-100 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-bold text-slate-900">{lead.name}</p>
                      <p className="text-[11px] text-slate-500">Interested in {lead.car?.make} {lead.car?.model}</p>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-1 ${
                      lead.status === "NEW" ? "bg-emerald-100 text-emerald-700" :
                      lead.status === "CONTACTED" ? "bg-blue-100 text-blue-700" :
                      lead.status === "INTERESTED" ? "bg-violet-100 text-violet-700" :
                      lead.status === "NEGOTIATING" ? "bg-amber-100 text-amber-700" :
                      lead.status === "SOLD" ? "bg-green-100 text-green-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">{formatLeadAge(lead.createdAt)}</p>
                </div>
              ))}
            </div>
            <Link href="/portal/leads" className="mt-3 inline-flex w-full justify-center border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50">
              Manage all leads
            </Link>
          </div>

          <div className="bg-white border border-slate-200 p-3 sm:p-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">Your plan</h3>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700">
                <Crown className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {dealerSubscription?.plan === "PRO" ? "Premium Dealer" : "Starter Dealer"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {dealerSubscription?.endDate
                    ? `Active until ${new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dealerSubscription.endDate))}`
                    : "No expiry date set"}
                </p>
              </div>
            </div>
            <Link href="/portal/subscription" className="mt-3 inline-flex w-full justify-center border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-50">
              Manage subscription
            </Link>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700">
                <Rocket className="w-4 h-4" />
              </span>
              <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-700">Boost your listings</h3>
            </div>
            <p className="mt-2 text-[12px] font-medium text-slate-600">Get more visibility and leads by promoting your top stock this week.</p>
            <Link href="/portal/subscription" className="mt-3 inline-flex w-full justify-center bg-[#2F855A] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white hover:bg-[#276749]">
              Create promotion
            </Link>
          </div>
        </aside>
      </div>

      {/* compact secondary quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white border border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Live inventory rate</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{liveRate}%</p>
        </div>
        <div className="bg-white border border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Leads this month</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{leadsThisMonth}</p>
        </div>
        <div className="bg-white border border-slate-200 px-3 py-2 sm:px-4 sm:py-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Cars sold this month</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{soldThisMonth}</p>
        </div>
      </div>
    </div>
  );
}
