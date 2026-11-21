"use client";
import { useState } from "react";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import HumanCheck from "./HumanCheck";
import GoogleAuthButton, { GoogleAuthDivider } from "./GoogleAuthButton";
import AuthLayout from "./AuthLayout";

function PasswordMeter({ password }) {
  let score = 0;
  if (!password) score = 0;
  else {
    if (password.length > 7) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;
  }

  const segments = [
    score >= 1 ? (score < 3 ? "bg-rose-500" : (score === 3 ? "bg-amber-400" : "bg-[var(--accent)]")) : "bg-surface-overlay",
    score >= 2 ? (score < 3 ? "bg-rose-500" : (score === 3 ? "bg-amber-400" : "bg-[var(--accent)]")) : "bg-surface-overlay",
    score >= 3 ? (score === 3 ? "bg-amber-400" : "bg-[var(--accent)]") : "bg-surface-overlay",
    score >= 4 ? "bg-[var(--accent)]" : "bg-surface-overlay"
  ];

  let label = "";
  if (!password) label = "";
  else if (score === 0) label = "Very Weak";
  else if (score === 1) label = "Weak";
  else if (score === 2) label = "Fair";
  else if (score === 3) label = "Good";
  else if (score === 4) label = "Strong";

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1 h-0.5">
        {segments.map((bg, i) => (
          <div key={i} className={`flex-1 rounded-full ${bg} transition-all duration-500`} />
        ))}
      </div>
      {label && (
        <p className="text-[9px] font-medium text-muted text-right">{label}</p>
      )}
    </div>
  );
}

export default function SignupForm({ error: initialError }) {
  const initialErrorMessage =
    initialError === "invalid"
      ? "Please fill all required fields correctly."
      : initialError === "exists"
        ? "An account with that email already exists."
        : initialError === "mail"
          ? "We could not send the verification email. Please try again shortly."
        : initialError === "captcha"
          ? "Please complete the security check and try again."
          : initialError || "";

  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialErrorMessage);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [usingSecurityFallback, setUsingSecurityFallback] = useState(false);
  const [website, setWebsite] = useState("");

  const requiresHumanCheck = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const hasUsableToken =
    captchaToken.length >= 20 &&
    captchaToken !== "dev-no-captcha";
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!requiresHumanCheck || hasUsableToken || (!requiresHumanCheck && usingSecurityFallback));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const formData = new FormData(e.target);
    if (formData.get("password") !== formData.get("confirm")) {
      setErrorMsg("The passwords you entered do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "An error occurred during registration.");
        setLoading(false);
      } else if (data.success && data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      setErrorMsg("Network connection failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h2 className="text-xl font-black text-text tracking-tight mb-4">
          Create your account
        </h2>

        <div className="mb-3">
          <GoogleAuthButton mode="signup" next="/" />
        </div>
        <GoogleAuthDivider />

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/20 border-l-2 border-rose-500/60 rounded">
            <p className="text-xs font-semibold text-rose-200">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <input type="hidden" name="role" value="BUYER" />

          <div className="md:col-span-2">
            <label htmlFor="signup-email" className="block text-xs font-semibold text-muted mb-1">Email</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-xs font-semibold text-muted mb-1">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="John Doe"
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="signup-password" className="block text-xs font-semibold text-muted mb-1">Password</label>
            <div className="relative">
              <input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 pr-9 text-sm text-text outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow transition-all placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 bottom-2 text-muted hover:text-muted transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {password && <PasswordMeter password={password} />}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="confirm" className="block text-xs font-semibold text-muted mb-1">Confirm Password</label>
            <input
              id="confirm"
              name="confirm"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full bg-surface-overlay border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-accent-glow transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="md:col-span-2 pt-1">
            <div className="mb-3">
              <HumanCheck value={captchaToken} onChange={setCaptchaToken} onFallbackChange={setUsingSecurityFallback} compactMobile />
            </div>
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="w-full btn btn-success btn-lg"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : "Sign Up"}
              {!loading && <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs font-medium text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline underline-offset-2 font-semibold">
            Sign In
          </Link>
        </p>
        <p className="text-[10px] text-dim mt-2 text-center">
          By joining, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-muted">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-muted">Privacy Policy</Link>.
        </p>
      </div>
    </AuthLayout>
  );
}
