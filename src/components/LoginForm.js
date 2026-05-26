"use client";
// src/components/LoginForm.js
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import HumanCheck from "./HumanCheck";
import GoogleAuthButton, { GoogleAuthDivider } from "./GoogleAuthButton";

import AuthCarousel from "./AuthCarousel";

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
  // A real captcha token from Turnstile/reCAPTCHA is at least 30 chars and
  // doesn't look like our internal fallback markers. We deliberately do not
  // accept `usingSecurityFallback` as a substitute when a provider is
  // configured, server would reject those tokens anyway and we shouldn't
  // pretend on the client that the form is submittable.
  const hasUsableToken =
    captchaToken.length >= 20 &&
    captchaToken !== "dev-no-captcha";
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (!requiresHumanCheck || hasUsableToken || (!requiresHumanCheck && usingSecurityFallback));

  return (
    <div className="min-h-screen flex overflow-hidden bg-white dark:bg-[#0a0a0a]">
      {/* Left: Cinematic Benefit Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/backgrounds/pexels-criticalimagery-36840206.jpg"
            alt="Cinematic Car"
            className="w-full h-full object-cover opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 w-full h-full flex flex-col">
          <AuthCarousel />
          <div className="mt-auto p-12 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
            © 2026 Welsh Motorhub Kenya, Part of Welsh Group
          </div>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col items-stretch px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12 lg:pt-16 relative bg-white dark:bg-[#0a0a0a] overflow-y-auto">
        <div className="w-full max-w-md mx-auto lg:max-w-lg">
          <header className="mb-6 text-left">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3">
              Sign In.
            </h2>
            <p className="text-sm font-medium text-slate-400">Enter your email and password to continue.</p>
          </header>

          {error && (
            <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500">
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Login Error</p>
               <p className="text-sm font-bold text-slate-600 dark:text-rose-200">
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

          <div className="mb-2">
            <GoogleAuthButton mode="signin" next={next} />
          </div>
          <GoogleAuthDivider />

          <form action="/api/auth/login" method="POST" className="space-y-4">
            <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <div>
              <label htmlFor="emailAddress" className="block text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Email</label>
              <input 
                id="emailAddress"
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="dealership@welshmotors.co.ke" 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                style={{ borderRadius: '2px' }}
              />
            </div>

            <div className="relative">
              <label htmlFor="securePassword" className="block text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Password</label>
              <input 
                id="securePassword"
                name="password" 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700 pr-12"
                style={{ borderRadius: '2px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 bottom-3 text-slate-300 hover:text-[#38A169] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" name="remember" className="w-4 h-4 border-2 border-slate-200 dark:border-zinc-800 rounded-none checked:bg-[#38A169] checked:border-[#38A169] transition-all accent-[#38A169]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-[#38A169] hover:underline underline-offset-4 decoration-2">
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
               <HumanCheck value={captchaToken} onChange={setCaptchaToken} onFallbackChange={setUsingSecurityFallback} compactMobile />
            </div>

            <button 
              type="submit" 
              disabled={!canSubmit}
              className="w-full bg-[#38A169] hover:bg-[#2F855A] disabled:bg-slate-100 dark:disabled:bg-zinc-900 disabled:text-slate-400 text-white py-4 px-6 font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[0.98] active:scale-95 flex items-center justify-center gap-3 group"
              style={{ borderRadius: '2px' }}
            >
              Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <footer className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-900">
             <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">
                New to the platform?{" "}
                <Link href="/signup" className="text-[#38A169] hover:underline underline-offset-4 decoration-2">
                   Sign Up
                </Link>
             </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
