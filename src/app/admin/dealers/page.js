// src/app/admin/dealers/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Building2,
  MapPin,
  UserPlus,
  MessageSquare,
  Car,
  Edit3,
  Users,
  LogIn,
  Star,
  ExternalLink,
  ShieldCheck,
  Clock,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import DealerFlagToggles from "@/components/admin/DealerFlagToggles";

export const metadata = { title: "Dealers | Welsh Motorhub Admin" };

const avatarGradients = [
  "from-[#111111] to-[#2a2a2a]",
  "from-[#2F855A] to-[#38A169]",
  "from-emerald-800 to-emerald-950",
  "from-indigo-800 to-indigo-950",
  "from-teal-800 to-teal-950",
];

function dealerMediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return t.startsWith("/") ? t : `/${t}`;
}

export default async function AdminDealersPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: true, leads: true, users: true } },
    },
    orderBy: { name: "asc" },
  });

  const sorted = [...dealers].sort((a, b) => {
    if (a.verified !== b.verified) return Number(a.verified) - Number(b.verified);
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const verifiedCount = dealers.filter((d) => d.verified).length;
  const pendingCount = dealers.length - verifiedCount;
  const featuredCount = dealers.filter((d) => d.featured).length;

  return (
    <div className="mk-page-shell animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-full overflow-x-hidden">
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-[#e7e7e9] bg-white px-4 py-5 dark:border-zinc-800 dark:bg-[#111111] sm:mb-8 sm:px-6 sm:py-7 lg:px-8">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#2F855A]/10 blur-3xl dark:bg-[#2F855A]/5"
          aria-hidden
        />
        <div className="relative space-y-5 lg:flex lg:items-end lg:justify-between lg:gap-8 lg:space-y-0">
          <div className="min-w-0 lg:flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="inline-flex h-2 w-2 rounded-full bg-[#2F855A] shadow-[0_0_12px_rgba(47,133,90,0.65)]"
                aria-hidden
              />
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                Dealer network
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
              Dealers
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-500 dark:text-zinc-400">
              Showcase, verify, and manage dealership profiles. Use <span className="font-semibold text-slate-800 dark:text-zinc-200">Login</span> to open the portal as a dealer.
            </p>
          </div>

          <div className="w-full space-y-3 lg:max-w-sm lg:shrink-0">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total", value: dealers.length, tone: "text-slate-900 dark:text-white" },
                { label: "Verified", value: verifiedCount, tone: "text-emerald-700 dark:text-emerald-400" },
                {
                  label: "Pending",
                  value: pendingCount,
                  tone: pendingCount ? "text-sky-700 dark:text-sky-400" : "text-slate-400",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-[#e7e7e9] bg-[#fafafa] px-2 py-2.5 text-center dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <p className={`text-lg font-black tabular-nums leading-none ${s.tone}`}>{s.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/admin/dealers/new"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2F855A] px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#38A169]"
            >
              <UserPlus size={18} strokeWidth={2.25} /> Add dealer
            </Link>
          </div>
        </div>

        {featuredCount > 0 ? (
          <p className="relative mt-4 flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
            <Star size={14} className="text-[#38A169]" fill="currentColor" aria-hidden />
            <span>
              <span className="font-black text-slate-900 dark:text-white">{featuredCount}</span> featured on marketplace
              home
            </span>
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((dealer) => {
          const grad = avatarGradients[dealer.name.charCodeAt(0) % avatarGradients.length];
          const banner = dealerMediaUrl(dealer.bannerUrl);
          const logo = dealerMediaUrl(dealer.logoUrl);
          const initial = dealer.name[0]?.toUpperCase() ?? "?";

          return (
            <article
              key={dealer.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#e7e7e9] bg-white shadow-sm transition hover:border-[#2F855A]/30 hover:shadow-md dark:border-zinc-800 dark:bg-[#111111]"
            >
              {/* Banner + logo */}
              <div className="relative h-28 sm:h-32">
                {banner ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={banner} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className={`h-full w-full bg-gradient-to-br ${grad}`} aria-hidden />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" aria-hidden />

                <div className="absolute left-3 right-3 top-3 flex flex-wrap items-start justify-between gap-2">
                  {dealer.featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 bg-amber-50/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900 backdrop-blur-sm dark:border-amber-800/60 dark:bg-amber-950/80 dark:text-amber-200">
                      <Star size={10} fill="currentColor" aria-hidden /> Featured
                    </span>
                  ) : (
                    <span />
                  )}
                  {dealer.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-800 backdrop-blur-sm dark:border-emerald-800/60 dark:bg-emerald-950/80 dark:text-emerald-300">
                      <ShieldCheck size={10} aria-hidden /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/80 bg-sky-50/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-sky-800 backdrop-blur-sm dark:border-sky-800/60 dark:bg-sky-950/80 dark:text-sky-300">
                      <Clock size={10} aria-hidden /> Pending
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-8 left-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-[3px] border-white bg-white shadow-lg dark:border-zinc-900 dark:bg-zinc-900">
                    {logo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={logo} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad} text-xl font-black text-white`}
                      >
                        {initial}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col px-4 pb-4 pt-11 sm:px-5 sm:pb-5">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold capitalize leading-tight text-slate-900 dark:text-white">
                    {dealer.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                    <MapPin size={13} className="shrink-0 opacity-80" aria-hidden />
                    <span className="truncate text-xs font-semibold">
                      {[dealer.location, dealer.county]
                        .filter(Boolean)
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .join(", ") || "Kenya"}
                    </span>
                  </div>
                  {dealer.phone ? (
                    <p className="mt-1 truncate text-[11px] font-medium text-slate-500 dark:text-zinc-500">{dealer.phone}</p>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Cars", value: dealer._count.cars, icon: Car },
                    { label: "Leads", value: dealer._count.leads, icon: MessageSquare },
                    { label: "Users", value: dealer._count.users, icon: Users },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#ececf0] bg-[#fafafa] px-2 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <Icon size={13} className="mx-auto mb-0.5 text-slate-400 dark:text-zinc-500" aria-hidden />
                      <p className="text-base font-black tabular-nums leading-none text-slate-900 dark:text-white">{value}</p>
                      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Action bar */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/admin/cars/new?dealerId=${dealer.id}`}
                    className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F855A] px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-[#38A169]"
                  >
                    <Car size={15} strokeWidth={2.25} /> Add car
                  </Link>
                  <form action="/api/auth/impersonate" method="POST" className="min-w-0">
                    <input type="hidden" name="dealerId" value={dealer.id} />
                    <button
                      type="submit"
                      title="Open portal as this dealer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#e7e7e9] bg-white px-2 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:border-slate-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <LogIn size={14} /> Login
                    </button>
                  </form>
                  <Link
                    href={`/dealers/${dealer.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#e7e7e9] bg-white px-2 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:border-[#2F855A] hover:text-[#2F855A] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    <ExternalLink size={14} /> Storefront
                  </Link>
                  <Link
                    href={`/admin/dealers/${dealer.id}/edit`}
                    className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e7e7e9] bg-[#fafafa] px-3 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
                  >
                    <Edit3 size={14} /> Edit profile
                  </Link>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#ececf0] pt-4 dark:border-zinc-800">
                  <DealerFlagToggles dealerId={dealer.id} verified={dealer.verified} featured={dealer.featured} />
                </div>
              </div>
            </article>
          );
        })}

        {dealers.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No dealers yet"
              message="Create the first dealership to appear on the marketplace."
              actionHref="/admin/dealers/new"
              actionLabel="Add dealer"
              icon={<Building2 size={28} className="text-slate-400 dark:text-zinc-500" />}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
