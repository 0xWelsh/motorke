"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronRight, ShieldCheck } from "lucide-react";
import { PUBLIC_SUPPORT_PHONE } from "@/lib/site-contact";
import { telHrefFromMsisdn } from "@/lib/phone-hints";

const LOCATIONS = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret",
  "Thika", "Naivasha", "Nyeri", "Meru", "Kericho",
  "Kakamega", "Machakos",
];

function Section({ title, children }) {
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <h3 className="bg-[var(--sidebar-bar)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white">
        {title}
      </h3>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

export default function HomepageSidebarRight() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const telHref = PUBLIC_SUPPORT_PHONE ? telHrefFromMsisdn(PUBLIC_SUPPORT_PHONE) : null;

  function submitKeyword(e) {
    e.preventDefault();
    const term = keyword.trim();
    if (term) router.push(`/cars?search=${encodeURIComponent(term)}`);
    else router.push("/cars");
  }

  return (
    <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <form onSubmit={submitKeyword} className="relative border-b border-slate-200">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search vehicles..."
          className="w-full bg-slate-50 py-3 pl-10 pr-3 text-[13px] font-semibold text-slate-900 outline-none placeholder:text-slate-400 transition-colors focus:bg-white"
        />
      </form>

      <Section title="Locations">
        <div className="space-y-0.5">
          {LOCATIONS.map((c) => (
            <Link
              key={c}
              href={`/cars?county=${encodeURIComponent(c)}`}
              className="flex w-full items-center gap-1.5 rounded py-1 text-[12px] font-semibold text-slate-600 transition-colors hover:text-slate-900"
            >
              <MapPin className="h-3 w-3 shrink-0 text-slate-300" aria-hidden />
              <span className="min-w-0 truncate">{c}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Why BIDGARI">
        <p className="flex items-start gap-2 text-[11px] font-medium leading-relaxed text-slate-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
          Every listing is verified and sold through one trusted BIDGARI team.
        </p>
        <Link
          href="/how-to-buy"
          className="mt-2 flex w-full items-center gap-1.5 rounded py-1 text-[12px] font-semibold text-[var(--accent)] transition-colors hover:underline"
        >
          How it works
          <ChevronRight className="h-3 w-3 shrink-0" aria-hidden />
        </Link>
        {telHref && (
          <a
            href={telHref}
            className="mt-1 block text-[11px] font-bold text-slate-700 hover:text-[var(--accent)]"
          >
            Call us: {PUBLIC_SUPPORT_PHONE}
          </a>
        )}
      </Section>
    </aside>
  );
}
