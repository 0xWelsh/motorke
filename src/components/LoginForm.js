"use client";
// src/components/LoginForm.js
import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, ChevronRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Script from "next/script";
import HumanCheck from "./HumanCheck";

export default function LoginForm({ error }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [usingSecurityFallback, setUsingSecurityFallback] = useState(false);
  const [website, setWebsite] = useState("");
  
  // Google OAuth only available if client ID is configured
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasGoogleAuth = Boolean(googleClientId);
  const requiresHumanCheck = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const canSubmit = email.trim().length > 0 && password.length > 0 && (!requiresHumanCheck || captchaToken.length > 0 || usingSecurityFallback);
  
  // Basic inline validation
  const isValidEmail = email.includes("@") && email.includes(".");

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/backgrounds/pexels-criticalimagery-36840206.jpg"
          alt="Login Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px]" />
      </div>
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
                theme: "outline", 
                size: "large", 
                width: "320", 
                text: "signin_with",
                shape: "pill",
                logo_alignment: "left"
              }
            );
          }}
        />
      )}

      <section className="relative z-10 w-full px-4 py-8 sm:px-6 sm:py-12 flex items-center justify-center">
        <div className="w-full max-w-md bg-white/90 dark:bg-[#111111]/90 backdrop-blur-md border border-white/20 dark:border-slate-800 p-8 sm:p-10 shadow-2xl rounded-3xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/headerlogo.png" alt="Motorke" className="h-8 w-8 object-contain" />
              <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Motorke</h1>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Welcome Back</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[#111111] border border-red-500 rounded-2xl">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-red-500 mb-1">Sign in failed</p>
              <p className="text-[11px] font-bold text-red-400">
                {error === "invalid" && "Email or password is incorrect."}
                {error === "inactive" && "This account has been deactivated."}
                {error === "captcha" && "Security check failed. Please try again."}
                {error === "too_many" && "Too many login attempts. Please try again later."}
                {error === "unknown" && "Something went wrong. Please try again."}
              </p>
            </div>
          )}

          {/* Login Form */}
          <form action="/api/auth/login" method="POST" className="space-y-4">
            <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            {/* Email */}
            <div>
              <label htmlFor="emailAddress" className="block text-[11px] font-black uppercase tracking-[0.16em] text-slate-900 dark:text-white mb-2">Email Address</label>
              <input 
                id="emailAddress"
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                autoComplete="email"
                placeholder="you@dealership.com" 
                className="w-full border border-[#ddd4c8] dark:border-slate-800 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-0 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="securePassword" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">Password</label>
              <div className="relative">
                <input 
                  id="securePassword"
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••" 
                  className="w-full border border-[#ddd4c8] dark:border-slate-800 rounded-2xl bg-[#fbfcfe] dark:bg-[#111111] px-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-0 transition-all pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="rememberMe" name="remember" className="w-4 h-4 border border-[#ddd4c8] dark:border-slate-800 rounded-2xl checked:bg-[#ff5a2f] checked:border-[#ff5a2f] cursor-pointer accent-[#ff5a2f] outline-none cursor-pointer" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Keep me signed in</span>
            </label>

            {/* Security Check */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-900 dark:text-white mb-2 block">Security</label>
              <HumanCheck
                value={captchaToken}
                onChange={setCaptchaToken}
                onFallbackChange={setUsingSecurityFallback}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={!canSubmit}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-2xl-lg py-3.5 sm:py-2.5 font-semibold transition-all text-base sm:text-sm"
            >
              Sign In
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#ddd4c8] dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 text-xs text-slate-600">or continue with</span>
              </div>
            </div>

            {/* Google Button */}
            <div className="flex justify-center">
              <div id="google-button-container" className="w-full" />
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#ddd4c8] dark:border-slate-800 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mt-2">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-slate-900 dark:text-white hover:text-slate-700 transition-colors">
                Sign up
              </Link>
            </p>
            <p className="text-xs text-slate-500 mt-4">
              <Link href="/forgot-password" className="hover:text-slate-700 underline underline-offset-2">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
