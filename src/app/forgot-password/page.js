"use client";

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
    <div className="min-h-screen bg-[#FCFCFD] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:text-slate-900 dark:text-white"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>

        <div className="mt-6 rounded-[1.75rem] border border-slate-200 dark:border-slate-800 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Forgot your password?</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Enter your account email and we will send a secure reset link.
            </p>
          </div>

          {error && <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
          {success && <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</p>}

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

            <label className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-700" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-emerald-500"
              />
            </div>

            <HumanCheck value={captchaToken} onChange={setCaptchaToken} />

            <button
              type="submit"
              disabled={loading || !email || !captchaToken}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin" size={15} /> : null}
              Send Reset Link
            </button>
          </form>

          <p className="mt-5 text-xs font-semibold text-slate-600">
            Need help now? Contact <a href="mailto:sec@welsh.co.ke" className="text-slate-900 dark:text-white underline underline-offset-2">sec@welsh.co.ke</a>
          </p>
        </div>
      </div>
    </div>
  );
}
