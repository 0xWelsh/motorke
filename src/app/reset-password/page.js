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
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
              <LockKeyhole size={20} />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Create a new password</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Use a strong password to secure your account access.</p>
          </div>

          {!isValidRequest && (
            <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">
              This reset link is invalid. Please request another password reset.
            </p>
          )}

          {error && <p className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400">{error}</p>}
          {success && <p className="mb-4 rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3 text-sm font-semibold text-[var(--accent)]">{success}</p>}

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

            <label className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-500" htmlFor="password">
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
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-4 pr-11 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--accent)]"
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

            <label className="block text-[11px] font-black uppercase tracking-[0.22em] text-slate-500" htmlFor="confirm">
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
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-4 pr-11 text-sm font-semibold text-slate-900 outline-none transition focus:border-[var(--accent)]"
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
              className="w-full btn btn-primary btn-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={15} /> : null}
              Reset Password
            </button>
          </form>

          {success && (
            <Link
              href="/login"
              className="mt-4 inline-flex text-xs font-bold text-[var(--accent)] hover:opacity-80"
            >
              Continue to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
