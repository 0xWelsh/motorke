"use client";
// src/components/LoginForm.js
import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, ArrowRight, ShieldCheck, ChevronRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Script from "next/script";
import HumanCheck from "./HumanCheck";

import AuthCarousel from "./AuthCarousel";

export default function LoginForm({ error }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [usingSecurityFallback, setUsingSecurityFallback] = useState(false);
  const [website, setWebsite] = useState("");
  
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasGoogleAuth = Boolean(googleClientId);
  const requiresHumanCheck = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const canSubmit = email.trim().length > 0 && password.length > 0 && (!requiresHumanCheck || captchaToken.length > 0 || usingSecurityFallback);
  
  return (
    <div className="min-h-screen flex overflow-hidden bg-white dark:bg-[#0a0a0a]">
      {/* Google Script */}
      {hasGoogleAuth && (
        <Script 
          src="https://accounts.google.com/gsi/client" 
          strategy="afterInteractive"
          onLoad={() => {
            if (!window.google || !googleClientId) return;
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              use_fedcm_for_prompt: false,
              callback: async (response) => {
                try {
                  const res = await fetch("/api/auth/google", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token: response.credential }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    window.location.href = data.destination || "/";
                  } else {
                    window.location.href = "/login?error=unknown";
                  }
                } catch (err) {
                  window.location.href = "/login?error=unknown";
                }
              },
            });
            const googleButtonContainer = document.getElementById("google-button-container");
            if (!googleButtonContainer) return;

            window.google.accounts.id.renderButton(
              googleButtonContainer,
              { 
                theme: "filled_black", 
                size: "large", 
                width: "full", 
                text: "signin_with",
                shape: "rectangular",
                logo_alignment: "center"
              }
            );
          }}
        />
      )}

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
          <Link href="/" className="p-12 flex items-center gap-3 group">
             <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:bg-[#38A169] transition-all">
                <img src="/headerlogo.png" alt="Logo" className="w-6 h-6 object-contain" />
             </div>
             <span className="text-xl font-black uppercase tracking-widest text-white italic">Welsh Motors</span>
          </Link>
          <AuthCarousel />
          <div className="mt-auto p-12 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
            © 2026 Welsh Motors Kenya • Part of Welsh Group
          </div>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 relative bg-white dark:bg-[#0a0a0a]">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-3 mb-12">
             <img src="/headerlogo.png" alt="Logo" className="w-8 h-8 object-contain" />
             <span className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white italic">Welsh Motors</span>
          </Link>

          <header className="mb-10 text-left">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-3 italic">
              Sign In.
            </h2>
            <p className="text-sm font-medium text-slate-400">Enter your email and password to continue.</p>
          </header>

          {error && (
            <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500">
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Login Error</p>
               <p className="text-sm font-bold text-slate-600 dark:text-rose-200">
                  {error === "invalid" && "The email or password entered is incorrect."}
                  {error === "inactive" && "This dealership account is currently inactive."}
                  {error === "captcha" && "Connection failed. Check your connection."}
                  {error === "too_many" && "Too many attempts. Please try again later."}
                  {error === "unknown" && "A system error occurred. Please try again."}
               </p>
            </div>
          )}

          <form action="/api/auth/login" method="POST" className="space-y-6">
            <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            <div>
              <label htmlFor="emailAddress" className="block text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-3">Email</label>
              <input 
                id="emailAddress"
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="dealership@welshmotors.co.ke" 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                style={{ borderRadius: '2px' }}
              />
            </div>

            <div className="relative">
              <label htmlFor="securePassword" className="block text-[11px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-3">Password</label>
              <input 
                id="securePassword"
                name="password" 
                type={showPassword ? "text" : "password"}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700 pr-12"
                style={{ borderRadius: '2px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-4 text-slate-300 hover:text-[#38A169] transition-colors"
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

            <div className="pt-4">
               <HumanCheck value={captchaToken} onChange={setCaptchaToken} onFallbackChange={setUsingSecurityFallback} />
            </div>

            <button 
              type="submit" 
              disabled={!canSubmit}
              className="w-full bg-[#38A169] hover:bg-[#2F855A] disabled:bg-slate-100 dark:disabled:bg-zinc-900 disabled:text-slate-400 text-white py-5 px-6 font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[0.98] active:scale-95 flex items-center justify-center gap-3 group"
              style={{ borderRadius: '2px' }}
            >
              Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {hasGoogleAuth && (
              <div className="pt-6 relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-100 dark:border-zinc-900"></div>
                </div>
                <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.2em]">
                  <span className="bg-transparent px-4 text-slate-400">or connect with</span>
                </div>
                
                <div className="mt-8 flex justify-center">
                  <div id="google-button-container" className="w-full flex justify-center min-h-[44px] bg-transparent" />
                </div>
              </div>
            )}
          </form>

          <footer className="mt-12 pt-8 border-t border-slate-100 dark:border-zinc-900">
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
