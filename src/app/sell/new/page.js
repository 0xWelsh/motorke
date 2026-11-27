// src/app/sell/new/page.js
export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { ShieldCheck, LogIn } from "lucide-react";
import SellCarForm from "@/components/SellCarForm";

export const metadata = { title: { absolute: "List Your Car | BIDGARI" } };

export default async function NewPrivateListingPage() {
  const session = await getSession();
  const user = session
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, name: true, handle: true, verificationStatus: true },
      })
    : null;

  const eligible = user && user.role === "BUYER" && user.verificationStatus === "VERIFIED" && user.handle;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-3xl">
        <p className="text-[11px] uppercase font-black tracking-[0.15em] text-dim mb-2">Self-service</p>
        <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight mb-2">
          List your car yourself
        </h1>
        <p className="text-sm text-muted mb-8">
          Free while we settle in. Reviewed by a human before it goes live — no, still not an auction.
        </p>

        {!user && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center">
            <LogIn size={28} className="mx-auto text-muted mb-3" />
            <p className="text-sm font-bold text-text mb-4">Sign in to list your car.</p>
            <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>{" "}
            <Link href="/signup" className="btn btn-dark btn-sm">Create account</Link>
          </div>
        )}

        {user && !eligible && (
          <div className="bg-surface border border-border rounded-2xl p-8">
            <ShieldCheck size={28} className="text-[var(--accent)] mb-3" />
            <h2 className="text-lg font-black text-text mb-2">One step away</h2>
            <p className="text-sm text-muted mb-5">
              {!user.handle
                ? "Pick a profile handle on your account page first — it becomes your public profile address."
                : user.verificationStatus !== "VERIFIED"
                ? "Private listings are for verified accounts. Apply for verification on your account page — it usually takes a day."
                : "This account type uses the dealer dashboard instead."}
            </p>
            <Link href="/account" className="btn btn-dark btn-sm">Go to my account</Link>
          </div>
        )}

        {eligible && (
          <div className="bg-surface border border-border rounded-2xl p-5 sm:p-8">
            <SellCarForm />
          </div>
        )}

        <p className="mt-8 text-xs text-muted">
          Prefer us to handle everything — valuation, photos, paperwork?{" "}
          <Link href="/sell" className="text-[var(--accent)] hover:underline">Use the managed sale</Link>.
        </p>
      </div>
    </div>
  );
}
