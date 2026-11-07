"use client";

import { PUBLIC_SUPPORT_EMAIL } from "@/lib/site-contact";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Loader2, ShieldCheck } from "lucide-react";
import HumanCheck from "@/components/HumanCheck";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [website, setWebsite] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          captchaToken,
          website,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Unable to send reset link right now.");
      } else {
        setSuccess(payload.message || "If an account exists for that email, a reset link has been sent.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-900 hover:text-slate-900"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-wash text-[var(--accent)]">
              <ShieldCheck size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Forgot your password?</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Enter your account email and we will send a secure reset link.
            </p>
          </div>

          {error && <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">{error}</p>}
          {success && <p className="mb-4 rounded-xl border border-accent-dim bg-accent-wash px-4 py-3 text-sm font-semibold text-[var(--accent)]">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
              name="website"
            />

            <label className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-500" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <HumanCheck value={captchaToken} onChange={setCaptchaToken} />

            <button
              type="submit"
              disabled={loading || !email || !captchaToken}
              className="w-full btn btn-primary btn-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={15} /> : null}
              Send Reset Link
            </button>
          </form>

          <p className="mt-5 text-xs font-semibold text-slate-500">
            Need help now? Contact <a href={`mailto:${PUBLIC_SUPPORT_EMAIL}`} className="text-slate-900 underline underline-offset-2">{PUBLIC_SUPPORT_EMAIL}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
