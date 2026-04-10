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
  const [website, setWebsite] = useState("");
  
  // Google OAuth only available if client ID is configured
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const hasGoogleAuth = Boolean(googleClientId);
  const requiresHumanCheck = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const canSubmit = email.trim().length > 0 && password.length > 0 && (!requiresHumanCheck || captchaToken.length > 0);
  
  // Basic inline validation
  const isValidEmail = email.includes("@") && email.includes(".");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.08),transparent_38%),radial-gradient(circle_at_80%_85%,rgba(15,23,42,0.08),transparent_40%),#FCFCFD]">
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

      <section className="h-dvh px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[520px] max-h-[94dvh] overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_56px_rgba(15,23,42,0.08)] p-4 sm:p-6 lg:p-7 relative">
          <Link
            href="/"
            className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-black transition-all hover:gap-4"
          >
            Back to Showroom <ArrowLeft className="w-3 h-3 rotate-180" />
          </Link>

          <div className="w-full max-w-[410px] mx-auto mt-8 sm:mt-6">
            {/* Logo & Header */}
          <header className="mb-4 text-center">
               <div className="inline-flex items-center gap-3 mb-3">
                <img src="/favicon.svg" alt="Motorke" className="h-10 w-10 object-contain rounded-xl" />
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Auth</span>
               </div>
            <h1 className="text-3xl sm:text-[2rem] font-black text-slate-900 tracking-tighter mb-1.5 leading-tight">Welcome Back!</h1>
            </header>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-7 h-7 bg-rose-200 rounded-lg flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                  <Lock size={14} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1 leading-none">Authentication Failed</p>
                   <p className="text-[11px] font-bold text-rose-600 leading-tight">
                     {error === "invalid" && "The email or password you entered is incorrect."}
                     {error === "inactive" && "This account has been deactivated. Please contact support."}
                     {error === "captcha" && "Please complete the security check and try again."}
                     {error === "unknown" && "An unexpected error occurred. Please try again."}
                   </p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form action="/api/auth/login" method="POST" className="space-y-3.5">
               <input
                 type="hidden"
                 name="captchaToken"
                 value={captchaToken}
                 readOnly
               />
               <input
                 type="text"
                 name="website"
                 value={website}
                 onChange={(e) => setWebsite(e.target.value)}
                 tabIndex={-1}
                 autoComplete="off"
                 className="hidden"
                 aria-hidden="true"
               />

               <div className="space-y-1.5 relative">
                  <label htmlFor="emailAddress" className="text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] ml-1">Email Address</label>
                  <div className="relative">
                    <input 
                      id="emailAddress"
                      name="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      autoComplete="email"
                      placeholder="e.g. james@dealership.com" 
                      className={`w-full bg-white border ${isValidEmail ? 'border-emerald-500' : 'border-slate-100'} rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100 pr-11`}
                    />
                    {isValidEmail && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />}
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label htmlFor="securePassword" className="text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] ml-1">Enter Password</label>
                  <div className="relative group">
                    <input 
                      id="securePassword"
                      name="password" 
                      type={showPassword ? "text" : "password"}
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      placeholder="••••••••" 
                      className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100 pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between ml-1 pt-0.5">
                 <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer group">
                   <div className="relative flex items-center justify-center w-5 h-5 bg-white border border-slate-200 rounded text-transparent group-hover:border-emerald-500 transition-colors">
                     <input type="checkbox" id="rememberMe" name="remember" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                     <CheckCircle2 size={14} className="peer-checked:text-emerald-500 transition-colors" />
                   </div>
                   <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Remember Me</span>
                 </label>
               </div>

               <div className="space-y-1.5">
                 <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] ml-1">Are You Human?</p>
                 <HumanCheck value={captchaToken} onChange={setCaptchaToken} />
               </div>

               <button 
                 type="submit" 
                 disabled={!canSubmit}
                 className="w-full bg-slate-950 hover:bg-black disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-2.5 active:scale-[0.98]"
               >
                 Log In <ChevronRight size={14} className="opacity-40" />
               </button>

               <div className="relative pt-0.5">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-slate-100"></div>
                 </div>
                 <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.25em]">
                   <span className="bg-white px-4 text-slate-700">Continue with Google</span>
                 </div>
               </div>

               <div className="flex justify-center">
                 <div id="google-button-container" className="w-full max-w-[320px]" />
               </div>
            </form>

            <footer className="mt-4 pt-3 border-t border-slate-100 text-center">
               <p className="text-sm font-bold text-slate-900">
                  New to our marketplace?{" "}
                <Link href="/signup" className="text-slate-900 hover:text-emerald-500 transition-colors border-b-2 border-slate-900/10 hover:border-emerald-500/10 pb-0.5">Create an Account</Link>
               </p>
            </footer>
             </div>
            </div>
      </section>
    </div>
  );
}
