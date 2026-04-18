"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import HumanCheck from "@/components/HumanCheck";

function PasswordStrength({ password }) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z\d]/.test(password)) score += 1;

  const labels = ["Weak", "Basic", "Good", "Strong"];
  const label = score > 0 ? labels[score - 1] : "Set a password";

  return (
    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Strength: {label}</p>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [website, setWebsite] = useState("");

  const isValidRequest = token.length > 0 && email.length > 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
          confirm,
          captchaToken,
          website,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Unable to reset your password.");
      } else {
        setSuccess(payload.message || "Password reset successful.");
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
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <LockKeyhole size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Create a new password</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">Use a strong password to secure your account access.</p>
          </div>

          {!isValidRequest && (
            <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              This reset link is invalid. Please request another password reset.
            </p>
          )}

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

            <label className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-700" htmlFor="password">
              New Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white py-3 pl-4 pr-11 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <PasswordStrength password={password} />

            <label className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-700" htmlFor="confirm">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showConfirm ? "text" : "password"}
                minLength={8}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                autoComplete="new-password"
                placeholder="Re-enter password"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white py-3 pl-4 pr-11 text-sm font-semibold text-slate-900 dark:text-white outline-none transition focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <HumanCheck value={captchaToken} onChange={setCaptchaToken} />

            <button
              type="submit"
              disabled={loading || !isValidRequest || !password || !confirm || !captchaToken}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin" size={15} /> : null}
              Reset Password
            </button>
          </form>

          {success && (
            <Link
              href="/login"
              className="mt-4 inline-flex text-xs font-bold text-emerald-700 hover:text-emerald-600"
            >
              Continue to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
