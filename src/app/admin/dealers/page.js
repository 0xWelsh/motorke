// src/app/admin/dealers/page.js
export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Building2,
  MapPin,
  UserPlus,
  ShieldCheck,
  MessageSquare,
  Car,
  Activity,
  ArrowUpRight,
  Users,
  LogIn,
  Star,
  ExternalLink,
} from "lucide-react";

export const metadata = { title: "Dealers — Welsh Motors Admin" };

const avatarGradients = [
  "from-[#111111] to-[#2a2a2a]",
  "from-[#ff5a2f] to-[#e54a1f]",
  "from-emerald-800 to-emerald-950",
  "from-indigo-800 to-indigo-950",
  "from-amber-800 to-orange-950",
];

export default async function AdminDealersPage() {
  await requireAdmin();

  const dealers = await db.dealer.findMany({
    include: {
      _count: { select: { cars: true, leads: true, users: true } },
    },
    orderBy: { name: "asc" },
  });

  /** Pending verification surfaces first — admin attention */
  const sorted = [...dealers].sort((a, b) => {
    if (a.verified !== b.verified) return Number(a.verified) - Number(b.verified);
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const verifiedCount = dealers.filter((d) => d.verified).length;
  const pendingCount = dealers.length - verifiedCount;
  const featuredCount = dealers.filter((d) => d.featured).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 max-w-[1400px] mx-auto">
      {/* Page shell — matches admin warm / slate shell */}
      <section className="relative overflow-hidden rounded-2xl border border-[#ede7dd] dark:border-zinc-800 bg-gradient-to-br from-white via-[#fdfcfa] to-[#f6f7f9] dark:from-[#101012] dark:via-[#0f0f10] dark:to-[#0b0b0c] px-6 py-8 sm:px-8 sm:py-10 mb-8 lg:mb-10 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#ff5a2f]/10 blur-3xl dark:bg-[#ff5a2f]/5" aria-hidden />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#ff5a2f] shadow-[0_0_12px_rgba(255,90,47,0.65)]" aria-hidden />
              <span className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
                Dealer network
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Dealers
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-slate-600 dark:text-zinc-400">
              Manage dealership accounts, verification, and marketplace visibility. Use <span className="font-semibold text-slate-800 dark:text-zinc-200">Login</span> to open the portal as that dealer.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-stretch xl:flex-row xl:items-center">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: "Total", value: dealers.length, tone: "text-slate-900 dark:text-white" },
                { label: "Verified", value: verifiedCount, tone: "text-emerald-700 dark:text-emerald-400" },
                { label: "Pending", value: pendingCount, tone: pendingCount ? "text-amber-700 dark:text-amber-400" : "text-slate-400" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-[#ede7dd] bg-white/80 px-3 py-2.5 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60 sm:min-w-[5.5rem]"
                >
                  <p className={`text-xl font-black tabular-nums sm:text-2xl ${s.tone}`}>{s.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
            <Link
              href="/admin/dealers/new"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ff5a2f] px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-md shadow-orange-950/15 transition hover:bg-[#e54a1f] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5a2f] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101012]"
            >
              <UserPlus size={18} strokeWidth={2.25} /> Add dealer
            </Link>
          </div>
        </div>

        {featuredCount > 0 && (
          <p className="relative mt-6 flex items-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
            <Star size={14} className="text-amber-500" fill="currentColor" />
            <span>
              <span className="font-black text-slate-900 dark:text-white">{featuredCount}</span> featured on marketplace home
            </span>
          </p>
        )}
      </section>

      {/* Dealer grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((dealer) => {
          const grad = avatarGradients[dealer.name.charCodeAt(0) % avatarGradients.length];
          return (
            <article
              key={dealer.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#ede7dd] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#ff5a2f]/35 hover:shadow-md dark:border-zinc-800 dark:bg-[#111111] dark:hover:border-[#ff5a2f]/30"
            >
              <div className="h-1 w-full bg-gradient-to-r from-[#ff5a2f]/80 via-amber-500/60 to-transparent opacity-60 transition group-hover:opacity-100" aria-hidden />

              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-lg font-black text-white shadow-inner ring-1 ring-white/10 transition group-hover:scale-[1.02]`}
                    >
                      {dealer.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold capitalize leading-tight text-slate-900 transition group-hover:text-[#ff5a2f] dark:text-white">
                        {dealer.name}
                      </h2>
                      <div className="mt-1 flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                        <MapPin size={13} className="shrink-0 opacity-80" aria-hidden />
                        <span className="truncate text-xs font-semibold">{dealer.county || "Unknown"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <form action="/api/auth/impersonate" method="POST">
                      <input type="hidden" name="dealerId" value={dealer.id} />
                      <button
                        type="submit"
                        title="Open portal as this dealer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#ede7dd] bg-[#f6f7f9] px-2.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600"
                      >
                        <LogIn size={14} />
                        Login
                      </button>
                    </form>
                    <Link
                      href={`/dealers/${dealer.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-[#ff5a2f] dark:text-zinc-500 dark:hover:text-[#ff5a2f]"
                    >
                      Storefront <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-3 gap-2">
                  {[
                    { label: "Cars", value: dealer._count.cars, icon: Car },
                    { label: "Leads", value: dealer._count.leads, icon: MessageSquare },
                    { label: "Users", value: dealer._count.users, icon: Users },
                  ].map(({ label, value, icon: Icon }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-100 bg-slate-50/90 px-2.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <div className="mb-1 flex items-center gap-1 text-slate-500 dark:text-zinc-500">
                        <Icon size={13} className="opacity-90" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                      </div>
                      <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {dealer.verified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <ShieldCheck size={14} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                        <Activity size={14} /> Pending
                      </span>
                    )}
                    {dealer.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50/80 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
                        <Star size={12} className="text-amber-500" fill="currentColor" /> Featured
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/dealers/${dealer.id}/edit`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-900 hover:bg-slate-900 hover:text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-white dark:hover:bg-white dark:hover:text-slate-900"
                    title="Edit dealer"
                  >
                    <ArrowUpRight size={18} strokeWidth={2.25} />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}

        {dealers.length === 0 && (
          <div className="col-span-full flex flex-col items-center rounded-2xl border border-dashed border-[#ddd4c8] bg-white/70 py-20 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f6f7f9] dark:bg-zinc-800">
              <Building2 size={28} className="text-slate-400 dark:text-zinc-500" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">No dealers yet</p>
            <p className="mt-2 max-w-sm text-sm text-slate-600 dark:text-zinc-400">
              Create the first dealership to appear on the marketplace.
            </p>
            <Link
              href="/admin/dealers/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff5a2f] px-5 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white hover:bg-[#e54a1f]"
            >
              <UserPlus size={18} /> Add dealer
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
