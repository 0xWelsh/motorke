"use client";
// src/components/LoginForm.js
import { useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, ChevronRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Script from "next/script";
import AuthCarousel from "./AuthCarousel";

export default function LoginForm({ error }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Basic inline validation
  const isValidEmail = email.includes("@") && email.includes(".");

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Script 
        src="https://accounts.google.com/gsi/client" 
        strategy="afterInteractive"
        onLoad={() => {
          if (!window.google) return;
          window.google.accounts.id.initialize({
            client_id: "660578051558-vigoibi56aj4elh0r9gh4cvjtff9asee.apps.googleusercontent.com",
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
          window.google.accounts.id.renderButton(
            document.getElementById("google-button-container"),
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

      <AuthCarousel />

      {/* ── FORM SECTION (Right) ── */}
      <section className="flex-1 flex flex-col items-center justify-center p-8 sm:p-20 bg-[#FCFCFD] relative">
         
         <Link 
           href="/" 
           className="absolute top-10 right-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:text-black transition-all hover:gap-4"
         >
           Back to Showroom <ArrowLeft className="w-3 h-3 rotate-180" />
         </Link>

         <div className="w-full max-w-[420px]">
            {/* Logo & Header */}
            <header className="mb-16 text-center lg:text-left">
               <div className="inline-flex items-center gap-3 mb-10">
                  <img src="/logo.png" alt="Motorske" className="h-10 w-auto object-contain" />
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Auth</span>
               </div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-3 leading-tight">Welcome Back.</h1>
               <p className="text-slate-700 font-medium text-sm">Please enter your credentials to access your portal.</p>
            </header>

            {/* Error Message */}
            {error && (
              <div className="mb-10 p-5 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-8 h-8 bg-rose-200 rounded-xl flex items-center justify-center text-rose-600 shadow-sm shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                   <p className="text-[11px] font-black text-rose-900 uppercase tracking-widest mb-1 leading-none">Authentication Failed</p>
                   <p className="text-[11px] font-bold text-rose-600 leading-tight">
                     {error === "invalid" && "The email or password you entered is incorrect."}
                     {error === "inactive" && "This account has been deactivated. Please contact support."}
                     {error === "unknown" && "An unexpected error occurred. Please try again."}
                   </p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form action="/api/auth/login" method="POST" className="space-y-8">
               <div className="space-y-3 relative">
                  <label htmlFor="emailAddress" className="text-[10px] font-black text-slate-700 uppercase tracking-[0.25em] ml-1">Email Address</label>
                  <div className="relative">
                    <input 
                      id="emailAddress"
                      name="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                      placeholder="e.g. james@dealership.com" 
                      className={`w-full bg-white border ${isValidEmail ? 'border-emerald-500' : 'border-slate-100'} rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100 pr-12`}
                    />
                    {isValidEmail && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />}
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label htmlFor="securePassword" className="text-[10px] font-black text-slate-700 uppercase tracking-[0.25em]">Secure Password</label>
                    <Link href="#" className="text-[9px] font-black text-slate-600 hover:text-emerald-500 uppercase tracking-widest transition-colors">Recover Account</Link>
                  </div>
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
                      className="w-full bg-white border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm shadow-slate-100 pr-14"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between ml-1 pb-2">
                 <label htmlFor="rememberMe" className="flex items-center gap-2 cursor-pointer group">
                   <div className="relative flex items-center justify-center w-5 h-5 bg-white border border-slate-200 rounded text-transparent group-hover:border-emerald-500 transition-colors">
                     <input type="checkbox" id="rememberMe" name="remember" className="absolute opacity-0 w-full h-full cursor-pointer peer" />
                     <CheckCircle2 size={14} className="peer-checked:text-emerald-500 transition-colors" />
                   </div>
                   <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest group-hover:text-slate-900 transition-colors">Remember Me</span>
                 </label>
               </div>

               <button 
                 type="submit" 
                 className="w-full bg-slate-950 hover:bg-black text-white rounded-2xl py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-[0.98]"
               >
                 Authenticate Access <ChevronRight size={14} className="opacity-40" />
               </button>
            </form>

            <div className="relative my-12">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
               </div>
               <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.25em]">
                  <span className="bg-[#FCFCFD] px-5 text-slate-700">Social Connect</span>
               </div>
            </div>

            <div className="flex justify-center">
               <div id="google-button-container" className="w-full max-w-[320px] transition-transform hover:scale-[1.02]" />
            </div>

            <footer className="mt-16 pt-12 border-t border-slate-50 text-center lg:text-left">
               <p className="text-sm font-bold text-slate-900">
                  New to our marketplace?{" "}
                  <Link href="/signup" className="text-slate-900 hover:text-emerald-500 transition-colors border-b-2 border-slate-900/10 hover:border-emerald-500/10 pb-0.5">Explore Dealer Subscription</Link>
               </p>
               
               <div className="mt-10 flex flex-col lg:flex-row items-center gap-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                     MotorsKe © 2026
                  </p>
               </div>
            </footer>
         </div>
      </section>
    </div>
  );
}
