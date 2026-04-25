"use client";
// src/components/SignupForm.js
import { useState, useEffect } from "react";
import { UserPlus, Building2, User, Loader2, ArrowLeft, ArrowRight, ShieldCheck, Eye, EyeOff, MapPin, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import LocationPicker from "./LocationPicker";
import Link from "next/link";
import Script from "next/script";
import HumanCheck from "./HumanCheck";

const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Machakos",
  "Kajiado","Muranga","Nyeri","Meru","Embu","Kilifi","Kwale","Laikipia","Other"
];

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
    score >= 1 ? (score < 3 ? "bg-rose-400" : (score === 3 ? "bg-amber-400" : "bg-[#38A169]")) : "bg-slate-100",
    score >= 2 ? (score < 3 ? "bg-rose-400" : (score === 3 ? "bg-amber-400" : "bg-[#38A169]")) : "bg-slate-100",
    score >= 3 ? (score === 3 ? "bg-amber-400" : "bg-[#38A169]") : "bg-slate-100",
    score >= 4 ? "bg-[#38A169]" : "bg-slate-100"
  ];
  
  let label = "Security Level";
  if (score === 0 && password) label = "Very Weak";
  else if (score === 1) label = "Weak";
  else if (score === 2) label = "Fair";
  else if (score === 3) label = "Good";
  else if (score === 4) label = "Strong";

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1.5 h-1">
        {segments.map((bg, i) => (
          <div key={i} className={`flex-1 rounded-2xl ${bg} transition-all duration-500`} />
        ))}
      </div>
      <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] text-right">{label}</p>
    </div>
  );
}

import AuthCarousel from "./AuthCarousel";

