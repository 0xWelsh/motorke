"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, ShieldCheck, ShieldQuestion, X } from "lucide-react";
import { clsx } from "clsx";

const COPY = {
  UNVERIFIED: {
    icon: <ShieldQuestion size={18} />,
    title: "Get verified",
    body: "Verified accounts get a badge on their public profile — and priority when selling cars through BIDGARI.",
  },
  PENDING: {
    icon: <Clock size={18} />,
    title: "Application pending",
    body: "Our team is reviewing your details. This usually takes a day or two.",
  },
  VERIFIED: {
    icon: <ShieldCheck size={18} />,
    title: "Verified by BIDGARI",
    body: "Identity confirmed. Your badge is live on your public profile.",
  },
  REJECTED: {
    icon: <X size={18} />,
    title: "Application not approved",
  },
  SUSPENDED: {
    icon: <X size={18} />,
    title: "Verification suspended",
    body: "Contact support if you believe this is a mistake.",
  },
};

export default function ProfileVerificationCard({
  status = "UNVERIFIED",
  rejectionReason,
  handle,
  publicProfile,
}) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const copy = COPY[status] || COPY.UNVERIFIED;

  async function apply() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/profile/verify", { method: "POST" });
      const data = await res.json();
      setMsg(res.ok ? "PENDING" : data.error || "Something went wrong.");
    } catch {
      setMsg("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-border rounded-2xl p-5 sm:p-6 space-y-3">
      <div className="flex items-center gap-3">
        <span
          className={clsx(
            "w-9 h-9 rounded-xl flex items-center justify-center border",
            status === "VERIFIED"
              ? "bg-accent-wash border-[var(--accent-dim)] text-[var(--accent)]"
              : "bg-surface-hover border-border text-muted",
          )}
        >
          {copy.icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-text tracking-tight">{copy.title}</h3>
          <p className="text-xs font-medium text-muted mt-0.5">
            {status === "REJECTED" && rejectionReason
              ? `Reason: ${rejectionReason}`
              : copy.body || "You can re-apply once the missing details are fixed."}
          </p>
        </div>
      </div>

      {msg === "PENDING" ? (
        <p className="text-xs font-bold text-[var(--accent)]">Application submitted — you&apos;ll see it here.</p>
      ) : msg ? (
        <p className="text-xs font-bold text-rose-400">{msg}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {(status === "UNVERIFIED" || status === "REJECTED") && (
          <button type="button" onClick={apply} disabled={busy} className="btn btn-dark btn-sm">
            {busy ? "Submitting…" : "Apply for verification"}
          </button>
        )}
        {handle && publicProfile !== false && (
          <Link href={`/u/${handle}`} className="text-xs font-bold text-[var(--accent)] hover:underline">
            View public profile →
          </Link>
        )}
      </div>
    </div>
  );
}
