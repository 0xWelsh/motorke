"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import HumanCheck from "./HumanCheck";
import GoogleAuthButton, { GoogleAuthDivider } from "./GoogleAuthButton";
import AuthLayout from "./AuthLayout";

export default function LoginForm({ error }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [usingSecurityFallback, setUsingSecurityFallback] = useState(false);
  const [website, setWebsite] = useState("");

  const searchParams = useSearchParams();
  const next = searchParams?.get("from") || searchParams?.get("next") || "/";

  const requiresHumanCheck = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const hasUsableToken =
    captchaToken.length >= 20 &&
    captchaToken !== "dev-no-captcha";
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!requiresHumanCheck || hasUsableToken || (!requiresHumanCheck && usingSecurityFallback));

  return (
    <AuthLayout>
      <div className="w-full">
        <h2 className="text-xl font-black text-slate-900 tracking-tight mb-5">
          Welcome back
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/20 border-l-2 border-rose-500/60 rounded">
            <p className="text-xs font-semibold text-rose-200">
              {error === "invalid" && "The email or password entered is incorrect."}
              {error === "inactive" && "This account is currently inactive. Please contact support."}
              {error === "captcha" && "Connection failed. Check your connection."}
              {error === "too_many" && "Too many attempts. Please try again later."}
              {error === "unknown" && "A system error occurred. Please try again."}
              {error === "oauth_unavailable" && "Google sign-in is not configured. Please use email."}
              {error === "oauth_invalid" && "Google sign-in request was invalid. Please try again."}
              {error === "oauth_state" && "Your Google sign-in session expired. Please try again."}
              {error === "oauth_exchange" && "We could not verify your Google session. Please try again."}
              {error === "oauth_verify" && "Google did not return a valid profile. Please try again."}
              {error === "oauth_user" && "We could not set up your account. Please try email signup."}
              {error === "oauth_cancelled" && "Google sign-in was cancelled."}
            </p>
          </div>
        )}

        <GoogleAuthButton mode="signin" next={next} />
        <GoogleAuthDivider />

        <form action="/api/auth/login" method="POST" className="space-y-3">
          <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
          <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <div>
            <label htmlFor="emailAddress" className="block text-xs font-semibold text-slate-500 mb-1">
              Email
            </label>
            <input
              id="emailAddress"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169]/30 transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="relative">
            <label htmlFor="securePassword" className="block text-xs font-semibold text-slate-500 mb-1">
              Password
            </label>
            <input
              id="securePassword"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
              className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 pr-9 text-sm text-slate-900 outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169]/30 transition-all placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 bottom-2 text-slate-500 hover:text-slate-500 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" name="remember" className="w-3 h-3 rounded border border-slate-300 bg-slate-100 checked:bg-[#38A169] checked:border-[#38A169] accent-[#38A169]" />
              <span className="text-[10px] font-medium text-slate-500 group-hover:text-slate-500 transition-colors">Remember</span>
            </label>
            <Link href="/forgot-password" className="text-[10px] font-medium text-slate-500 hover:text-[#38A169] transition-colors">
              Forgot password?
            </Link>
          </div>

          <HumanCheck value={captchaToken} onChange={setCaptchaToken} onFallbackChange={setUsingSecurityFallback} compactMobile />

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full btn btn-success btn-lg"
          >
            Sign In
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <p className="mt-4 text-center text-xs font-medium text-slate-500">
          New here?{" "}
          <Link href="/signup" className="text-[#38A169] hover:underline underline-offset-2 font-semibold">
            Sign Up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