export default function SignupForm({ error: initialError, initialRole }) {
  const initialErrorMessage =
    initialError === "invalid"
      ? "Please fill all required fields correctly."
      : initialError === "exists"
        ? "An account with that email already exists."
        : initialError === "captcha"
          ? "Please complete the security check and try again."
          : initialError || "";

  const [role, setRole] = useState(initialRole === "DEALER" ? "DEALER" : "BUYER");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(initialErrorMessage);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [website, setWebsite] = useState("");
  
  const hasGoogleAuth = Boolean(googleClientId);
  const requiresHumanCheck = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  useEffect(() => {
    if (!hasGoogleAuth || !googleClientId) return;

    const initGoogle = () => {
      if (!window.google) return;
      
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        use_fedcm_for_prompt: false,
        callback: async (response) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: response.credential, action: "signup" }),
            });
            const data = await res.json();
            if (data.success) {
              window.location.href = data.destination || "/";
            } else {
              setErrorMsg("Google signup failed.");
            }
          } catch (err) {
            setErrorMsg("Network error during Google signup.");
          }
        },
      });

      const container = document.getElementById("google-signup-button");
      if (container) {
        window.google.accounts.id.renderButton(container, {
          theme: "filled_black",
          size: "large",
          width: "360", // Explicit width often works better than "full" in some iFrames
          text: "signup_with",
          shape: "rectangular",
          logo_alignment: "center",
        });
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      window.addEventListener("google-script-loaded", initGoogle);
    }
    
    return () => window.removeEventListener("google-script-loaded", initGoogle);
  }, [hasGoogleAuth, googleClientId]);

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
    <div className="min-h-screen flex overflow-hidden bg-white dark:bg-[#0a0a0a]">
      {hasGoogleAuth && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => {
            window.google_script_loaded = true;
            window.dispatchEvent(new Event("google-script-loaded"));
          }}
        />
      )}

      {/* Left: Cinematic Benefit Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-2/5 relative bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/backgrounds/pexels-criticalimagery-36840206.jpg"
            alt="Signup Concept"
            className="w-full h-full object-cover opacity-50 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 w-full h-full flex flex-col">
          <Link href="/" className="p-10 flex items-center gap-3 group">
             <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center group-hover:bg-[#38A169] transition-all">
                <img src="/headerlogo.png" alt="Logo" className="w-6 h-6 object-contain" />
             </div>
             <span className="text-xl font-black uppercase tracking-widest text-white italic">Welsh Motors</span>
          </Link>
          <AuthCarousel />
          <div className="mt-auto p-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
            © 2026 Welsh Motors Kenya • Professional Network
          </div>
        </div>
      </div>

      {/* Right: Form Side */}
      <div className="w-full lg:w-3/5 flex flex-col items-center p-6 sm:p-12 lg:p-16 lg:pt-24 relative bg-white dark:bg-[#0a0a0a] overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-6">
             <img src="/headerlogo.png" alt="Logo" className="w-6 h-6 object-contain" />
             <span className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white italic">Welsh Motors</span>
          </Link>

          <header className="mb-6 text-left">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-2 italic">
              Sign Up.
            </h2>
            <p className="text-xs font-medium text-slate-400">Enter your details below to create your account.</p>
          </header>

          {/* Role Toggle */}
          <div className="flex gap-2 mb-6 bg-slate-50 dark:bg-zinc-900 p-1 border border-slate-100 dark:border-zinc-800">
            <button 
              type="button" 
              onClick={() => setRole("BUYER")}
              className={clsx(
                "flex-1 py-2 px-4 font-black uppercase tracking-widest text-[9px] transition-all",
                role === "BUYER" 
                  ? "bg-white dark:bg-[#111] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-700" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              Personal
            </button>
            <button 
              type="button" 
              onClick={() => setRole("DEALER")}
              className={clsx(
                "flex-1 py-2 px-4 font-black uppercase tracking-widest text-[9px] transition-all",
                role === "DEALER" 
                  ? "bg-[#38A169] text-white shadow-md shadow-[#38A169]/20" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              Dealership
            </button>
          </div>

          {errorMsg && (
            <div className="mb-8 p-5 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500">
               <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Signup Error</p>
               <p className="text-sm font-bold text-slate-600 dark:text-rose-200">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <input type="hidden" name="captchaToken" value={captchaToken} readOnly />
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <input type="hidden" name="role" value={role} />

            <div className={role === "DEALER" ? "md:col-span-1" : "md:col-span-2"}>
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Email</label>
              <input 
                id="email"
                name="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="you@email.com" 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                style={{ borderRadius: '2px' }}
              />
            </div>

            <div className={role === "DEALER" ? "md:col-span-1" : "md:col-span-2"}>
              <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Full Name</label>
              <input 
                id="name"
                name="name" 
                type="text" 
                required 
                placeholder="John Doe" 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                style={{ borderRadius: '2px' }}
              />
            </div>

            <div className="md:col-span-1">
              <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Password</label>
              <div className="relative">
                <input 
                  id="password"
                  name="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  placeholder="••••••••" 
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700 pr-12"
                  style={{ borderRadius: '2px' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 bottom-4 text-slate-300 hover:text-[#38A169]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && <PasswordMeter password={password} />}
            </div>

            <div className="md:col-span-1">
              <label htmlFor="confirm" className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Confirm Password</label>
              <input 
                id="confirm"
                name="confirm" 
                type={showPassword ? "text" : "password"}
                required 
                placeholder="••••••••" 
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                style={{ borderRadius: '2px' }}
              />
            </div>

            {role === "DEALER" && (
              <>
                <div className="md:col-span-2 pt-2">
                   <div className="h-px bg-slate-100 dark:bg-zinc-900 w-full mb-4" />
                   <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#38A169] mb-4">Business Information</h4>
                </div>
                
                <div className="md:col-span-1">
                  <label htmlFor="dealerName" className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Dealership Title</label>
                  <input 
                    id="dealerName"
                    name="dealerName" 
                    type="text" 
                    required
                    placeholder="Japanese Car Exports" 
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                    style={{ borderRadius: '2px' }}
                  />
                </div>

                <div className="md:col-span-1">
                  <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Primary Phone</label>
                  <input 
                    id="phone"
                    name="phone" 
                    type="tel" 
                    required
                    placeholder="+254 7__ ___ ___" 
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all placeholder:text-slate-300 dark:placeholder:text-zinc-700"
                    style={{ borderRadius: '2px' }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="county" className="block text-[10px] font-black uppercase tracking-[0.25em] text-[#38A169] mb-2">Base County</label>
                  <select 
                    id="county"
                    name="county"
                    required
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-[#38A169] focus:ring-1 focus:ring-[#38A169] transition-all appearance-none cursor-pointer"
                    style={{ borderRadius: '2px' }}
                  >
                    <option value="" className="text-slate-900 dark:text-white dark:bg-[#0a0a0a]">Select a county</option>
                    {COUNTIES.map((c) => (
                      <option key={c} value={c} className="text-slate-900 dark:text-white dark:bg-[#0a0a0a]">{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="md:col-span-2 pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#38A169] hover:bg-[#2F855A] disabled:bg-slate-100 dark:disabled:bg-zinc-900 disabled:text-slate-400 text-white py-4 px-6 font-black uppercase tracking-[0.2em] text-xs transition-all hover:scale-[0.98] active:scale-95 flex items-center justify-center gap-3 group mb-2"
                style={{ borderRadius: '2px' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign Up"}
                {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>
              
              {hasGoogleAuth && (
                 <div className="pt-6 relative">
                   <div className="absolute inset-0 flex items-center" aria-hidden="true">
                     <div className="w-full border-t border-slate-100 dark:border-zinc-900"></div>
                   </div>
                   <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.2em]">
                     <span className="bg-transparent px-4 text-slate-400 font-bold">or join with</span>
                   </div>
                   
                   <div className="mt-6 flex justify-center min-h-[44px]">
                     <div id="google-signup-button" className="w-full flex justify-center bg-transparent" />
                   </div>
                 </div>
              )}
            </div>
          </form>

          <footer className="mt-8 pt-4 border-t border-slate-100 dark:border-zinc-900 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-[#38A169] hover:underline underline-offset-4 decoration-2">
                Sign In
              </Link>
            </p>
            <p className="text-[9px] text-slate-400 mt-4 leading-relaxed">
              By joining the network, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[#38A169]">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline underline-offset-2 hover:text-[#38A169]">Privacy Policy</Link>.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
