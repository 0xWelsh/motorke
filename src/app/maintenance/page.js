// src/app/maintenance/page.js
export const dynamic = "force-static";

export const metadata = {
  title: "We'll be right back | BIDGARI",
  description: "BIDGARI is undergoing brief maintenance. We'll be back online shortly.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main
      role="main"
      aria-labelledby="maintenance-heading"
      className="min-h-[100dvh] bg-[var(--bg)] flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-md text-center">
        {/* Building animation */}
        <div className="mx-auto mb-8 flex items-end justify-center gap-1.5 h-20">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-3 rounded-t-sm bg-[var(--accent)] opacity-80"
              style={{
                height: `${12 + i * 8}px`,
                animation: `buildUp 1.4s ease-in-out ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </div>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          </span>
          Building something new
        </div>

        <h1
          id="maintenance-heading"
          className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl"
        >
          We&rsquo;ll be right back.
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
          BIDGARI is offline for a short window while we rebuild a few things.
          Your account, saved cars, and dealer inventory are safe.
        </p>

        <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">
          Try again in a few minutes &mdash; or reach us in the meantime.
        </p>

        <div className="mt-8 flex flex-col items-center gap-2 text-sm">
          <a
            href="mailto:hello@welshmotorhub.co.ke"
            className="font-bold text-slate-900 underline-offset-4 hover:underline"
          >
            hello@welshmotorhub.co.ke
          </a>
          <a
            href="https://wa.me/254700000000"
            className="text-slate-500 hover:text-[var(--accent)]"
          >
            WhatsApp support
          </a>
        </div>

        <p className="mt-10 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          BIDGARI &middot; Kenya
        </p>
      </div>

      <style>{`
        @keyframes buildUp {
          0% { transform: scaleY(0.4); opacity: 0.3; }
          100% { transform: scaleY(1); opacity: 0.9; }
        }
      `}</style>
    </main>
  );
}
