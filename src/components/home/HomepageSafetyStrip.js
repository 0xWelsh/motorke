import Link from "next/link";

/**
 * Safety — one quiet editorial block. No cards, no icon tiles: the promise
 * is short enough to say in three sentences and two links.
 */
export default function HomepageSafetyStrip() {
  return (
    <section className="py-12 sm:py-16">
      <div className="home-shell max-w-2xl">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
          Don&rsquo;t get scammed.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Car fraud in Kenya runs on deposits and ghost brokers. BIDGARI is built so
          neither can touch you: every listing is physically inspected before it goes
          live, money only moves at handover, and the same BIDGARI desk carries your
          enquiry from first message to final paperwork.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
          <Link
            href="/safety"
            className="text-[12px] font-black uppercase tracking-[0.14em] text-[var(--accent)] underline-offset-4 hover:underline"
          >
            Read the safety guide
          </Link>
          <Link
            href="/report"
            className="text-[12px] font-black uppercase tracking-[0.14em] text-muted transition-colors hover:text-[var(--accent-red)]"
          >
            Report a scam
          </Link>
        </div>
      </div>
    </section>
  );
}
