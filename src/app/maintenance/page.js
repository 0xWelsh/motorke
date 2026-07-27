// src/app/maintenance/page.js
// Public-facing maintenance screen shown when MAINTENANCE_MODE is on.
// Intentionally minimal: no nav, no footer, no DB calls, no client JS.

export const dynamic = "force-static";

export const metadata = {
  title: "We'll be right back | BIDGARI",
  description:
    "BIDGARI is undergoing brief maintenance. We'll be back online shortly.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main
      role="main"
      aria-labelledby="maintenance-heading"
      className="min-h-[100dvh] bg-[#1c1c1c] flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-white/[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.png"
            alt="BIDGARI"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          Maintenance in progress
        </div>

        <h1
          id="maintenance-heading"
          className="font-serif text-3xl font-black tracking-tight text-white sm:text-4xl"
        >
          We&rsquo;ll be right back.
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          BIDGARI is offline for a short window while we tidy a few things up.
          Your account, saved cars, and dealer inventory are safe.
        </p>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400 sm:text-base">
          Try again in a few minutes &mdash; or reach us in the meantime.
        </p>

        <div className="mt-8 flex flex-col items-center gap-2 text-sm">
          <a
            href="mailto:hello@welshmotorhub.co.ke"
            className="font-bold text-white underline-offset-4 hover:underline"
          >
            hello@welshmotorhub.co.ke
          </a>
          <a
            href="https://wa.me/254700000000"
            className="text-zinc-400 hover:text-[var(--accent)]"
          >
            WhatsApp support
          </a>
        </div>

        <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
          BIDGARI &middot; Kenya
        </p>
      </div>
    </main>
  );
}
