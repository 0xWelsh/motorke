"use client";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, ShieldAlert } from "lucide-react";

export default function ReportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [listingRef, setListingRef] = useState("");
  const [scammerContact, setScammerContact] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const parts = [];
    if (listingRef.trim()) parts.push(`Listing reference: ${listingRef.trim()}`);
    if (scammerContact.trim()) parts.push(`Scammer contact: ${scammerContact.trim()}`);
    parts.push(`What happened:\n${details.trim()}`);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          subject: "scam",
          message: parts.join("\n\n"),
          website,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || "We could not send your report. Please try again.");
        setLoading(false);
        return;
      }

      setName("");
      setEmail("");
      setListingRef("");
      setScammerContact("");
      setDetails("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 6000);
    } catch (error) {
      console.error("Error submitting report:", error);
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen transition-colors duration-300 overflow-x-hidden">
      {/* Header */}
      <section className="bg-surface pt-20 sm:pt-32 lg:pt-40 pb-8 sm:pb-16 lg:pb-20 px-4 sm:px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-4 sm:mb-8">
            <span>Home</span>
            <span>/</span>
            <Link href="/safety" className="hover:text-text transition-colors">Safety</Link>
            <span>/</span>
            <span className="text-text">Report a Scam</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-text tracking-tight leading-[1.1] mb-3 sm:mb-6">
            Report a <br className="hidden sm:block" />
            <span className="font-black tracking-tight text-rose-500">scam.</span>
          </h1>
          <p className="text-muted text-sm sm:text-lg font-medium max-w-2xl leading-relaxed">
            Spotted a fraudulent listing, or been targeted by someone pretending to be BIDGARI? Tell us what happened and we&apos;ll investigate immediately.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-16 lg:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8 lg:space-y-16 min-w-0">
            <div className="space-y-6 lg:space-y-12">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 sm:mb-6">What happens next</h3>
                <ul className="space-y-3">
                  {[
                    "Our safety team reviews every report.",
                    "We remove fraudulent listings and warn other buyers.",
                    "We work with law enforcement where evidence supports it.",
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-muted leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2 sm:mb-6">Prefer email?</h3>
                <a
                  href={`mailto:${PUBLIC_SUPPORT_EMAIL}`}
                  className="block text-base sm:text-xl font-bold text-text hover:text-[var(--accent)] transition-colors break-words"
                >
                  {PUBLIC_SUPPORT_EMAIL}
                </a>
                <p className="mt-2 text-xs sm:text-sm font-medium text-muted">Include the listing reference if you have one.</p>
              </div>

              <div className="pt-6 sm:pt-12 border-t border-border">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-3 sm:mb-6">Help yourself</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Link href="/safety" className="btn btn-neutral btn-sm">Safety guide</Link>
                  <Link href="/faq" className="btn btn-neutral btn-sm">Read the FAQ</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-8 min-w-0">
            {submitted ? (
              <div className="bg-surface p-6 sm:p-12 text-center border border-border shadow-2xl rounded-xl">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--accent)] mx-auto mb-4 sm:mb-6" />
                <h3 className="text-2xl sm:text-3xl font-bold text-text mb-3 sm:mb-4">Report received.</h3>
                <p className="text-muted font-medium text-sm sm:text-lg leading-relaxed">
                  Thanks for looking out for other buyers. Our safety team will review the report and follow up if we need more details.
                </p>
                <button onClick={() => setSubmitted(false)} className="mt-6 sm:mt-8 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:underline">Submit another report</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-4 sm:gap-y-6 md:gap-y-10">
                {/* Honeypot — hidden from humans, bots fill it and we silently drop the submission */}
                <input
                  type="text"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />
                {errorMsg && (
                  <div className="md:col-span-2 p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Could not send</p>
                    <p className="text-sm font-bold text-rose-600">{errorMsg}</p>
                  </div>
                )}
                <div className="space-y-2 sm:space-y-3 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Your name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" className="w-full bg-surface-hover border border-border px-4 py-3.5 sm:px-5 sm:py-5 text-sm font-bold text-text outline-none focus:bg-surface focus:border-accent-glow transition-all rounded-xl" />
                </div>
                <div className="space-y-2 sm:space-y-3 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Your email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" className="w-full bg-surface-hover border border-border px-4 py-3.5 sm:px-5 sm:py-5 text-sm font-bold text-text outline-none focus:bg-surface focus:border-accent-glow transition-all rounded-xl" />
                </div>
                <div className="space-y-2 sm:space-y-3 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Listing reference <span className="text-dim normal-case">(optional)</span></label>
                  <input type="text" value={listingRef} onChange={(e) => setListingRef(e.target.value)} placeholder="e.g. the car reference ID or URL" className="w-full bg-surface-hover border border-border px-4 py-3.5 sm:px-5 sm:py-5 text-sm font-bold text-text outline-none focus:bg-surface focus:border-accent-glow transition-all rounded-xl" />
                </div>
                <div className="space-y-2 sm:space-y-3 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Scammer contact <span className="text-dim normal-case">(optional)</span></label>
                  <input type="text" value={scammerContact} onChange={(e) => setScammerContact(e.target.value)} placeholder="Phone / M-Pesa number / username" className="w-full bg-surface-hover border border-border px-4 py-3.5 sm:px-5 sm:py-5 text-sm font-bold text-text outline-none focus:bg-surface focus:border-accent-glow transition-all rounded-xl" />
                </div>
                <div className="md:col-span-2 space-y-2 sm:space-y-3 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">What happened?</label>
                  <textarea value={details} onChange={(e) => setDetails(e.target.value)} required rows={5} placeholder="Tell us what happened — any screenshots, messages, or payment details you're comfortable sharing..." className="w-full bg-surface-hover border border-border px-4 py-3.5 sm:px-5 sm:py-5 text-sm font-bold text-text outline-none focus:bg-surface focus:border-accent-glow transition-all resize-none rounded-xl"></textarea>
                </div>
                <div className="md:col-span-2">
                  <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
                    {loading ? "Sending..." : "Submit report"}
                    <ArrowRight />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
